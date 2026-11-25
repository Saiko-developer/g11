import { requireUser } from "../api-guard.server";
import { classroomAdmin } from "../classroom/db.server";
import { publishedLesson } from "../classroom/manifest.server";
import { resolveClassroomLesson } from "../classroom/unit-course";
import { AUDIO_GRADES, audioCatalog, canEditAudioScript, type AudioClip } from "./catalog.server";
import { audioDb, deleteAudioVersion, rows, rpc, version, stored } from "./store.server";
import { inspectMp3 } from "./codec.server";
import { zipStream } from "./zip.server";
import { localAudioEnabled } from "./local-worker.server";
import { workOneAudioJob } from "./worker.server";
import type { AudioCatalogRow, AudioVersion } from "./types";
import { z } from "zod";
export async function audioAdmin(request: Request) {
  const auth = await requireUser(request, { enforceAccountStatus: true });
  if (auth instanceof Response) return auth;
  if (!(await classroomAdmin(request)))
    return Response.json({ error: "Admins only" }, { status: 403 });
  return auth;
}
export function archiveParts<T extends { bytes: number }>(
  items: T[],
  maxBytes = 32 * 1024 * 1024,
  maxFiles = 20,
) {
  const parts: T[][] = [];
  let size = 0;
  for (const item of items) {
    if (item.bytes > maxBytes) throw Error("One audio asset exceeds archive size limit");
    if (!parts.length || parts.at(-1)!.length >= maxFiles || size + item.bytes > maxBytes) {
      parts.push([]);
      size = 0;
    }
    parts.at(-1)!.push(item);
    size += item.bytes;
  }
  return parts;
}
export function lessonArchiveParts<
  T extends {
    bytes: number;
    clip: { grade: number; unit: number; lesson_id: string; segment_order: number };
  },
>(items: T[], grade: number, unit?: number) {
  const selected = items
    .filter(({ clip }) => clip.grade === grade && (unit === undefined || clip.unit === unit))
    .sort(
      (a, b) =>
        a.clip.unit - b.clip.unit ||
        a.clip.lesson_id.localeCompare(b.clip.lesson_id) ||
        a.clip.segment_order - b.clip.segment_order,
    );
  if (unit !== undefined) return archiveParts(selected, undefined, 200);
  return Array.from({ length: 12 }, (_, i) => i + 1).flatMap((number) =>
    archiveParts(selected.filter(({ clip }) => clip.unit === number)),
  );
}
function filename(clip: AudioCatalogRow, versionId: string) {
  return `g${clip.grade}-unit${String(clip.unit).padStart(2, "0")}-${clip.section}-${clip.lesson_id}-segment${String(clip.segment_order).padStart(3, "0")}-${versionId.slice(0, 8)}.mp3`.replace(
    /[^a-zA-Z0-9_.-]/g,
    "-",
  );
}
export async function audioManagerGet(request: Request) {
  const access = await audioAdmin(request);
  if (access instanceof Response) return access;
  try {
    const url = new URL(request.url),
      assetId = url.searchParams.get("version");
    if (assetId) {
      if (!z.string().uuid().safeParse(assetId).success)
        return Response.json({ error: "Invalid audio version" }, { status: 400 });
      const row = await version(assetId),
        download = url.searchParams.get("download") === "1";
      if (
        !row?.storage_path ||
        row.audio_deleted_at ||
        !["approved", "pending", "rejected"].includes(row.status) ||
        (download && row.status !== "approved")
      )
        return Response.json({ error: "Audio is not available for this action" }, { status: 404 });
      const bytes = await stored(row.storage_path);
      if (!bytes) return Response.json({ error: "Stored audio file is missing" }, { status: 404 });
      inspectMp3(bytes);
      const clip = (await rows<AudioCatalogRow>("lesson_mp3_catalog")).find(
        (c) => c.id === row.clip_id,
      );
      if (!clip) throw Error("Audio catalog entry missing");
      return new Response(bytes.slice().buffer as ArrayBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, no-store",
          ...(download
            ? { "Content-Disposition": `attachment; filename="${filename(clip, row.id)}"` }
            : {}),
        },
      });
    }
    const localEnabled = localAudioEnabled();
    if (localEnabled && url.searchParams.get("format") !== "zip")
      await rpc("lesson_mp3_local_expire");
    const catalog = await rows<AudioCatalogRow>("lesson_mp3_catalog"),
      versions = await rows<AudioVersion>("lesson_mp3_versions");
    const ready = catalog
      .filter((clip) => !clip.removed_from_lesson)
      .flatMap((clip) => {
        const v = versions.find(
          (v) =>
            v.id === clip.approved_version &&
            v.status === "approved" &&
            !v.audio_deleted_at &&
            v.script_hash === clip.script_hash &&
            v.storage_path,
        );
        return v ? [{ ...v, clip }] : [];
      });
    const grade = Number(url.searchParams.get("grade"));
    const rawUnit = url.searchParams.get("unit");
    const unit = rawUnit === null ? undefined : Number(rawUnit);
    if (url.searchParams.get("format") === "zip") {
      if (
        !AUDIO_GRADES.some((value) => value === grade) ||
        (unit !== undefined && (!Number.isInteger(unit) || unit < 1 || unit > 12))
      )
        return Response.json({ error: "Invalid archive selection" }, { status: 400 });
      const parts = lessonArchiveParts(ready, grade, unit);
      const part = Number(url.searchParams.get("part") ?? 0);
      if (!Number.isInteger(part) || !parts[part])
        return Response.json({ error: "No approved files in this archive part" }, { status: 404 });
      const selected = parts[part];
      const manifest = selected.map((v) => ({
        grade: v.clip.grade,
        unit: v.clip.unit,
        lesson: v.clip.lesson_id,
        section: v.clip.section,
        segmentOrder: v.clip.segment_order,
        filename: filename(v.clip, v.id),
        scriptVersion: v.script_version,
        scriptHash: v.script_hash,
        scriptText: v.script_text ?? null,
        voice: v.voice,
        ...(v.provider === "voxcpm2_local" ? { provider: v.provider, model: v.model } : {}),
        duration: v.duration,
        bytes: v.bytes,
        versionId: v.id,
      }));
      const stream = zipStream([
        {
          name: "manifest.json",
          read: async () =>
            new TextEncoder().encode(
              JSON.stringify(
                {
                  grade,
                  unit: selected[0].clip.unit,
                  scope: unit === undefined ? "grade" : "unit",
                  part: part + 1,
                  parts: parts.length,
                  clips: manifest,
                },
                null,
                2,
              ),
            ),
        },
        ...selected.map((v) => ({
          name: filename(v.clip, v.id),
          read: async () => {
            const bytes = await stored(v.storage_path!);
            if (!bytes) throw Error("Archive audio missing");
            inspectMp3(bytes);
            if (bytes.length !== v.bytes) throw Error("Stored MP3 size does not match metadata");
            return bytes;
          },
        })),
      ]);
      return new Response(stream, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="grade-${grade}${unit === undefined ? "-backup" : ""}-unit-${selected[0].clip.unit}-part-${part + 1}.zip"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const manifest = await audioCatalog();
    const current = new Map(manifest.map((c) => [c.id, c]));
    const [{ data: legacy }, { data: classroom }] = await Promise.all([
      audioDb().from("grade11_grammar_audio").select("hash,status"),
      audioDb().from("classroom_audio").select("hash,state"),
    ]);
    const cached = new Set([
      ...(legacy ?? []).filter((r) => r.status === "ready").map((r) => `walkthrough-${r.hash}`),
      ...(classroom ?? []).filter((r) => r.state === "ready").map((r) => `classroom-${r.hash}`),
    ]);
    const controls = await audioDb()
      .from("lesson_mp3_control")
      .select("blocked_until,next_request_at")
      .eq("id", 1)
      .single();
    const jobs = await rows<{
      version_id: string;
      state: string;
      engine?: string;
      progress?: number;
    }>("lesson_mp3_jobs", localEnabled ? "version_id,state,engine,progress" : "version_id,state");
    const monitoring = await rpc<Record<string, unknown>>("lesson_mp3_stats");
    const price = Number(process.env.AUDIO_MP3_ESTIMATED_USD_PER_MINUTE);
    monitoring.estimatedCostUsd =
      Number.isFinite(price) && price > 0
        ? (Number(monitoring.generatedSeconds ?? 0) / 60) * price
        : null;
    return Response.json(
      {
        clips: catalog.flatMap((c) => {
          const authored = current.get(c.id);
          return authored
            ? [
                {
                  ...c,
                  script: authored.text,
                  pilot: authored.pilot,
                  source: authored.source,
                  lessonTitle: authored.lessonTitle,
                  editable: canEditAudioScript(authored),
                  legacyReady: cached.has(c.id),
                  versions: versions
                    .filter((v) => v.clip_id === c.id)
                    .sort((a, b) => b.created_at.localeCompare(a.created_at)),
                  jobs: jobs.filter((j) =>
                    versions.some((v) => v.clip_id === c.id && v.id === j.version_id),
                  ),
                },
              ]
            : [];
        }),
        localEnabled,
        requiredInRepository: manifest.length,
        stats: monitoring,
        control: controls.data,
        unitArchiveParts: Object.fromEntries(
          AUDIO_GRADES.flatMap((g) =>
            Array.from({ length: 12 }, (_, i) => [
              `${g}-${i + 1}`,
              lessonArchiveParts(ready, g, i + 1).length,
            ]),
          ),
        ),
        archiveParts: Object.fromEntries(
          AUDIO_GRADES.map((g) => [g, lessonArchiveParts(ready, g).length]),
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[audio-manager]",
      error instanceof Error ? error.message : "library_unavailable",
    );
    return Response.json(
      {
        error:
          "Audio library is unavailable. Check the approved migration 0014 setup, database/storage connection and server logs. Do not reapply migrations blindly.",
      },
      { status: 503 },
    );
  }
}
const actionSchema = z.object({
  action: z.enum([
    "register",
    "enqueue",
    "regenerate",
    "approve",
    "reject",
    "resume",
    "retry",
    "work",
    "save-script",
    "queue-script",
    "process-selection",
    "remove-script",
    "restore-script",
    "delete-audio",
  ]),
  ids: z.array(z.string().min(1).max(150)).max(200).default([]),
  script: z.string().trim().min(1).max(3500).optional(),
  confirmed: z.boolean().default(false),
  engine: z.enum(["gemini", "voxcpm2"]).default("gemini"),
});
async function requireClassroomPublication(clip: AudioClip) {
  if (clip.source !== "classroom") return;
  const lesson = resolveClassroomLesson(clip.grade, clip.lesson_id);
  if (!lesson || !(await publishedLesson(lesson)))
    throw Error("Review and publish the classroom script in Teaching setup first");
}
export async function audioManagerPost(request: Request) {
  const access = await audioAdmin(request);
  if (access instanceof Response) return access;
  const mode = new URL(request.url).searchParams.get("backup");
  if (mode === "check" || mode === "restore") {
    try {
      const { restoreAudio } = await import("./restore.server");
      return Response.json({
        report: await restoreAudio(request, access.userId, mode === "restore"),
      });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof z.ZodError
              ? "Invalid backup manifest"
              : error instanceof Error
                ? error.message
                : "Backup import failed",
        },
        { status: 400 },
      );
    }
  }
  const raw = await request.text();
  if (raw.length > 34000) return Response.json({ error: "Request too large" }, { status: 413 });
  const parsed = actionSchema.safeParse(
    (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })(),
  );
  if (!parsed.success) return Response.json({ error: "Invalid audio action" }, { status: 400 });
  const { action, ids, confirmed, engine } = parsed.data;
  const local = engine === "voxcpm2";
  if (local && !localAudioEnabled())
    return Response.json({ error: "Local companion is not configured" }, { status: 503 });
  if (!confirmed && action !== "work")
    return Response.json({ error: "Please confirm this audio management action" }, { status: 400 });
  try {
    if (action === "work") return Response.json(await workOneAudioJob());
    if (action === "delete-audio") {
      if (ids.length !== 1 || !z.string().uuid().safeParse(ids[0]).success)
        throw Error("Select one generated audio version");
      await deleteAudioVersion(ids[0], access.userId);
      return Response.json({ ok: true, action, message: "Generated audio deleted" });
    }
    const catalog = await audioCatalog();
    if (action === "register") {
      for (let offset = 0; offset < catalog.length; offset += 200) {
        const batch = catalog
          .slice(offset, offset + 200)
          .map(
            ({
              id,
              grade,
              unit,
              lesson_id,
              section,
              segment_id,
              segment_order,
              script_hash,
              script_version,
            }) => ({
              id,
              grade,
              unit,
              lesson_id,
              section,
              segment_id,
              segment_order,
              script_hash,
              script_version,
            }),
          );
        const { error } = await audioDb()
          .from("lesson_mp3_catalog")
          .upsert(batch, { onConflict: "id" });
        if (error) throw Error("Catalog registration failed");
      }
      return Response.json({ registered: catalog.length });
    }
    if (!ids.length) throw Error("Select at least one clip or version");
    if (action === "process-selection") {
      if (ids.some((id) => !catalog.find((c) => c.id === id)?.pilot))
        throw Error("Select clips eligible for cloud generation");
      const result = await workOneAudioJob(ids);
      if (result.state === "idle") {
        const { data } = await audioDb()
          .from("lesson_mp3_control")
          .select("next_request_at,blocked_until")
          .eq("id", 1)
          .single();
        const blocked = Date.parse(data?.blocked_until ?? "") > Date.now();
        const wait = Date.parse(data?.next_request_at ?? "") - Date.now();
        return Response.json({
          ...result,
          retryInMs: !blocked && wait > 0 && wait <= 60000 ? wait + 250 : null,
        });
      }
      return Response.json(result);
    }
    if (action === "remove-script" || action === "restore-script") {
      const clip = catalog.find((c) => c.id === ids[0]);
      if (ids.length !== 1 || !clip?.pilot || clip.source !== "walkthrough")
        throw Error("Choose one walkthrough clip");
      const { error } = await audioDb()
        .from("lesson_mp3_catalog")
        .update({ removed_from_lesson: action === "remove-script" })
        .eq("id", clip.id)
        .select("id")
        .single();
      if (error) throw Error("Could not update lesson visibility. Check migration 0016.");
      return Response.json({ ok: true, action });
    }
    if (action === "save-script" || action === "queue-script") {
      const [id] = ids;
      const script = parsed.data.script;
      const clip = catalog.find((c) => c.id === id);
      if (ids.length !== 1 || !clip || !canEditAudioScript(clip) || !script)
        throw Error("Select one editable clip and enter a script");
      if (action === "save-script") {
        const { error } = await audioDb()
          .from("lesson_mp3_catalog")
          .update({ script_draft: script })
          .eq("id", id)
          .select("id")
          .single();
        if (error) throw Error("Draft could not be saved. Check migration 0016.");
      } else {
        if (!local) await requireClassroomPublication(clip);
        await rpc(local ? "lesson_mp3_local_enqueue" : "lesson_mp3_enqueue_draft", {
          p_clip: id,
          p_user: access.userId,
          p_script: script,
          ...(local ? { p_regenerate: true } : {}),
        });
      }
      return Response.json({ ok: true, action });
    }
    if (action === "approve" && ids.length > 1) {
      const versions = [...new Set(ids)].sort();
      if (versions.some((id) => !z.string().uuid().safeParse(id).success))
        throw Error("Invalid audio version");
      for (let offset = 0; offset < versions.length; offset += 6) {
        await Promise.all(
          versions.slice(offset, offset + 6).map(async (id) => {
            const row = await version(id);
            if (row?.status !== "pending" || !row.storage_path)
              throw Error("Only pending versions can be approved in a batch");
            const bytes = await stored(row.storage_path);
            if (!bytes || inspectMp3(bytes).bytes !== row.bytes)
              throw Error("MP3 file missing or invalid");
          }),
        );
      }
      await rpc("lesson_mp3_approve_selection", { p_versions: versions, p_user: access.userId });
      return Response.json({ ok: true, action, message: `Approved ${versions.length} clips` });
    }
    for (const id of ids) {
      if (action === "enqueue" || action === "regenerate") {
        const clip = catalog.find((c) => c.id === id);
        if (!clip || (!local && !clip.pilot))
          throw Error("This clip is unavailable for the selected provider");
        if (!local) await requireClassroomPublication(clip);
        if (action === "regenerate") {
          await rpc("lesson_mp3_regenerate", {
            p_clip: id,
            p_user: access.userId,
            p_engine: engine,
          });
        } else {
          await rpc(local ? "lesson_mp3_local_enqueue" : "lesson_mp3_enqueue", {
            p_clip: id,
            p_user: access.userId,
            p_regenerate: false,
          });
        }
      } else {
        if (!z.string().uuid().safeParse(id).success) throw Error("Invalid audio version");
        const row = await version(id);
        if (!row || row.audio_deleted_at) throw Error("Audio version is unavailable");
        if (action === "approve" || action === "reject") {
          if (action === "approve") {
            if (!row.storage_path) throw Error("MP3 is not ready");
            const data = await stored(row.storage_path);
            if (!data) throw Error("MP3 file missing");
            const info = inspectMp3(data);
            if (info.bytes !== row.bytes) throw Error("MP3 size mismatch");
          }
          await rpc("lesson_mp3_review", {
            p_version: id,
            p_user: access.userId,
            p_action: action,
          });
        } else {
          const clip = catalog.find((c) => c.id === row.clip_id);
          if (row.provider === "voxcpm2_local") {
            if (!localAudioEnabled()) throw Error("Local companion is not configured");
            if (!clip) throw Error("Fixed script is unavailable");
            if (
              !(await rpc<boolean>("lesson_mp3_local_requeue", {
                p_version: id,
                p_generate: action === "retry",
              }))
            )
              throw Error(
                "Only failed or interrupted local jobs without another active version can be resumed",
              );
            continue;
          }
          if (!clip?.pilot) throw Error("Version is outside the cloud audio library");
          const { data: job, error } = await audioDb()
            .from("lesson_mp3_jobs")
            .update({
              state: "queued",
              allow_generation: action === "retry",
              updated_at: new Date().toISOString(),
            })
            .eq("version_id", id)
            .in("state", ["failed", "interrupted"])
            .select("id");
          if (error || !job?.length) throw Error("Only failed or interrupted jobs can be resumed");
        }
      }
    }
    return Response.json({
      ok: true,
      action,
      ...(local && (action === "enqueue" || action === "regenerate")
        ? { message: "Queue updated. Start the Mac companion to process Local clips." }
        : {}),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Audio action failed" },
      { status: 409 },
    );
  }
}
