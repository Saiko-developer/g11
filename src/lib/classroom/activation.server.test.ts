import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  admin: vi.fn(),
  prepare: vi.fn(),
  listen: vi.fn(),
  query: vi.fn(),
}));
vi.mock("@/lib/api-guard.server", () => ({ requireUser: m.auth }));
vi.mock("./db.server", () => ({ classroomAdmin: m.admin }));
vi.mock("./audio.server", () => ({
  prepareClassroomAudio: m.prepare,
  readClassroomAudio: m.listen,
  classroomAudioIdentity: async (_lesson: unknown, cursor: number) => ({ hash: String(cursor) }),
}));
vi.mock("./manifest.server", () => ({
  lessonHash: async () => "a".repeat(64),
  publishedLesson: async () => false,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ in: m.query }) }) },
}));
import { getTeachingSetup, postTeachingSetup } from "./activation.server";
const req = (body: unknown) =>
  new Request("https://school.test/api/teaching-setup", {
    method: "POST",
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "admin" });
  m.admin.mockResolvedValue(true);
  m.prepare.mockResolvedValue(Response.json({ ok: true }));
  m.query.mockResolvedValue({ data: [], error: null });
});
it("denies non-admins before reading setup state or generating audio", async () => {
  m.admin.mockResolvedValue(false);
  expect(
    (await getTeachingSetup(new Request("https://school.test/api/teaching-setup"))).status,
  ).toBe(403);
  expect(
    (await postTeachingSetup(req({ grade: 10, action: "prepare", cursor: 0, acknowledge: true })))
      .status,
  ).toBe(403);
  expect(m.prepare).not.toHaveBeenCalled();
});
it("permits bounded private draft preparation only after explicit acknowledgement", async () => {
  expect(
    (await postTeachingSetup(req({ grade: 10, day: 0, action: "prepare", cursor: 0 }))).status,
  ).toBe(400);
  expect(
    (
      await postTeachingSetup(
        req({ grade: 10, day: 0, action: "prepare", cursor: 0, acknowledge: true }),
      )
    ).status,
  ).toBe(200);
  expect(m.prepare).toHaveBeenCalledTimes(1);
});
it("rejects cursors outside the chosen class without calling the provider", async () => {
  expect(
    (
      await postTeachingSetup(
        req({ grade: 10, day: 0, action: "prepare", cursor: 16, acknowledge: true }),
      )
    ).status,
  ).toBe(400);
  expect(m.prepare).not.toHaveBeenCalled();
});
it("does not publish a class with missing audio", async () => {
  const r = await postTeachingSetup(
    req({ grade: 10, day: 0, action: "publish", acknowledge: true }),
  );
  expect(r.status).toBe(409);
  expect((await r.json()).error).toBe("prepare_audio_first");
});
