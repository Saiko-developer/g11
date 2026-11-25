import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  admin: vi.fn(),
  rpc: vi.fn(),
  rows: vi.fn(),
  deleteAudioVersion: vi.fn(),
  save: vi.fn(),
  published: vi.fn(),
}));
vi.mock("../api-guard.server", () => ({ requireUser: mocks.auth }));
vi.mock("../classroom/db.server", () => ({ classroomAdmin: mocks.admin }));
vi.mock(import("../classroom/manifest.server"), async (original) => ({
  ...(await original()),
  publishedLesson: mocks.published,
}));
vi.mock("./store.server", () => ({
  ...mocks,
  audioDb: () => ({
    from: () => ({
      update: (data: unknown) => ({
        eq: (_column: string, id: string) => ({
          select: () => ({ single: () => mocks.save(id, data) }),
        }),
      }),
    }),
  }),
}));
import { audioManagerGet, audioManagerPost, archiveParts } from "./admin.server";
import { audioCatalog } from "./catalog.server";
beforeEach(() => vi.clearAllMocks());
describe("audio management access and limits", () => {
  it("rejects anonymous preview, downloads and job actions before privileged reads", async () => {
    mocks.auth.mockResolvedValue(new Response("Sign in", { status: 401 }));
    for (const url of [
      "https://app/api/audio-manager",
      "https://app/api/audio-manager?version=123",
      "https://app/api/audio-manager?format=zip&grade=11",
    ])
      expect((await audioManagerGet(new Request(url))).status).toBe(401);
    expect(
      (
        await audioManagerPost(
          new Request("https://app/api/audio-manager", {
            method: "POST",
            body: '{"action":"work"}',
          }),
        )
      ).status,
    ).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.rows).not.toHaveBeenCalled();
  });
  it("rejects active non-admin accounts on the server", async () => {
    mocks.auth.mockResolvedValue({ userId: "student" });
    mocks.admin.mockResolvedValue(false);
    expect((await audioManagerGet(new Request("https://app/api/audio-manager"))).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("requires confirmation before queueing paid work", async () => {
    mocks.auth.mockResolvedValue({ userId: "admin" });
    mocks.admin.mockResolvedValue(true);
    const response = await audioManagerPost(
      new Request("https://app/api/audio-manager", {
        method: "POST",
        body: '{"action":"enqueue","ids":["pilot"]}',
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("splits grade downloads by both byte and file limits", () => {
    expect(
      archiveParts(Array.from({ length: 44 }, () => ({ bytes: 1000 }))).map((p) => p.length),
    ).toEqual([20, 20, 4]);
    expect(
      archiveParts([{ bytes: 20 }, { bytes: 20 }, { bytes: 20 }], 32).map((p) => p.length),
    ).toEqual([1, 1, 1]);
  });
});

const post = (body: Record<string, unknown>) =>
  audioManagerPost(
    new Request("https://app/api/audio-manager", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

it.each([10, 12])("lets admins save and regenerate a Grade %i script", async (grade) => {
  mocks.auth.mockResolvedValue({ userId: "admin" });
  mocks.admin.mockResolvedValue(true);
  mocks.save.mockResolvedValue({ error: null });
  mocks.published.mockResolvedValue(true);
  const clip = (await audioCatalog()).find((c) => c.grade === grade && c.section === "grammar")!;
  const ids = [clip.id];
  expect(
    (await post({ action: "save-script", ids, script: "New script", confirmed: true })).status,
  ).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith(clip.id, { script_draft: "New script" });
  expect((await post({ action: "regenerate", ids, confirmed: true })).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith("lesson_mp3_regenerate", {
    p_clip: clip.id,
    p_user: "admin",
    p_engine: "gemini",
  });
  expect(mocks.published).toHaveBeenCalledTimes(grade === 10 ? 1 : 0);
});

it("allows only a confirmed admin to delete a specific generated version", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  mocks.auth.mockResolvedValue({ userId: "admin" });
  mocks.admin.mockResolvedValue(false);
  expect((await post({ action: "delete-audio", ids: [id], confirmed: true })).status).toBe(403);
  mocks.admin.mockResolvedValue(true);
  expect((await post({ action: "delete-audio", ids: [id] })).status).toBe(400);
  expect(mocks.deleteAudioVersion).not.toHaveBeenCalled();
  expect((await post({ action: "delete-audio", ids: [id], confirmed: true })).status).toBe(200);
  expect(mocks.deleteAudioVersion.mock.calls).toEqual([[id, "admin"]]);
});

it("keeps unit ZIPs scoped and grade backup parts ordered without mixing units", async () => {
  const { lessonArchiveParts } = await import("./admin.server");
  const items = [10, 2, 1, 2].map((unit, index) => ({
    bytes: 100,
    clip: { grade: 11, unit, lesson_id: `g11-u${unit}-grammar`, segment_order: 4 - index },
  }));
  const unit = lessonArchiveParts(items, 11, 2);
  expect(unit.map((part) => part.map((row) => row.clip.segment_order))).toEqual([[1, 3]]);
  const grade = lessonArchiveParts(items, 11);
  expect(grade.map((part) => part.map((row) => row.clip.unit))).toEqual([[1], [2, 2], [10]]);
});
