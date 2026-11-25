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
  rpc: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock(import("./catalog.server"), async (original) => ({
  ...(await original()),
  audioCatalog: catalog.list,
}));
vi.mock("./store.server", () => ({
  ...mocks,
  audioDb: () => ({
    from: () => ({
      upsert: mocks.upsert,
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
  mocks.rpc.mockResolvedValue(true);
});

async function backup(hasProvenance: boolean, overrides = {}) {
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
    ...overrides,
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
  expect(mocks.rpc).toHaveBeenCalledWith("lesson_mp3_link_backup", { p_version: id });
});

it("rejects missing local provenance before any storage write", async () => {
  const { request } = await backup(false);
  expect(await restoreAudio(request, id, true)).toEqual([
    { file: "clip.mp3", status: "Backup voice and provider do not match" },
  ]);
  expect(mocks.upload).not.toHaveBeenCalled();
});

it("restores edited Grade 12 narration together with the saved text", async () => {
  const scriptText = "Revised Grade 12 explanation";
  const scriptVersion = "edited-grade12";
  catalog.list.mockResolvedValue([
    {
      id: "g12-clip",
      grade: 12,
      unit: 1,
      lesson_id: "g12-grammar",
      section: "grammar",
      segment_order: 1,
      source: "grade12-grammar",
      script_hash: hash,
      script_version: "g12-v1",
      pilot: true,
    },
  ]);
  const { entry, request } = await backup(true, {
    grade: 12,
    lesson: "g12-grammar",
    section: "grammar",
    scriptText,
    scriptVersion,
  });
  const path = `grade-12/unit-01/grammar/${id}/audio.mp3`;
  mocks.version.mockResolvedValueOnce(null).mockResolvedValueOnce({
    clip_id: "g12-clip",
    script_hash: hash,
    script_version: scriptVersion,
    script_text: scriptText,
    status: "approved",
    storage_path: path,
    bytes: entry.bytes,
  });

  expect(await restoreAudio(request, id, true)).toEqual([{ file: "clip.mp3", status: "Imported" }]);
  expect(mocks.upsert).toHaveBeenLastCalledWith(
    expect.objectContaining({ script_text: scriptText, script_version: scriptVersion }),
    expect.anything(),
  );
});
