import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AUDIO_BUCKET, type AudioVersion } from "./types";
export const audioDb = () => supabaseAdmin as unknown as SupabaseClient;
export async function rows<T>(table: string, select = "*"): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset < 20000; offset += 500) {
    const { data, error } = await audioDb()
      .from(table)
      .select(select)
      .order("id")
      .range(offset, offset + 499);
    if (error)
      throw Error("Audio library migration/setup is required or the database is unavailable");
    result.push(...(data as T[]));
    if (data.length < 500) return result;
  }
  throw Error("Audio library listing is too large; use server pagination");
}
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await audioDb().rpc(name, args);
  if (error) throw Error(`Audio operation failed: ${name}`);
  return data as T;
}
export async function stored(path: string, bucket = AUDIO_BUCKET): Promise<Uint8Array | null> {
  const { data, error } = await audioDb().storage.from(bucket).download(path);
  if (error) {
    if (["404", "400"].includes(String((error as { statusCode?: string }).statusCode))) return null;
    throw Error("Audio storage is temporarily unavailable");
  }
  if (!data) return null;
  if (data.size > 32 * 1024 * 1024) throw Error("Audio asset is too large");
  return new Uint8Array(await data.arrayBuffer());
}
export async function upload(path: string, bytes: Uint8Array, type: string) {
  const { error } = await audioDb()
    .storage.from(AUDIO_BUCKET)
    .upload(path, bytes, { contentType: type, upsert: false, cacheControl: "31536000" });
  if (error) {
    const existing = await stored(path);
    if (!existing || existing.length !== bytes.length || existing.some((b, i) => b !== bytes[i]))
      throw Error("Immutable audio upload failed");
  }
}
export async function deleteAudioVersion(id: string, userId: string) {
  const assets = await rpc<{ mp3: string | null; wav: string | null }>("lesson_mp3_delete_audio", {
    p_version: id,
    p_user: userId,
  });
  const paths = [...new Set([assets.mp3, assets.wav].filter((path) => path !== null))];
  if (!paths.length) return;

  const { error } = await audioDb().storage.from(AUDIO_BUCKET).remove(paths);
  if (error) throw Error("Audio was unpublished. Retry deletion to remove the stored files.");

  const { error: saveError } = await audioDb()
    .from("lesson_mp3_versions")
    .update({ storage_path: null, raw_path: null, bytes: 0, raw_bytes: 0, duration: null })
    .eq("id", id)
    .not("audio_deleted_at", "is", null);
  if (saveError) throw Error("Files were removed. Retry deletion to finish updating the library.");
}
export async function version(id: string) {
  const { data, error } = await audioDb()
    .from("lesson_mp3_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Audio version lookup failed");
  return data as AudioVersion | null;
}
export async function event(versionId: string, kind: string, detail?: string) {
  const { error } = await audioDb()
    .from("lesson_mp3_events")
    .insert({ version_id: versionId, kind, detail: detail?.slice(0, 250) });
  if (error) throw Error("Audio usage record failed");
}
