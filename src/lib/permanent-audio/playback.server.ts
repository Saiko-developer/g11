import { audioDb, stored } from "./store.server";
import { inspectMp3 } from "./codec.server";
/** Read approved Grammar audio, with legacy playback for clips outside the library. */
export async function approvedMp3(
  scriptHash: string,
  metadataOnly = false,
): Promise<Response | null> {
  if (process.env.AUDIO_MP3_PILOT_PLAYBACK === "false") return null;
  let approvedFound = false;
  const unavailable = () =>
    Response.json(
      {
        error: "approved_audio_temporarily_unavailable",
        message: "အဆင်သင့်အသံဖိုင်ကို ယခု ဖွင့်မရသေးပါ။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။",
      },
      { status: 503 },
    );
  try {
    const { data: clips, error } = await audioDb()
      .from("lesson_mp3_catalog")
      .select("*")
      .eq("script_hash", scriptHash)
      .eq("section", "grammar")
      .limit(1);
    if (error) return unavailable();
    if (clips?.[0]?.removed_from_lesson)
      return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    if (!clips?.[0]?.approved_version) return null;
    approvedFound = true;
    const { data: version } = await audioDb()
      .from("lesson_mp3_versions")
      .select("storage_path,status,script_hash")
      .eq("id", clips[0].approved_version)
      .maybeSingle();
    if (
      version?.status !== "approved" ||
      version.script_hash !== scriptHash ||
      !version.storage_path
    )
      return unavailable();
    approvedFound = true;
    if (metadataOnly) return Response.json({ ok: true, cached: true, format: "mp3" });
    const bytes = await stored(version.storage_path);
    if (!bytes) return unavailable();
    inspectMp3(bytes);
    return new Response(bytes.slice().buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Lesson-Audio": "approved-mp3",
      },
    });
  } catch {
    return approvedFound ? unavailable() : null;
  }
}
