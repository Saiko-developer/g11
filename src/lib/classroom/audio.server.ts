import { hasAiProvider } from "@/lib/ai-provider.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateSpeech } from "@/lib/ttsGenerate.server";
import { spokenStepAt, type ReadingLesson } from "./types";
import { lessonHash } from "./manifest.server";

export async function classroomAudioIdentity(lesson: ReadingLesson, cursor: number) {
  const { step, narration: text } = spokenStepAt(lesson, cursor);
  const identity = JSON.stringify([
    // New teaching scripts use per-clip content identity: editing a later sentence
    // must not regenerate unchanged clips. Legacy Grade 11 hashes stay identical.
    lesson.teachingRevision
      ? `${lesson.id}:${lesson.version}:${lesson.teachingRevision}`
      : await lessonHash(lesson),
    cursor,
    step,
    text,
    "Puck",
    "classroom-audio-v1",
    process.env.LOVABLE_TTS_MODEL ?? "google/gemini-2.5-flash-tts",
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { hash, text, path: `clips/${hash}.wav` };
}
export async function readClassroomAudio(lesson: ReadingLesson, cursor: number): Promise<Response> {
  const { hash, path } = await classroomAudioIdentity(lesson, cursor);
  if (process.env.AUDIO_MP3_PILOT_PLAYBACK === "true") {
    const { approvedMp3 } = await import("@/lib/permanent-audio/playback.server");
    const approved = await approvedMp3(hash);
    if (approved) return approved;
  }
  const { data, error } = await supabaseAdmin
    .from("classroom_audio" as never)
    .select("state,lease_until,created_at,attempts")
    .eq("hash", hash)
    .maybeSingle();
  if (error) return Response.json({ error: "audio_service_unavailable" }, { status: 503 });
  if ((data as { state?: string } | null)?.state !== "ready")
    return Response.json(
      {
        error: "audio_not_ready",
        message: "ဆရာက အသံပြင်ဆင်ပေးရန် လိုနေပါသည်။ Manual Mode ဖြင့် ဖတ်နိုင်ပါတယ်။",
      },
      { status: 404 },
    );
  const { data: file, error: storageError } = await supabaseAdmin.storage
    .from("classroom-narration")
    .download(path);
  if (storageError || !file) return Response.json({ error: "audio_unavailable" }, { status: 503 });
  return new Response(await file.arrayBuffer(), {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" },
  });
}
export async function prepareClassroomAudio(lesson: ReadingLesson, cursor: number) {
  const { hash, path, text } = await classroomAudioIdentity(lesson, cursor);
  if (process.env.AUDIO_MP3_PILOT_PLAYBACK === "true") {
    const { approvedMp3 } = await import("@/lib/permanent-audio/playback.server");
    const approved = await approvedMp3(hash, true);
    if (approved) return approved;
  }
  // The generic speech service caps input at 3500 characters. Never silently truncate a class.
  if (!text.trim() || text.length > 3500)
    return Response.json({ error: "narration_script_too_long" }, { status: 422 });
  const existing = await supabaseAdmin
    .from("classroom_audio" as never)
    .select("state,lease_until,created_at,attempts")
    .eq("hash", hash)
    .maybeSingle();
  if (existing.error) return Response.json({ error: "audio_service_unavailable" }, { status: 503 });
  const row = existing.data as {
    state?: string;
    lease_until?: string;
    created_at?: string;
    attempts?: number;
  } | null;
  const state = row?.state;
  const expired = state === "preparing" && Date.parse(row?.lease_until ?? "") <= Date.now();
  if (state === "ready") return Response.json({ ok: true, cached: true });
  if (state === "preparing" && !expired) return pendingNarration();
  if (expired && (row?.attempts ?? 1) >= 3) return failedNarration();
  if (state === "failed") return failedNarration();
  if (!hasAiProvider())
    return Response.json(
      {
        error: "speech_provider_unavailable",
        message: "အသံဝန်ဆောင်မှုကို ချိတ်ဆက်မရပါ။ နောက်မှ ပြန်စမ်းပါ။",
      },
      { status: 503 },
    );
  const token = crypto.randomUUID();
  const { data, error } = await supabaseAdmin.rpc(
    "claim_classroom_audio_lease" as never,
    {
      p_hash: hash,
      p_lesson: lesson.id,
      p_version: lesson.version,
      p_path: path,
      p_token: token,
    } as never,
  );
  if (error) return Response.json({ error: "audio_service_unavailable" }, { status: 503 });
  if (!data) {
    // Another process may have won the unique claim. Only that process generates.
    const current = await supabaseAdmin
      .from("classroom_audio" as never)
      .select("state,lease_until,created_at,attempts")
      .eq("hash", hash)
      .maybeSingle();
    if (current.error)
      return Response.json({ error: "audio_service_unavailable" }, { status: 503 });
    const currentState = (current.data as { state?: string } | null)?.state;
    if (currentState === "ready") return Response.json({ ok: true, cached: true });
    if (currentState === "preparing") return pendingNarration();
    if (currentState === "failed") return failedNarration();
    // The claim function has no daily quota. An unexplained denial is a service error.
    return Response.json(
      {
        error: "narration_claim_unavailable",
        message: "အသံပြင်ဆင်မှုကို ယခု ချိတ်ဆက်မရပါ။ ခဏနားပြီး ပြန်စမ်းပါ။",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const markReady = async (bytes: number) => {
    const saved = await supabaseAdmin
      .from("classroom_audio" as never)
      .update({ state: "ready", bytes, lease_until: null, last_error: null } as never)
      .eq("hash", hash)
      .eq("generation_token", token)
      .eq("state", "preparing")
      .select("hash");
    if (saved.error) throw saved.error;
    return saved.data?.length ? Response.json({ ok: true }) : pendingNarration();
  };
  const signal = AbortSignal.timeout(100000);
  try {
    // A worker can die after upload but before marking ready. Restore that file rather than pay again.
    if (expired) {
      const recovered = await supabaseAdmin.storage.from("classroom-narration").download(path);
      if (recovered.data) {
        const bytes = await recovered.data.arrayBuffer();
        if (bytes.byteLength >= 1024 && bytes.byteLength <= 8388608)
          return await markReady(bytes.byteLength);
      } else if (
        recovered.error &&
        !["404", "400"].includes(String((recovered.error as { statusCode?: string }).statusCode))
      ) {
        throw new Error("Audio recovery unavailable");
      }
    }
    // The total gateway + direct-Gemini attempt is bounded, including the direct fallback request.
    const response = await generateSpeech({
      text,
      voice: "sarah",
      speed: 1,
      provider: "gemini",
      signal,
    });
    if (signal.aborted || !response.ok || response.headers.get("X-TTS-Provider") !== "gemini")
      throw new Error("Approved Gemini narration unavailable");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 1024 || bytes.byteLength > 8388608)
      throw new Error("Invalid audio size");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("classroom-narration")
      .upload(path, bytes, { contentType: "audio/wav", upsert: false });
    if (uploadError) throw uploadError;
    return await markReady(bytes.byteLength);
  } catch {
    await supabaseAdmin
      .from("classroom_audio" as never)
      .update({
        state: signal.aborted ? "preparing" : "failed",
        last_error: signal.aborted
          ? "Generation timed out; retry available"
          : "Preparation failed; administrator review required",
        lease_until: signal.aborted ? new Date().toISOString() : null,
      } as never)
      .eq("hash", hash)
      .eq("generation_token", token)
      .eq("state", "preparing");
    return Response.json(
      {
        error: "preparation_failed",
        message: "အသံပြင်ဆင်မှု မအောင်မြင်ပါ။ ပြန်စစ်ရန် ဆရာထံ အကြောင်းကြားပါ။",
      },
      { status: 503 },
    );
  }
}

function pendingNarration() {
  return Response.json(
    { pending: true, message: "ဆရာ့အသံ ပြင်ဆင်နေပါတယ်။ ခဏစောင့်ပါ။" },
    {
      status: 202,
      headers: { "Retry-After": "2", "Cache-Control": "no-store" },
    },
  );
}
function failedNarration() {
  return Response.json(
    {
      error: "narration_review_required",
      message: "ဒီအပိုင်းအသံကို ဆရာက ပြန်စစ်ဆေးရန် လိုပါသည်။ နောက်မှ ပြန်ဆက်ပါ။",
    },
    { status: 503 },
  );
}
/** Caller must authenticate and verify the exact script publication before entering. */
export async function readOrPrepareClassroomAudio(lesson: ReadingLesson, cursor: number) {
  const cached = await readClassroomAudio(lesson, cursor);
  if (cached.status !== 404) return cached;
  const prepared = await prepareClassroomAudio(lesson, cursor);
  if (prepared.status !== 200) return prepared;
  return readClassroomAudio(lesson, cursor);
}
