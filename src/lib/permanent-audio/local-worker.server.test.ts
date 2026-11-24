import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { localWorkerPost } from "./local-worker.server";
import { inspectMp3 } from "./codec.server";
import { syntheticWav } from "./test-wav";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  stored: vi.fn(),
  upload: vi.fn(),
  version: vi.fn(),
  generateSpeech: vi.fn(),
}));
vi.mock("./store.server", () => mocks);
vi.mock("../ttsGenerate.server", () => ({ generateSpeech: mocks.generateSpeech }));
vi.mock("./catalog.server", () => ({
  audioCatalog: async () => [
    {
      id: "clip",
      grade: 11,
      unit: 1,
      section: "grammar",
      lesson_id: "g11-u1",
      segment_order: 3,
      script_hash: "hash",
      source: "walkthrough",
      text: "မင်္ဂလာပါ။ Both and.",
    },
  ],
}));
const secret = "test-".repeat(8);
const job = {
  id: "00000000-0000-4000-8000-000000000010",
  token: "00000000-0000-4000-8000-000000000011",
  version_id: "00000000-0000-4000-8000-000000000012",
  clip_id: "clip",
  state: "running",
  allow_generation: true,
  asset_token: null,
};

const request = (action: string, key = secret) =>
  new Request("https://app/api/audio-worker?engine=voxcpm2", {
    method: "POST",
    body: JSON.stringify({ action, id: job.id, token: job.token }),
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
  });
function wavRequest(wav: Uint8Array, token = job.token) {
  return new Request("https://app/api/audio-worker?engine=voxcpm2", {
    method: "POST",
    body: Uint8Array.from(wav).buffer,
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "audio/wav",
      "x-audio-job": job.id,
      "x-audio-lease": token,
    },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUDIO_LOCAL_WORKER_SECRET", secret);
  mocks.rpc.mockResolvedValue([job]);
  mocks.version.mockResolvedValue({
    clip_id: "clip",
    script_hash: "hash",
    provider: "voxcpm2_local",
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("Mac companion exchange", () => {
  it("checks its distinct bearer secret before DB access", async () => {
    expect((await localWorkerPost(request("claim", "wrong-key"))).status).toBe(401);
    vi.stubEnv("AUDIO_LOCAL_WORKER_SECRET", "");
    expect((await localWorkerPost(request("claim"))).status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("returns the exact authored script and order", async () => {
    const response = await localWorkerPost(request("claim"));
    expect(await response.json()).toMatchObject({
      state: "claimed",
      order: 3,
      text: "မင်္ဂလာပါ။ Both and.",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(mocks.generateSpeech).not.toHaveBeenCalled();
  });
  it("rejects stale leases before storage access", async () => {
    mocks.rpc.mockResolvedValue([]);
    expect((await localWorkerPost(wavRequest(syntheticWav()))).status).toBe(409);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("rejects invalid WAV without storing or publishing", async () => {
    expect((await localWorkerPost(wavRequest(new Uint8Array(44)))).status).toBe(422);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      "lesson_mp3_local_step",
      expect.objectContaining({ p_stage: "failed" }),
    );
  });
  it("reuses an already stored WAV on resume without asking the Mac to rerender", async () => {
    mocks.rpc.mockResolvedValueOnce([{ ...job, allow_generation: false, asset_token: job.token }]);
    mocks.stored.mockResolvedValue(syntheticWav());
    expect(await (await localWorkerPost(request("claim"))).json()).toEqual({ state: "pending" });
    expect(mocks.stored).toHaveBeenCalledWith(
      expect.stringContaining(`local-${job.token}/source.wav`),
    );
  });
  it("does not render or complete a resume with no stored WAV", async () => {
    mocks.rpc.mockResolvedValueOnce([{ ...job, allow_generation: false, asset_token: job.token }]);
    mocks.stored.mockResolvedValue(null);
    expect(await (await localWorkerPost(request("claim"))).json()).toEqual({ state: "failed" });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("acknowledges duplicate completion without another upload", async () => {
    mocks.rpc.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...job, state: "complete" }]);
    expect(await (await localWorkerPost(wavRequest(syntheticWav()))).json()).toEqual({
      state: "pending",
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("converts PCM to an immutable MP3 and finishes in review", async () => {
    expect(await (await localWorkerPost(wavRequest(syntheticWav()))).json()).toEqual({
      state: "pending",
    });
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    const [path, bytes, type] = mocks.upload.mock.calls[1];
    expect(path).toContain(`local-${job.token}/audio.mp3`);
    expect(type).toBe("audio/mpeg");
    expect(inspectMp3(bytes).duration).toBeGreaterThan(0);
    expect(mocks.rpc).toHaveBeenLastCalledWith(
      "lesson_mp3_local_step",
      expect.objectContaining({ p_stage: "pending" }),
    );
    expect(mocks.generateSpeech).not.toHaveBeenCalled();
  });
  const samples = process.env.VOXCPM_TEST_WAV_DIR;
  it.skipIf(!samples).each(["short-burmese", "mixed-burmese-english", "long-explanation"])(
    "accepts existing real VoxCPM2 WAV %s through the completion handler",
    async (name) => {
      const data = await readFile(join(samples!, `${name}.wav`));
      expect(await (await localWorkerPost(wavRequest(data))).json()).toEqual({ state: "pending" });
      expect(inspectMp3(mocks.upload.mock.calls[1][1]).duration).toBeGreaterThan(10);
      expect(mocks.generateSpeech).not.toHaveBeenCalled();
    },
  );
});
