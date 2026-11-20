import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), stored: vi.fn(), generate: vi.fn() }));
vi.mock("./store.server", () => ({ audioDb: () => ({ from: mocks.from }), stored: mocks.stored }));
vi.mock("../ttsGenerate.server", () => ({ generateSpeech: mocks.generate }));
import { approvedMp3 } from "./playback.server";
import { wavToMp3 } from "./codec.server";
import { syntheticWav } from "./test-wav";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUDIO_MP3_PILOT_PLAYBACK", "true");
  mocks.from.mockImplementation((table: string) => {
    const chain: {
      select: () => unknown;
      eq: () => unknown;
      not: () => unknown;
      limit: () => Promise<unknown>;
      maybeSingle: () => Promise<unknown>;
    } = {
      select: () => chain,
      eq: () => chain,
      not: () => chain,
      limit: async () => ({ data: [{ approved_version: "approved" }] }),
      maybeSingle: async () => ({
        data: { status: "approved", storage_path: "file.mp3", script_hash: "hash" },
      }),
    };
    return chain;
  });
});
afterEach(() => vi.unstubAllEnvs());
describe("approved permanent student playback", () => {
  it("serves approved MP3 repeatedly without invoking TTS", async () => {
    mocks.stored.mockResolvedValue(wavToMp3(syntheticWav()).bytes);
    for (let i = 0; i < 2; i++) {
      const response = await approvedMp3("hash");
      expect(response?.status).toBe(200);
      expect(response?.headers.get("Content-Type")).toBe("audio/mpeg");
    }
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("preparation acknowledges approved audio without downloading or generating it", async () => {
    expect((await approvedMp3("hash", true))?.status).toBe(200);
    expect(mocks.stored).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("does not silently regenerate a missing approved asset", async () => {
    mocks.stored.mockResolvedValue(null);
    expect((await approvedMp3("hash"))?.status).toBe(503);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("preserves the old WAV workflow while pilot playback is disabled", async () => {
    vi.stubEnv("AUDIO_MP3_PILOT_PLAYBACK", "false");
    expect(await approvedMp3("hash")).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
