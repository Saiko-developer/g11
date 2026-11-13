import { generateSpeech } from "@/lib/ttsGenerate.server";
import { stepAt, type ReadingLesson } from "./types";
import { lessonHash } from "./manifest.server";

export async function classroomAudioIdentity(lesson: ReadingLesson, cursor: number) {
  const { step, text } = stepAt(lesson, cursor);
  const identity = JSON.stringify([
    await lessonHash(lesson),
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { hash, path } = await classroomAudioIdentity(lesson, cursor);
  const { data, error } = await supabaseAdmin
    .from("classroom_audio" as never)
    .select("state")
    .eq("hash", hash)
    .maybeSingle();
  if (error || (data as { state?: string } | null)?.state !== "ready")
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
  return new Response(file, {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" },
  });
}
export async function prepareClassroomAudio(lesson: ReadingLesson, cursor: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { hash, path, text } = await classroomAudioIdentity(lesson, cursor);
  const { data, error } = await supabaseAdmin.rpc(
    "claim_classroom_audio" as never,
    {
      p_hash: hash,
      p_lesson: lesson.id,
      p_version: lesson.version,
      p_path: path,
    } as never,
  );
  if (error) return Response.json({ error: "audio_service_unavailable" }, { status: 503 });
  if (!data)
    return Response.json(
      {
        error: "prepared_or_daily_limit",
        message: "ပြင်ဆင်ပြီးသား သို့မဟုတ် ယနေ့အသံပြင်ဆင်ခွင့် ပြည့်သွားပါပြီ။",
      },
      { status: 409 },
    );
  try {
    const response = await generateSpeech({ text, voice: "sarah", speed: 1 });
    if (!response.ok || response.headers.get("X-TTS-Provider") !== "gemini")
      throw new Error("Approved Gemini narration unavailable");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 1024 || bytes.byteLength > 8388608)
      throw new Error("Invalid audio size");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("classroom-narration")
      .upload(path, bytes, { contentType: "audio/wav", upsert: false });
    if (uploadError) throw uploadError;
    const { error: saveError } = await supabaseAdmin
      .from("classroom_audio" as never)
      .update({ state: "ready", bytes: bytes.byteLength } as never)
      .eq("hash", hash);
    if (saveError) throw saveError;
    return Response.json({ ok: true });
  } catch {
    await supabaseAdmin
      .from("classroom_audio" as never)
      .update({
        state: "failed",
        last_error: "Preparation failed; administrator review required",
      } as never)
      .eq("hash", hash);
    return Response.json({ error: "preparation_failed" }, { status: 503 });
  }
}
