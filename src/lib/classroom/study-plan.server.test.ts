import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  rpc: vi.fn(),
  enrollment: vi.fn(),
  history: vi.fn(),
  upsert: vi.fn(),
  filter: vi.fn(),
}));
vi.mock("@/lib/api-guard.server", () => ({ requireUser: m.auth }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: m.rpc, from: () => ({ upsert: m.upsert }) },
}));
vi.mock("./db.server", () => ({
  classroomUnavailable: () => new Response("unavailable", { status: 503 }),
  classroomUserDb: () => ({
    from: (table: string) => {
      const q = {
        select: () => q,
        eq: (...args: unknown[]) => {
          m.filter(...args);
          return q;
        },
        maybeSingle: m.enrollment,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(m.history()).then(resolve),
      };
      return table === "study_enrollments" ? q : q;
    },
  }),
}));
import { getStudyPlan, postStudyPlan } from "./study-plan.server";
const post = (body: unknown) =>
  postStudyPlan(
    new Request("https://school.test/api/study-plan", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "alice" });
  m.enrollment.mockResolvedValue({ data: { grade: 10 }, error: null });
  m.history.mockReturnValue({ data: [], error: null });
  m.rpc.mockResolvedValue({ data: { ok: true }, error: null });
  m.upsert.mockResolvedValue({ error: null });
});
it("returns the enrolled Grade 10 plan without a 503", async () => {
  const response = await getStudyPlan(new Request("https://school.test/api/study-plan"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect((await response.json()).plan).toMatchObject({
    grade: 10,
    lessonId: "g10-u1-reading",
    session: { index: 0 },
  });
});
it("returns no plan for an account that has not enrolled", async () => {
  m.enrollment.mockResolvedValue({ data: null, error: null });
  const response = await getStudyPlan(new Request("https://school.test/api/study-plan"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ plan: null });
});
it("saves enrollment for the authenticated caller and reads the plan back", async () => {
  const response = await post({ action: "enroll", grade: 10, user_id: "bob" });
  expect(response.status).toBe(200);
  expect(m.upsert).toHaveBeenCalledWith(
    { user_id: "alice", grade: 10 },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  expect((await response.json()).plan.grade).toBe(10);
});
it("requires active authentication for both plan reads and completion writes", async () => {
  m.auth.mockResolvedValue(new Response("signin", { status: 401 }));
  expect((await getStudyPlan(new Request("https://school.test/api/study-plan"))).status).toBe(401);
  expect((await post({ action: "finish", session: 0 })).status).toBe(401);
  expect(m.rpc).not.toHaveBeenCalled();
});
it("binds completion to the caller's assigned grade and canonical range", async () => {
  const response = await post({
    action: "finish",
    session: 0,
    user_id: "bob",
    grade: 11,
    p_start: 99,
    p_end: 152,
  });
  expect(response.status).toBe(200);
  expect(m.rpc).toHaveBeenCalledWith(
    "finish_daily_class",
    expect.objectContaining({
      p_user: "alice",
      p_grade: 10,
      p_session: 0,
      p_start: 0,
      p_end: 16,
      p_lesson: "g10-u1-reading",
    }),
  );
});
it("refuses future classes before invoking the completion RPC", async () => {
  expect((await post({ action: "finish", session: 3 })).status).toBe(409);
  expect(m.rpc).not.toHaveBeenCalled();
});
it("does not fabricate enrollment when the backend enrollment read fails", async () => {
  m.enrollment.mockResolvedValue({ data: null, error: { code: "42P01" } });
  expect((await getStudyPlan(new Request("https://school.test/api/study-plan"))).status).toBe(503);
});

it("uses separate Grade 10 teaching history and retains Grade 11 legacy history", async () => {
  await getStudyPlan(new Request("https://school.test/api/study-plan"));
  expect(m.filter).toHaveBeenCalledWith("plan_version", "reading-myanmar-teacher-v2");
  m.filter.mockClear();
  m.enrollment.mockResolvedValue({ data: { grade: 11 }, error: null });
  await getStudyPlan(new Request("https://school.test/api/study-plan"));
  expect(m.filter).toHaveBeenCalledWith("plan_version", "reading-daily-v1");
});
