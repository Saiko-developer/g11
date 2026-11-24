import { z } from "zod";
import { audioCatalog } from "./catalog.server";
import { inspectMp3 } from "./codec.server";
import { audioDb, rows, upload, version } from "./store.server";
import type { AudioCatalogRow } from "./types";
import { MAX_AUDIO_BACKUP_BYTES, readAudioZip } from "./zip.server";

const manifestSchema = z.object({
  clips: z
    .array(
      z.object({
        grade: z.number(),
        unit: z.number(),
        lesson: z.string(),
        section: z.string(),
        segmentOrder: z.number().int(),
        filename: z.string().endsWith(".mp3"),
        scriptHash: z.string().regex(/^[a-f0-9]{64}$/),
        scriptVersion: z.string().max(150),
        scriptText: z.string().min(1).max(3500).nullable().optional(),
        versionId: z.string().uuid(),
        voice: z.enum(["Puck", "VoxCPM2 Burmese Teacher"]),
        provider: z.literal("voxcpm2_local").optional(),
        model: z.literal("VoxCPM2-Q8_0").optional(),
        bytes: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(200),
});

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("Choose an Audio Manager ZIP backup");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > MAX_AUDIO_BACKUP_BYTES) {
        await reader.cancel();
        throw Error("Backup exceeds the upload limit");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export async function restoreAudio(request: Request, userId: string, apply: boolean) {
  const files = readAudioZip(await readBody(request));
  const manifest = manifestSchema.parse(
    JSON.parse(new TextDecoder().decode(files.get("manifest.json"))),
  );
  if (
    files.size !== manifest.clips.length + 1 ||
    new Set(manifest.clips.map((c) => c.filename)).size !== manifest.clips.length ||
    new Set(manifest.clips.map((c) => c.versionId)).size !== manifest.clips.length
  )
    throw Error("Backup entries do not match the manifest");

  const catalog = await audioCatalog();
  const registered = new Map(
    (await rows<AudioCatalogRow>("lesson_mp3_catalog")).map((row) => [row.id, row]),
  );
  const report = [];
  const seen = new Set<string>();
  for (const entry of manifest.clips) {
    const clip = catalog.find(
      (c) =>
        (c.pilot ||
          (entry.voice === "VoxCPM2 Burmese Teacher" && entry.provider === "voxcpm2_local")) &&
        c.grade === entry.grade &&
        c.unit === entry.unit &&
        c.lesson_id === entry.lesson &&
        c.section === entry.section &&
        c.segment_order === entry.segmentOrder &&
        c.script_hash === entry.scriptHash,
    );
    const bytes = files.get(entry.filename);
    let media: ReturnType<typeof inspectMp3> | undefined;
    if (bytes?.length === entry.bytes) {
      try {
        media = inspectMp3(bytes);
      } catch {
        /* Report invalid media without importing it. */
      }
    }
    const current = clip && registered.get(clip.id);
    const result = { file: entry.filename, status: "ready" };
    report.push(result);
    if (
      (entry.voice === "VoxCPM2 Burmese Teacher") !== (entry.provider === "voxcpm2_local") ||
      (entry.provider === "voxcpm2_local") !== Boolean(entry.model)
    ) {
      result.status = "Backup voice and provider do not match";
    } else if (
      !clip ||
      !(
        (entry.scriptVersion === clip.script_version && !entry.scriptText) ||
        (clip.source === "walkthrough" &&
          entry.scriptVersion.startsWith("edited-") &&
          entry.scriptText?.trim())
      )
    ) {
      result.status = "Script mismatch or revised script missing";
    } else if (!media || !bytes) {
      result.status = "Invalid MP3";
    } else if (seen.has(clip.id) || current?.approved_version) {
      result.status = "Already present or duplicated";
    } else if (current?.removed_from_lesson) {
      result.status = "Clip is removed in this project";
    } else if (apply) {
      try {
        const { error: catalogError } = await audioDb().from("lesson_mp3_catalog").upsert(
          {
            id: clip.id,
            grade: clip.grade,
            unit: clip.unit,
            lesson_id: clip.lesson_id,
            section: clip.section,
            segment_id: clip.segment_id,
            segment_order: clip.segment_order,
            script_hash: clip.script_hash,
            script_version: clip.script_version,
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
        if (catalogError) throw Error("Catalog registration failed");
        const path = `grade-${clip.grade}/unit-${String(clip.unit).padStart(2, "0")}/${clip.section}/${entry.versionId}/audio.mp3`;
        const prior = await version(entry.versionId);
        if (
          prior &&
          (prior.clip_id !== clip.id ||
            prior.script_hash !== clip.script_hash ||
            prior.script_version !== entry.scriptVersion ||
            prior.storage_path !== path ||
            prior.status !== "approved" ||
            (prior.script_text ?? null) !== (entry.scriptText ?? null))
        ) {
          throw Error("Version conflicts with a record in this project");
        }
        await upload(path, bytes, "audio/mpeg");
        const { error: insertError } = await audioDb()
          .from("lesson_mp3_versions")
          .upsert(
            {
              id: entry.versionId,
              clip_id: clip.id,
              script_hash: clip.script_hash,
              script_version: entry.scriptVersion,
              script_text: entry.scriptText ?? null,
              status: "approved",
              storage_path: path,
              bytes: media.bytes,
              duration: media.duration,
              provider: entry.provider ?? "backup",
              model: entry.model ?? null,
              voice: entry.voice,
              created_by: userId,
              reviewed_by: userId,
              reviewed_at: new Date().toISOString(),
            },
            { onConflict: "id", ignoreDuplicates: true },
          );
        if (insertError) throw Error("Audio version could not be recorded");
        const saved = await version(entry.versionId);
        if (
          !saved ||
          saved.clip_id !== clip.id ||
          saved.script_hash !== clip.script_hash ||
          saved.script_version !== entry.scriptVersion ||
          saved.status !== "approved" ||
          saved.storage_path !== path ||
          saved.bytes !== media.bytes ||
          (saved.script_text ?? null) !== (entry.scriptText ?? null)
        )
          throw Error("Version changed during import");

        const { data, error } = await audioDb()
          .from("lesson_mp3_catalog")
          .update({ approved_version: entry.versionId })
          .eq("id", clip.id)
          .eq("script_hash", entry.scriptHash)
          .eq("removed_from_lesson", false)
          .is("approved_version", null)
          .select("id");
        if (error) throw Error("Audio could not be linked to the lesson");
        result.status = data?.length ? "Imported" : "Clip changed or already approved";
      } catch (error) {
        result.status = error instanceof Error ? error.message : "Import failed";
      }
    }
    if (clip) seen.add(clip.id);
  }
  return report;
}
