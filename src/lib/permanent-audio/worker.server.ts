import { audioCatalog } from "./catalog.server";
import { audioDb, rpc, stored, upload, version, event } from "./store.server";
import { wavToMp3, inspectMp3, pcm16Wav } from "./codec.server";
import type { AudioJob } from "./types";
import { generateSpeech } from "../ttsGenerate.server";
const configured = (key: string, fallback: number, min: number, max: number) => {
  const n = Number(process.env[key] ?? fallback);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
};
export function retryAfterSeconds(value: string | null, now = Date.now()) {
  if (!value) return null;
  const n = Number(value);
  const seconds = Number.isFinite(n) ? n : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) ? Math.max(0, seconds) : null;
}
export async function workOneAudioJob() {
  const jobs = await rpc<AudioJob[]>("lesson_mp3_claim");
  const job = jobs[0];
  if (!job) return { state: "idle" };
  const checkpoint = async (patch: Record<string, unknown>) => {
    if (
      !(await rpc<boolean>("lesson_mp3_checkpoint", {
        p_job: job.id,
        p_token: job.token,
        p_patch: patch,
      }))
    )
      throw Error("Audio worker lease expired");
  };
  let blockedUntil: string | undefined;
  let successfulProvider: { provider: string; model: string } | undefined;
  try {
    const clip = (await audioCatalog()).find((c) => c.id === job.clip_id),
      row = await version(job.version_id);
    if (!clip || !clip.pilot || !row || row.script_hash !== clip.script_hash)
      throw Error("Pilot script changed or clip is outside the enabled pilot");
    const base = `grade-${clip.grade}/unit-${String(clip.unit).padStart(2, "0")}/${clip.section}/${row.id}`;
    // Deterministic paths recover a completed upload even if the worker died before checkpointing.
    const mp3Path = `${base}/audio.mp3`,
      rawPath = `${base}/source.wav`;
    const recovered = await stored(mp3Path);
    if (recovered) {
      const info = inspectMp3(recovered);
      await checkpoint({
        status: "pending",
        storage_path: mp3Path,
        bytes: info.bytes,
        duration: info.duration,
      });
      await event(row.id, "recovered_mp3");
      return { state: "pending", reused: true };
    }
    let raw = await stored(rawPath);
    if (!raw && !job.regenerate) raw = await stored(clip.legacy_path, clip.legacy_bucket);
    if (raw) {
      pcm16Wav(raw);
      await upload(rawPath, raw, "audio/wav");
      await checkpoint({ raw_path: rawPath, raw_bytes: raw.length });
      await event(row.id, "reused_wav");
    } else {
      if (!(job as AudioJob & { allow_generation?: boolean }).allow_generation)
        throw Error(
          "No stored audio found. Explicit Retry Failed confirmation is required before a new paid request.",
        );
      if (!clip.text.trim() || clip.text.length > 3500)
        throw Error("Script exceeds the existing speech input limit");
      const pacedFetch: typeof fetch = async (input, init) => {
        const gateway = String(input).includes("ai.gateway.lovable.dev");
        const provider = gateway ? "lovable_gateway" : "direct_gemini";
        const configuredModel = gateway
          ? process.env.LOVABLE_TTS_MODEL?.trim() || "google/gemini-2.5-flash-tts"
          : process.env.GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";
        const requestModel =
          gateway && typeof init?.body === "string"
            ? (() => {
                try {
                  return JSON.parse(init.body).model;
                } catch {
                  return null;
                }
              })()
            : null;
        const model = typeof requestModel === "string" ? requestModel : configuredModel;
        let permit: { id?: string; wait: number; reason?: string } | undefined;
        for (let attempt = 0; attempt < 2; attempt++) {
          permit = await rpc("lesson_mp3_reserve", {
            p_job: job.id,
            p_token: job.token,
            p_provider: provider,
            p_model: model,
            p_interval: configured("AUDIO_MP3_INTERVAL_SECONDS", 30, 20, 3600),
            p_daily: configured("AUDIO_MP3_DAILY_REQUESTS", 10, 1, 100000),
            p_tokens: Math.ceil(clip.text.length * 3),
            p_tpm: configured("AUDIO_MP3_INPUT_TOKENS_PER_MINUTE", 10000, 1000, 10000000),
          });
          if (permit?.id) break;
          if (permit?.reason !== "pacing" || permit.wait > 60) {
            blockedUntil = new Date(
              Date.now() + Math.max(permit?.wait ?? 60, 20) * 1000,
            ).toISOString();
            throw Error("Configured audio generation budget/pacing reached");
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(60, permit?.wait ?? 20) * 1000),
          );
        }
        if (!permit?.id) throw Error("Audio generation pacing is busy");
        const record = async (status: number) => {
          const { error } = await audioDb()
            .from("lesson_mp3_events")
            .update({ http_status: status })
            .eq("id", permit!.id!);
          if (error) throw Error("Audio request outcome could not be recorded");
        };
        try {
          const response = await fetch(input, init);
          await record(response.status);
          if (response.ok) successfulProvider = { provider, model };
          if ([429, 503].includes(response.status)) {
            const retry =
              retryAfterSeconds(response.headers.get("Retry-After")) ??
              (response.status === 429 ? 3600 : 60);
            blockedUntil = new Date(Date.now() + Math.max(retry, 20) * 1000).toISOString();
            await rpc("lesson_mp3_backoff", {
              p_job: job.id,
              p_token: job.token,
              p_provider: provider,
              p_seconds: Math.max(retry, 20),
            });
          }
          return response;
        } catch (error) {
          await record(0);
          throw error;
        }
      };
      // Same prompts, Puck mapping, provider order and direct Gemini fallback as ordinary speech.
      const result = await generateSpeech({
        text: clip.text,
        voice: "sarah",
        provider: clip.source === "classroom" ? "gemini" : undefined,
        speed: 1,
        signal: AbortSignal.timeout(180000),
        fetcher: pacedFetch,
      });
      if (!result.ok)
        throw Error(
          `Speech provider unavailable (${result.status}). Job stopped; check quota before retrying.`,
        );
      if (result.headers.get("Content-Type")?.split(";")[0] !== "audio/wav")
        throw Error(
          "Fixed Puck library requires PCM/WAV; alternate voice output was not published",
        );
      raw = new Uint8Array(await result.arrayBuffer());
      pcm16Wav(raw);
      await upload(rawPath, raw, "audio/wav");
      await checkpoint({
        raw_path: rawPath,
        provider: successfulProvider?.provider ?? "gemini",
        model: successfulProvider?.model,
        raw_bytes: raw.length,
      });
      await event(row.id, "new_audio");
    }
    const mp3 = wavToMp3(raw);
    await upload(mp3Path, mp3.bytes, "audio/mpeg");
    await checkpoint({
      status: "pending",
      storage_path: mp3Path,
      bytes: mp3.bytes.length,
      duration: mp3.duration,
    });
    await event(row.id, "converted_mp3");
    return { state: "pending", version: row.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audio processing failed";
    await checkpoint({
      status: "failed",
      error: message.slice(0, 250),
      blocked_until: blockedUntil,
    }).catch(() => undefined);
    return { state: "failed", message };
  }
}
