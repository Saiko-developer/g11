import { beforeEach, expect, it, vi } from "vitest";
import { restoreAudio } from "./restore.server";
import { wavToMp3 } from "./codec.server";
import { syntheticWav } from "./test-wav";
import { zipStream } from "./zip.server";

const hash = "a".repeat(64);
const id = "00000000-0000-4000-8000-000000000001";
const catalog = vi.hoisted(() => ({ list: vi.fn() }));
const mocks = vi.hoisted(() => ({
  rows: vi.fn(),
  upload: vi.fn(),
  version: vi.fn(),
  upsert: vi.fn(),
  select: vi.fn(),
}));
vi.mock("./catalog.server", () => ({ audioCatalog: catalog.list }));
vi.mock("./store.server", () => ({
  ...mocks,
  audioDb: () => ({
    from: () => ({
      upsert: mocks.upsert,
      update: () => {
        const query = { eq: () => query, is: () => query, select: mocks.select };
        return query;
      },
    }),
  }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  catalog.list.mockResolvedValue([
    {
      id: "g10-clip",
      grade: 10,
      unit: 1,
      lesson_id: "g10-writing",
      section: "writing",
      segment_order: 1,
      script_hash: hash,
      script_version: "v1",
      pilot: false,
    },
  ]);
  mocks.rows.mockResolvedValue([]);
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.select.mockResolvedValue({ data: [{ id: "g10-clip" }], error: null });
});

async function backup(hasProvenance: boolean) {
  const mp3 = wavToMp3(syntheticWav()).bytes;
  const entry = {
    grade: 10,
    unit: 1,
    lesson: "g10-writing",
    section: "writing",
    segmentOrder: 1,
    filename: "clip.mp3",
    scriptHash: hash,
    scriptVersion: "v1",
    versionId: id,
    voice: "VoxCPM2 Burmese Teacher",
    bytes: mp3.length,
    ...(hasProvenance ? { provider: "voxcpm2_local", model: "VoxCPM2-Q8_0" } : {}),
  };
  const bytes = await new Response(
    zipStream([
      {
        name: "manifest.json",
        read: async () => new TextEncoder().encode(JSON.stringify({ clips: [entry] })),
      },
      { name: "clip.mp3", read: async () => mp3 },
    ]),
  ).arrayBuffer();
  return {
    entry,
    request: new Request("https://academy.test/api/audio-manager?backup=restore", {
      method: "POST",
      body: bytes,
    }),
  };
}

it("restores a local classroom backup with model and voice provenance", async () => {
  const { entry, request } = await backup(true);
  const path = `grade-10/unit-01/writing/${id}/audio.mp3`;
  mocks.version.mockResolvedValueOnce(null).mockResolvedValueOnce({
    clip_id: "g10-clip",
    script_hash: hash,
    script_version: "v1",
    status: "approved",
    storage_path: path,
    bytes: entry.bytes,
  });
  expect(await restoreAudio(request, id, true)).toEqual([{ file: "clip.mp3", status: "Imported" }]);
  expect(mocks.upsert).toHaveBeenLastCalledWith(
    expect.objectContaining({ voice: entry.voice, provider: entry.provider, model: entry.model }),
    expect.anything(),
  );
  expect(mocks.upload).toHaveBeenCalledWith(path, expect.any(Uint8Array), "audio/mpeg");
});

it("rejects missing local provenance before any storage write", async () => {
  const { request } = await backup(false);
  expect(await restoreAudio(request, id, true)).toEqual([
    { file: "clip.mp3", status: "Backup voice and provider do not match" },
  ]);
  expect(mocks.upload).not.toHaveBeenCalled();
});
