import { z } from "zod";
import { requireUser } from "@/lib/api-guard.server";
import { classroomUnavailable, classroomUserDb } from "./db.server";
import { getReadingLesson } from "./lessons";
import { dailyAssignment, myanmarDay, STUDY_PLAN_VERSION, type ClassHistory } from "./study-plan";

async function readPlan(request: Request, userId: string) {
  const db = classroomUserDb(request);
  const enrollment = await db
    .from("study_enrollments")
    .select("grade")
    .eq("user_id", userId)
    .maybeSingle();
  if (enrollment.error) throw enrollment.error;
  if (!enrollment.data) return null;
  const lesson = getReadingLesson(enrollment.data.grade);
  if (!lesson) throw new Error("Unsupported grade");
  const history = await db
    .from("daily_class_completions")
    .select("session_index,completed_on")
    .eq("user_id", userId)
    .eq("grade", lesson.grade)
    .eq("plan_version", STUDY_PLAN_VERSION);
  if (history.error) throw history.error;
  return {
    grade: lesson.grade,
    planVersion: STUDY_PLAN_VERSION,
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    ...dailyAssignment(lesson, history.data as ClassHistory, myanmarDay()),
  };
}
export async function getStudyPlan(request: Request) {
  const auth = await requireUser(request, { enforceAccountStatus: true });
  if (auth instanceof Response) return auth;
  try {
    return Response.json(
      { plan: await readPlan(request, auth.userId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return classroomUnavailable();
  }
}
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll"), grade: z.union([z.literal(10), z.literal(11)]) }),
  z.object({ action: z.literal("finish"), session: z.number().int().nonnegative() }),
]);
export async function postStudyPlan(request: Request) {
  const auth = await requireUser(request, { enforceAccountStatus: true });
  if (auth instanceof Response) return auth;
  const text = await request.text();
  if (text.length > 2048) return Response.json({ error: "body_too_large" }, { status: 413 });
  const body = input.safeParse(
    (() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })(),
  );
  if (!body.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (body.data.action === "enroll") {
      // First selection only. Do not silently switch an existing learner's grade or plan.
      const { error } = await supabaseAdmin
        .from("study_enrollments" as never)
        .upsert({ user_id: auth.userId, grade: body.data.grade } as never, {
          onConflict: "user_id",
          ignoreDuplicates: true,
        });
      if (error) return classroomUnavailable();
    } else {
      const plan = await readPlan(request, auth.userId);
      if (!plan || body.data.session !== plan.session.index)
        return Response.json({ error: "class_not_assigned" }, { status: 409 });
      const { data, error } = await supabaseAdmin.rpc(
        "finish_daily_class" as never,
        {
          p_user: auth.userId,
          p_grade: plan.grade,
          p_version: plan.planVersion,
          p_session: plan.session.index,
          p_lesson: plan.lessonId,
          p_lesson_version: plan.lessonVersion,
          p_start: plan.session.start,
          p_end: plan.session.end,
        } as never,
      );
      if (error || !data) return classroomUnavailable();
      if (!(data as { ok: boolean }).ok) return Response.json(data, { status: 409 });
    }
    return Response.json({ plan: await readPlan(request, auth.userId) });
  } catch {
    return classroomUnavailable();
  }
}
