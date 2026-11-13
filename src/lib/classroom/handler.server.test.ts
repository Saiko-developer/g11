import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  published: vi.fn(),
  admin: vi.fn(),
  credit: vi.fn(),
  rpc: vi.fn(),
  audio: vi.fn(),
  progress: vi.fn(),
}));
vi.mock("@/lib/api-guard.server", () => ({
  requireUser: m.auth,
  untrusted: (_label: string, value: string) => value,
}));
vi.mock("@/lib/ai-credit.server", () => ({ withAiCredit: m.credit }));
vi.mock("./db.server", () => ({
  classroomAdmin: m.admin,
  classroomUnavailable: () => new Response("unavailable", { status: 503 }),
  classroomUserDb: () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: m.progress,
    };
    return { from: vi.fn(() => query) };
  },
}));
vi.mock("./manifest.server", () => ({
  publishedLesson: m.published,
  lessonHash: async () => "a".repeat(64),
}));
vi.mock("./audio.server", () => ({ readClassroomAudio: m.audio, prepareClassroomAudio: m.audio }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: m.rpc } }));
import { getClassroom, postClassroom } from "./handler.server";
const request = (body: unknown) =>
  new Request("https://school.test/api/classroom", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "alice" });
  m.published.mockResolvedValue(false);
  m.admin.mockResolvedValue(false);
  m.rpc.mockResolvedValue({ data: { ok: true, revision: 1 }, error: null });
  m.progress.mockResolvedValue({ data: null, error: null });
});
it.each([10, 11])("loads Grade %i classroom with no existing progress", async (grade) => {
  const response = await getClassroom(new Request(`https://school.test/api/classroom?grade=${grade}`));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    progress: { cursor: 0, offset: 0, completed: [], revision: 0 },
    published: false,
    admin: false,
    contentHash: "a".repeat(64),
  });
});
it("restores saved progress rather than resetting the student's place", async () => {
  m.progress.mockResolvedValue({
    data: { cursor: 5, audio_offset: 12, completed: [0, 1], revision: 3 }, error: null,
  });
  const response = await getClassroom(new Request("https://school.test/api/classroom?grade=10"));
  expect(response.status).toBe(200);
  expect((await response.json()).progress).toEqual({ cursor: 5, offset: 12, completed: [0, 1], revision: 3 });
});
it("does not disguise a failed progress read as a new student record", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  m.progress.mockResolvedValue({ data: null, error: { code: "42P01" } });
  const response = await getClassroom(new Request("https://school.test/api/classroom?grade=10"));
  expect(response.status).toBe(503);
  expect(m.published).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith("[classroom] progress read failed", { code: "42P01" });
  log.mockRestore();
});
it("rejects missing authentication before any data or provider work", async () => {
  m.auth.mockResolvedValue(new Response("signin", { status: 401 }));
  expect((await postClassroom(request({ grade: 10, action: "ask" }))).status).toBe(401);
  expect(m.rpc).not.toHaveBeenCalled();
  expect(m.credit).not.toHaveBeenCalled();
});
it("cannot generate narration or spend AI credits for unpublished teaching scripts", async () => {
  expect(
    (await postClassroom(request({ grade: 10, action: "ask", question: "why?" }))).status,
  ).toBe(409);
  expect((await postClassroom(request({ grade: 10, action: "audio" }))).status).toBe(409);
  expect(m.credit).not.toHaveBeenCalled();
  expect(m.audio).not.toHaveBeenCalled();
});
it("students cannot approve content or prepare paid audio", async () => {
  expect(
    (
      await postClassroom(
        request({ grade: 10, action: "approve", acknowledge: true, contentHash: "a".repeat(64) }),
      )
    ).status,
  ).toBe(403);
  m.published.mockResolvedValue(true);
  expect(
    (await postClassroom(request({ grade: 10, action: "prepare", acknowledge: true }))).status,
  ).toBe(403);
});
it("binds progress to the authenticated owner and server lesson identity", async () => {
  const response = await postClassroom(
    request({
      grade: 11,
      action: "save",
      user_id: "bob",
      lesson: "fake",
      completed: [0],
      revision: 0,
    }),
  );
  expect(response.status).toBe(200);
  expect(m.rpc).toHaveBeenCalledWith(
    "save_classroom_progress",
    expect.objectContaining({ p_user: "alice", p_lesson: "g11-u1-reading", p_steps: 152 }),
  );
});
it("rejects out-of-range completion indices and stale saves", async () => {
  expect(
    (await postClassroom(request({ grade: 10, action: "save", completed: [64] }))).status,
  ).toBe(400);
  expect(m.rpc).not.toHaveBeenCalled();
  m.rpc.mockResolvedValue({ data: { ok: false, reason: "stale" }, error: null });
  expect((await postClassroom(request({ grade: 10, action: "save" }))).status).toBe(409);
});
