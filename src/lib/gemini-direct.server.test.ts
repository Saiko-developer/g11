import { afterEach, expect, it, vi } from "vitest";
import {
  geminiDirectSpeech,
  geminiDirectTranscribe,
  shouldUseGeminiFallback,
} from "./gemini-direct.server";

afterEach(() => vi.unstubAllEnvs());

it("switches to the own Gemini key when Lovable credits run out (402)", () => {
  expect(shouldUseGeminiFallback(402)).toBe(true);
  expect(shouldUseGeminiFallback(400)).toBe(false);
});

it("returns Puck voice audio from the own key", async () => {
  vi.stubEnv("GEMINI_API_KEY", "k");
  const pcm = btoa(String.fromCharCode(...new Uint8Array(2048)));
  const fetcher = vi.fn(async (_u: unknown, init?: RequestInit) => {
    expect(
      JSON.parse(String(init!.body)).generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig
        .voiceName,
    ).toBe("Puck");
    return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: pcm } }] } }] });
  });
  expect((await geminiDirectSpeech("hi", "Puck", fetcher as typeof fetch))?.byteLength).toBe(2048);
});

it("transcribes speech with the own key, and does nothing without a key", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");
  const fetcher = vi.fn(async () =>
    Response.json({ candidates: [{ content: { parts: [{ text: " ဆရာ " }] } }] }),
  );
  expect(
    await geminiDirectTranscribe(
      { arrayBuffer: async () => new ArrayBuffer(4) } as Blob,
      "audio/webm",
      "p",
      fetcher as typeof fetch,
    ),
  ).toBeNull();
  vi.stubEnv("GEMINI_API_KEY", "k");
  expect(
    await geminiDirectTranscribe(
      { arrayBuffer: async () => new ArrayBuffer(4) } as Blob,
      "audio/webm",
      "p",
      fetcher as typeof fetch,
    ),
  ).toBe("ဆရာ");
});

it("passes the classroom deadline to direct Gemini instead of allowing an unbounded fallback", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-only");
  const controller = new AbortController();
  controller.abort(new DOMException("Timed out", "TimeoutError"));
  const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
    expect(init?.signal?.aborted).toBe(true);
    throw controller.signal.reason;
  });
  expect(
    await geminiDirectSpeech("မင်္ဂလာပါ", "Puck", fetcher as typeof fetch, controller.signal),
  ).toBeNull();
});
