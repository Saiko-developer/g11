import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  stored: vi.fn(),
  upload: vi.fn(),
  version: vi.fn(),
  event: vi.fn(),
  generate: vi.fn(),
  catalog: vi.fn(),
}));
vi.mock("./store.server", () => ({
  ...mocks,
  audioDb: vi.fn(() => {
    throw Error("Unexpected database call");
  }),
}));
vi.mock("./catalog.server", () => ({ audioCatalog: mocks.catalog }));
vi.mock("../ttsGenerate.server", () => ({ generateSpeech: mocks.generate }));
import { workOneAudioJob, retryAfterSeconds } from "./worker.server";
import { syntheticWav } from "./test-wav";
const job = {
  id: "job",
  version_id: "version",
  clip_id: "pilot",
  token: "lease",
  regenerate: false,
  allow_generation: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockImplementation(async (name: string) =>
    name === "lesson_mp3_claim" ? [job] : true,
  );
  mocks.catalog.mockResolvedValue([
    {
      id: "pilot",
      pilot: true,
      script_hash: "hash",
      grade: 11,
      unit: 1,
      section: "grammar",
      text: "Fixed authored narration",
      source: "walkthrough",
      legacy_path: "old.wav",
      legacy_bucket: "old",
    },
  ]);
  mocks.version.mockResolvedValue({ id: "version", script_hash: "hash" });
  mocks.upload.mockResolvedValue(undefined);
  mocks.event.mockResolvedValue(undefined);
  mocks.stored.mockResolvedValue(null);
});
describe("durable MP3 worker", () => {
  it("reuses original WAV and never calls TTS", async () => {
    mocks.stored.mockImplementation(async (path: string) =>
      path === "old.wav" ? syntheticWav() : null,
    );
    const result = await workOneAudioJob();
    expect(result.state).toBe("pending");
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "lesson_mp3_checkpoint",
      expect.objectContaining({
        p_token: "lease",
        p_patch: expect.objectContaining({ status: "pending" }),
      }),
    );
  });
  it("generates only when neither permanent nor legacy audio exists", async () => {
    mocks.generate.mockResolvedValue(
      new Response(syntheticWav().buffer, {
        headers: { "Content-Type": "audio/wav", "X-TTS-Provider": "gemini" },
      }),
    );
    expect((await workOneAudioJob()).state).toBe("pending");
    expect(mocks.generate).toHaveBeenCalledOnce();
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({ voice: "sarah", speed: 1, fetcher: expect.any(Function) }),
    );
  });
  it("does not pay again when resuming an uncertain job without recoverable audio", async () => {
    mocks.rpc.mockImplementation(async (name: string) =>
      name === "lesson_mp3_claim" ? [{ ...job, allow_generation: false }] : true,
    );
    expect((await workOneAudioJob()).state).toBe("failed");
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("does not replace invalid legacy WAV with a new paid request", async () => {
    mocks.stored.mockImplementation(async (path: string) =>
      path === "old.wav" ? new Uint8Array(80) : null,
    );
    expect((await workOneAudioJob()).state).toBe("failed");
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("honors Retry-After seconds and dates", () => {
    expect(retryAfterSeconds("30", 0)).toBe(30);
    expect(retryAfterSeconds("Thu, 01 Jan 1970 00:01:00 GMT", 0)).toBe(60);
    expect(retryAfterSeconds("invalid", 0)).toBeNull();
  });
});
