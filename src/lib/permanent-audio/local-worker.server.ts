import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { audioCatalog, type AudioClip } from "./catalog.server";
import { inspectMp3, wavToMp3 } from "./codec.server";
import { rpc, stored, upload, version } from "./store.server";
import type { AudioJob } from "./types";

const MAX_WAV_BYTES = 32 * 1024 * 1024;
const uuid = z.string().uuid();
const updateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim") }),
  z.object({
    action: z.literal("heartbeat"),
    id: uuid,
    token: uuid,
    progress: z.number().int().min(0).max(90),
  }),
  z.object({
    action: z.literal("fail"),
    id: uuid,
    token: uuid,
    reason: z.enum(["timeout", "render", "lease", "upload", "script"]),
  }),
]);
const failures = {
  timeout: "Local synthesis timed out. Check the Mac console before retrying.",
  render: "VoxCPM2 could not render the clip. Check the companion output.",
  lease: "The Mac companion lost its job lease. Retry from Audio Manager.",
  upload: "The companion could not submit its WAV. Resume stored audio or retry.",
  script: "The companion could not verify the fixed transcript.",
};
type LocalJob = AudioJob & { asset_token: string | null; allow_generation: boolean };

function secret() {
  const value = process.env.AUDIO_LOCAL_WORKER_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export const localAudioEnabled = () => Boolean(secret());

async function step(job: Pick<AudioJob, "id" | "token">, stage: string, patch = {}, progress = 0) {
  const [current] = await rpc<LocalJob[]>("lesson_mp3_local_step", {
    p_job: job.id,
    p_token: job.token,
    p_stage: stage,
    p_patch: patch,
    p_progress: progress,
  });
  return current;
}

async function transcript(job: LocalJob) {
  const clip = (await audioCatalog()).find((item) => item.id === job.clip_id);
  const row = await version(job.version_id);
  if (
    !clip ||
    !row ||
    row.clip_id !== clip.id ||
    row.provider !== "voxcpm2_local" ||
    clip.script_hash !== row.script_hash
  )
    return null;
  return { clip, text: row.script_text ?? clip.text };
}

function assetPaths(clip: AudioClip, job: LocalJob, asset: string) {
  const base = `grade-${clip.grade}/unit-${String(clip.unit).padStart(2, "0")}/${clip.section}/${job.version_id}/local-${asset}`;
  return { raw: `${base}/source.wav`, mp3: `${base}/audio.mp3` };
}

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const conflict = () => json({ error: "Job lease expired or the script changed" }, 409);

async function publishForReview(clip: AudioClip, job: LocalJob, asset: string, wav: Uint8Array) {
  const paths = assetPaths(clip, job, asset);
  let mp3: ReturnType<typeof wavToMp3>;
  try {
    mp3 = wavToMp3(wav);
  } catch {
    await step(job, "failed", { error: "Invalid or silent PCM16 WAV. Retry on the Mac." });
    return json({ error: "Invalid or silent PCM16 WAV" }, 422);
  }
  await upload(paths.raw, wav, "audio/wav");
  await upload(paths.mp3, mp3.bytes, "audio/mpeg");
  const saved = await step(job, "pending", {
    raw_path: paths.raw,
    storage_path: paths.mp3,
    raw_bytes: wav.length,
    bytes: mp3.bytes.length,
    duration: inspectMp3(mp3.bytes).duration,
  });
  return saved ? json({ state: "pending" }) : conflict();
}

async function readBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader || Number(request.headers.get("content-length")) > limit) {
    await reader?.cancel();
    return null;
  }
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.length;
      if (bytes > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return buffer;
}

async function claim() {
  const [job] = await rpc<LocalJob[]>("lesson_mp3_local_claim");
  if (!job) return json({ state: "idle" });
  const source = await transcript(job);
  if (!source?.text.trim() || source.text.length > 3500) {
    await step(job, "failed", {
      error: "The fixed script changed, is unavailable, or is too long.",
    });
    return json({ state: "failed" });
  }
  if (job.asset_token) {
    const saved = await stored(assetPaths(source.clip, job, job.asset_token).raw);
    if (saved) return publishForReview(source.clip, job, job.asset_token, saved);
  }
  if (!job.allow_generation) {
    await step(job, "failed", {
      error: "No saved WAV. Use Retry failed audio to render it on the Mac.",
    });
    return json({ state: "failed" });
  }
  return json({
    state: "claimed",
    id: job.id,
    token: job.token,
    text: source.text,
    sha256: createHash("sha256").update(source.text).digest("hex"),
    lesson: source.clip.lesson_id,
    order: source.clip.segment_order,
  });
}

export async function localWorkerPost(request: Request) {
  const key = secret();
  if (!key) return json({ error: "Local companion is not configured" }, 503);
  const expected = Buffer.from(`Bearer ${key}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return json({ error: "Unauthorized" }, 401);

  try {
    const type = request.headers.get("content-type")?.split(";")[0];
    if (type === "audio/wav") {
      const id = uuid.safeParse(request.headers.get("x-audio-job"));
      const token = uuid.safeParse(request.headers.get("x-audio-lease"));
      if (!id.success || !token.success) return json({ error: "Invalid job or lease" }, 400);
      const job = await step({ id: id.data, token: token.data }, "beat", {}, 90);
      if (!job) {
        const completed = await step({ id: id.data, token: token.data }, "attach");
        return completed?.state === "complete" ? json({ state: "pending" }) : conflict();
      }
      if (!job.allow_generation) return conflict();
      const source = await transcript(job);
      if (!source) return conflict();
      const wav = await readBody(request, MAX_WAV_BYTES);
      if (!wav) return json({ error: "WAV payload too large" }, 413);
      const uploadJob = await step(job, "attach");
      if (!uploadJob) return conflict();
      if (uploadJob.state === "complete") return json({ state: "pending" });
      return publishForReview(source.clip, uploadJob, uploadJob.token, wav);
    }
    if (type !== "application/json") return json({ error: "Unsupported content type" }, 415);
    const bytes = await readBody(request, 1024);
    if (!bytes) return json({ error: "Request too large" }, 413);
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return json({ error: "Invalid request" }, 400);
    }
    const action = updateSchema.safeParse(input);
    if (!action.success) return json({ error: "Invalid worker action" }, 400);
    const data = action.data;
    if (data.action === "claim") return await claim();
    const job =
      data.action === "heartbeat"
        ? await step(data, "beat", {}, data.progress)
        : await step(data, "failed", { error: failures[data.reason] });
    return job ? json({ state: job.state }) : conflict();
  } catch (error) {
    console.error("[local-audio]", error instanceof Error ? error.message : "Operation failed");
    return json(
      { error: "The local audio operation failed. Check WAV format, storage, or migration 0022." },
      503,
    );
  }
}
