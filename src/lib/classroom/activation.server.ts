import { z } from "zod";
import { requireUser } from "@/lib/api-guard.server";
import { classroomAdmin } from "./db.server";
import { getReadingLesson } from "./lessons";
import { buildDailyClasses } from "./study-plan";
import { classroomAudioIdentity, prepareClassroomAudio, readClassroomAudio } from "./audio.server";
import { lessonHash, publishedLesson } from "./manifest.server";
import { onDemandReadingPilot } from "./pilot";
import { classroomLiveEnabled } from "./live-settings.server";

async function adminAccess(request: Request) {
  const auth = await requireUser(request, { enforceAccountStatus: true });
  if (auth instanceof Response) return auth;
  if (!(await classroomAdmin(request)))
    return Response.json({ error: "forbidden" }, { status: 403 });
  return auth;
}
const selection = z.object({
  grade: z.union([z.literal(10), z.literal(11)]),
  day: z.number().int().min(0).max(9).default(0),
});
const action = selection.extend({
  action: z.enum(["prepare", "listen", "publish", "approve_script", "enable_questions"]),
  cursor: z.number().int().nonnegative().optional(),
  acknowledge: z.literal(true).optional(),
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
});
export async function getTeachingSetup(request: Request) {
  const auth = await adminAccess(request);
  if (auth instanceof Response) return auth;
  const url = new URL(request.url);
  const parsed = selection.safeParse({
    grade: Number(url.searchParams.get("grade") ?? 10),
    day: Number(url.searchParams.get("day") ?? 0),
  });
  if (!parsed.success) return Response.json({ error: "invalid_selection" }, { status: 400 });
  const lesson = getReadingLesson(parsed.data.grade)!;
  const day = buildDailyClasses(lesson)[parsed.data.day];
  if (!day) return Response.json({ error: "class_not_found" }, { status: 404 });
  const config = {
    database: !!process.env.SUPABASE_URL,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    speechProvider: !!process.env.LOVABLE_API_KEY,
  };
  if (!config.database || !config.serviceRole)
    return Response.json({
      config,
      missing: ["server_database_configuration"],
      ready: [],
      published: false,
      live: false,
    });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const checks = await Promise.all(
    ["classroom_audio", "ai_credit_requests", "ai_credit_ledger", "classroom_live_settings"].map(
      async (table) => {
        const { error } = await supabaseAdmin
          .from(table as never)
          .select("*", { head: true, count: "exact" });
        return error ? table : null;
      },
    ),
  );
  const missing = checks.filter(Boolean);
  const identities = await Promise.all(
    Array.from({ length: day.end - day.start }, (_, i) =>
      classroomAudioIdentity(lesson, day.start + i),
    ),
  );
  const { data } = missing.includes("classroom_audio")
    ? { data: [] }
    : await supabaseAdmin
        .from("classroom_audio" as never)
        .select("hash,state")
        .in(
          "hash",
          identities.map((i) => i.hash),
        );
  const readyHashes = new Set(
    ((data as { hash: string; state: string }[] | null) ?? [])
      .filter((row) => row.state === "ready")
      .map((row) => row.hash),
  );
  return Response.json(
    {
      config,
      contentHash: await lessonHash(lesson),
      missing,
      ready: identities.flatMap((i, index) => (readyHashes.has(i.hash) ? [day.start + index] : [])),
      published: await publishedLesson(lesson),
      live: missing.includes("classroom_live_settings") ? false : await classroomLiveEnabled(),
      day,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function postTeachingSetup(request: Request) {
  const auth = await adminAccess(request);
  if (auth instanceof Response) return auth;
  const raw = await request.text();
  if (raw.length > 2048) return Response.json({ error: "body_too_large" }, { status: 413 });
  const parsed = action.safeParse(
    (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })(),
  );
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const body = parsed.data;
  const lesson = getReadingLesson(body.grade)!;
  const day = buildDailyClasses(lesson)[body.day];
  if (!day) return Response.json({ error: "class_not_found" }, { status: 404 });
  if (body.cursor !== undefined && (body.cursor < day.start || body.cursor >= day.end))
    return Response.json({ error: "invalid_cursor" }, { status: 400 });
  if (body.action === "listen")
    return body.cursor === undefined
      ? Response.json({ error: "cursor_required" }, { status: 400 })
      : readClassroomAudio(lesson, body.cursor);
  if (!body.acknowledge) return Response.json({ error: "confirmation_required" }, { status: 400 });
  if (body.action === "prepare") {
    if (body.cursor === undefined)
      return Response.json({ error: "cursor_required" }, { status: 400 });
    // Private draft preparation is allowed for admin listening review. Student playback still requires publication.
    return prepareClassroomAudio(lesson, body.cursor);
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (body.action === "approve_script") {
    if (!onDemandReadingPilot(lesson))
      return Response.json({ error: "pilot_only" }, { status: 400 });
    if (!process.env.LOVABLE_API_KEY)
      return Response.json({ error: "provider_not_configured" }, { status: 503 });
    const hash = await lessonHash(lesson);
    if (body.contentHash !== hash)
      return Response.json({ error: "script_changed_review_again" }, { status: 409 });
    const result = await supabaseAdmin.from("classroom_publications" as never).upsert({
      lesson_id: lesson.id,
      version: lesson.version,
      content_hash: hash,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    } as never);
    return result.error
      ? Response.json({ error: "publication_failed" }, { status: 503 })
      : Response.json({ ok: true });
  }
  if (body.action === "publish") {
    const hashes = await Promise.all(
      Array.from({ length: day.end - day.start }, (_, i) =>
        classroomAudioIdentity(lesson, day.start + i),
      ),
    );
    const { data, error } = await supabaseAdmin
      .from("classroom_audio" as never)
      .select("hash,state")
      .in(
        "hash",
        hashes.map((h) => h.hash),
      );
    if (error) return Response.json({ error: "narration_storage_unavailable" }, { status: 503 });
    if (
      (data as { state: string }[] | null)?.filter((r) => r.state === "ready").length !==
      hashes.length
    )
      return Response.json({ error: "prepare_audio_first" }, { status: 409 });
    const result = await supabaseAdmin.from("classroom_publications" as never).upsert({
      lesson_id: lesson.id,
      version: lesson.version,
      content_hash: await lessonHash(lesson),
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    } as never);
    return result.error
      ? Response.json({ error: "publication_failed" }, { status: 503 })
      : Response.json({ ok: true });
  }
  if (process.env.CLASSROOM_LIVE_AI_ENABLED === "false")
    return Response.json({ error: "disabled_by_environment" }, { status: 409 });
  if (!process.env.LOVABLE_API_KEY)
    return Response.json({ error: "provider_not_configured" }, { status: 503 });
  if (!(await publishedLesson(lesson)))
    return Response.json({ error: "publish_audio_first" }, { status: 409 });
  const check = await supabaseAdmin
    .from("ai_credit_requests" as never)
    .select("user_id", { head: true, count: "exact" });
  if (check.error) return Response.json({ error: "credit_schema_missing" }, { status: 503 });
  const result = await supabaseAdmin
    .from("classroom_live_settings" as never)
    .update({
      live_enabled: true,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", true);
  return result.error
    ? Response.json({ error: "activation_failed" }, { status: 503 })
    : Response.json({ ok: true });
}
