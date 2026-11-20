import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), admin: vi.fn(), rpc: vi.fn(), rows: vi.fn() }));
vi.mock("../api-guard.server", () => ({ requireUser: mocks.auth }));
vi.mock("../classroom/db.server", () => ({ classroomAdmin: mocks.admin }));
vi.mock("./store.server", () => ({
  ...mocks,
  audioDb: () => {
    throw Error("Unexpected privileged access");
  },
}));
import { audioManagerGet, audioManagerPost, archiveParts } from "./admin.server";
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
