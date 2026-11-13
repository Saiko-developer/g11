import type { ReadingLesson } from "./types";
export async function lessonHash(lesson: ReadingLesson) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(lesson)),
  );
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
export async function publishedLesson(lesson: ReadingLesson) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hash = await lessonHash(lesson);
  const { data, error } = await supabaseAdmin
    .from("classroom_publications" as never)
    .select("content_hash")
    .eq("lesson_id", lesson.id)
    .eq("version", lesson.version)
    .maybeSingle();
  return !error && (data as { content_hash?: string } | null)?.content_hash === hash;
}
