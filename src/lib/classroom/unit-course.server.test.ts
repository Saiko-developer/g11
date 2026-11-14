import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  credit: vi.fn(),
  live: vi.fn(),
  generate: vi.fn(),
  ownHomework: null as null | {
    answers: Record<string, string>;
    feedback: null;
    submitted_at: string;
  },
  rpc: vi.fn(),
  update: vi.fn(),
  filters: vi.fn(),
  homeworkRows: [] as unknown[],
  error: null as unknown,
}));
vi.mock("@/lib/api-guard.server", () => ({
  requireUser: m.auth,
  untrusted: (label: string, value: string) => `<${label}>${value}</${label}>`,
}));
vi.mock("@/lib/ai-credit.server", () => ({ withAiCredit: m.credit }));
vi.mock("./live-settings.server", () => ({ classroomLiveEnabled: m.live }));
vi.mock("ai", () => ({ generateText: m.generate }));
vi.mock("@/lib/ai-gateway.server", () => ({ getLovableChatModel: () => "mock-model" }));
vi.mock("./manifest.server", () => ({
  lessonHash: async () => "a".repeat(64),
  publishedLesson: async () => true,
}));
const makeQuery = (table: string) => {
  const q = {
    select: () => q,
    eq: (...args: unknown[]) => {
      m.filters(...args);
      return q;
    },
    in: () => q,
    maybeSingle: async () => ({
      data: table === "unit_homework" ? m.ownHomework : null,
      error: null,
    }),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({
        data: table === "unit_homework" ? m.homeworkRows : [],
        error: m.error,
      }).then(resolve),
  };
  return q;
};
vi.mock("./db.server", () => ({
  classroomUnavailable: () => Response.json({ error: "unavailable" }, { status: 503 }),
  classroomUserDb: () => ({ from: makeQuery }),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: m.rpc,
    from: (table: string) => ({
      update: (data: unknown) => {
        m.update(data);
        return makeQuery(table);
      },
    }),
  },
}));
import { getUnitCourse, postUnitCourse } from "./unit-course.server";
const post = (body: unknown) =>
  postUnitCourse(
    new Request("https://school.test/api/unit-classroom", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "alice" });
  m.rpc.mockResolvedValue({ data: { ok: true }, error: null });
  m.homeworkRows = [];
  m.ownHomework = null;
  m.live.mockResolvedValue(true);
  m.credit.mockImplementation(
    async (_request: Request, _operation: string, run: () => Promise<Response>) => run(),
  );
  m.generate.mockResolvedValue({ text: "Your actual draft feedback" });
  m.error = null;
});
it("rejects anonymous reads and writes before any database or paid work", async () => {
  m.auth.mockResolvedValue(new Response("signin", { status: 401 }));
  expect(
    (await getUnitCourse(new Request("https://school.test/api/unit-classroom?grade=10&unit=1")))
      .status,
  ).toBe(401);
  expect((await post({})).status).toBe(401);
  expect(m.rpc).not.toHaveBeenCalled();
});
it("does not fabricate readiness outside the Unit 1 rollout", async () => {
  expect(
    (await getUnitCourse(new Request("https://school.test/api/unit-classroom?grade=11&unit=1")))
      .status,
  ).toBe(404);
  expect(
    (await post({ grade: 10, unit: 2, action: "finish_section", skill: "grammar", answers: {} }))
      .status,
  ).toBe(400);
});
it("binds progress, script identity and completion to the authenticated caller", async () => {
  const r = await post({
    grade: 10,
    unit: 1,
    action: "finish_section",
    skill: "grammar",
    userId: "bob",
    p_hash: "wrong",
    answers: {
      g1: "a musician",
      g2: "U Tun Tun, our English teacher, is a very strict person.",
      evil: "ignored",
    },
  });
  expect(r.status).toBe(200);
  expect(m.rpc).toHaveBeenCalledWith(
    "save_unit_section",
    expect.objectContaining({
      p_user: "alice",
      p_hash: "a".repeat(64),
      p_lesson_version: "unit-teacher-v1",
      p_finish: true,
      p_answers: {
        g1: "a musician",
        g2: "U Tun Tun, our English teacher, is a very strict person.",
      },
    }),
  );
});
it("stores drafts without falsely completing a section", async () => {
  expect(
    (
      await post({
        grade: 10,
        unit: 1,
        action: "save_activity",
        skill: "writing",
        answers: { w1: "outline" },
      })
    ).status,
  ).toBe(200);
  expect(m.rpc).toHaveBeenCalledWith(
    "save_unit_section",
    expect.objectContaining({ p_finish: false }),
  );
});
it("rejects empty practice and propagates the stored-progress completion gate", async () => {
  expect(
    (await post({ grade: 10, unit: 1, action: "finish_section", skill: "grammar", answers: {} }))
      .status,
  ).toBe(400);
  expect(m.rpc).not.toHaveBeenCalled();
  m.rpc.mockResolvedValue({ data: { ok: false, reason: "section_incomplete" }, error: null });
  expect(
    (
      await post({
        grade: 10,
        unit: 1,
        action: "finish_section",
        skill: "grammar",
        answers: {
          g1: "a musician",
          g2: "U Tun Tun, our English teacher, is a very strict person.",
        },
      })
    ).status,
  ).toBe(409);
});
it("never creates unassigned homework and scopes writes to the caller", async () => {
  expect(
    (
      await post({
        grade: 10,
        unit: 1,
        action: "save_homework",
        answers: { h1: "answer" },
        user_id: "bob",
      })
    ).status,
  ).toBe(409);
  expect(m.filters).toHaveBeenCalledWith("user_id", "alice");
  expect(m.update).toHaveBeenCalledWith(
    expect.objectContaining({ answers: expect.objectContaining({ h1: "answer" }) }),
  );
  expect(m.rpc).not.toHaveBeenCalled();
});
it("returns 503 instead of manufacturing empty progress on storage errors", async () => {
  m.error = { code: "missing_table" };
  expect(
    (await getUnitCourse(new Request("https://school.test/api/unit-classroom?grade=10&unit=1")))
      .status,
  ).toBe(503);
});

it("does not spend credit before submitted homework and live-AI gates pass", async () => {
  expect((await post({ grade: 10, unit: 1, action: "review_homework" })).status).toBe(409);
  expect(m.credit).not.toHaveBeenCalled();
  m.ownHomework = {
    answers: { h6: "Stored writing" },
    feedback: null,
    submitted_at: "2026-11-14T00:00:00Z",
  };
  m.live.mockResolvedValue(false);
  expect((await post({ grade: 10, unit: 1, action: "review_homework" })).status).toBe(503);
  expect(m.credit).not.toHaveBeenCalled();
});
it("reviews only stored submitted work with bounded credit-guarded generation", async () => {
  m.ownHomework = {
    answers: { h6: "Stored actual writing" },
    feedback: null,
    submitted_at: "2026-11-14T00:00:00Z",
  };
  m.homeworkRows = [{ user_id: "alice" }];
  const response = await post({
    grade: 10,
    unit: 1,
    action: "review_homework",
    answers: { h6: "UNTRUSTED_REPLACEMENT" },
  });
  expect(response.status).toBe(200);
  expect(m.credit).toHaveBeenCalledWith(expect.any(Request), "check", expect.any(Function), true);
  expect(m.generate).toHaveBeenCalledWith(
    expect.objectContaining({
      maxOutputTokens: 1600,
      maxRetries: 0,
      prompt: expect.stringContaining("Stored actual writing"),
    }),
  );
  expect(m.generate.mock.calls[0][0].prompt).not.toContain("UNTRUSTED_REPLACEMENT");
  expect(m.update).toHaveBeenCalledWith({
    feedback: { teacherFeedback: "Your actual draft feedback" },
  });
  expect(m.filters).toHaveBeenCalledWith("submitted_at", "2026-11-14T00:00:00Z");
});
it("clears obsolete feedback when homework is edited as a draft", async () => {
  m.homeworkRows = [{ user_id: "alice" }];
  expect(
    (await post({ grade: 10, unit: 1, action: "save_homework", answers: { h1: "new answer" } }))
      .status,
  ).toBe(200);
  expect(m.update).toHaveBeenCalledWith(
    expect.objectContaining({ submitted_at: null, feedback: null }),
  );
});
