import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  published: vi.fn(),
  admin: vi.fn(),
  credit: vi.fn(),
  rpc: vi.fn(),
  audio: vi.fn(),
}));
vi.mock("@/lib/api-guard.server", () => ({
  requireUser: m.auth,
  untrusted: (_label: string, value: string) => value,
}));
vi.mock("@/lib/ai-credit.server", () => ({ withAiCredit: m.credit }));
vi.mock("./db.server", () => ({
  classroomAdmin: m.admin,
  classroomUnavailable: () => new Response("unavailable", { status: 503 }),
}));
vi.mock("./manifest.server", () => ({
  publishedLesson: m.published,
  lessonHash: async () => "a".repeat(64),
}));
vi.mock("./audio.server", () => ({ readClassroomAudio: m.audio, prepareClassroomAudio: m.audio }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: m.rpc } }));
import { postClassroom } from "./handler.server";
const request = (body: unknown) =>
  new Request("https://school.test/api/classroom", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "alice" });
  m.published.mockResolvedValue(false);
  m.admin.mockResolvedValue(false);
  m.rpc.mockResolvedValue({ data: { ok: true, revision: 1 }, error: null });
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
