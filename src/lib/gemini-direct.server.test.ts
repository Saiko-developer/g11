import { afterEach, expect, it, vi } from "vitest";
import {
  geminiDirectSpeech,
  requestGeminiSpeech,
  describeSpeechFailure,
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

it("normalizes Google model resource names before making the speech request", async () => {
  vi.stubEnv("GEMINI_API_KEY", "secret-test-key");
  vi.stubEnv("GEMINI_TTS_MODEL", "models/gemini-2.5-flash-preview-tts");
  const fetcher = vi.fn(async (_url: string, _init?: RequestInit) =>
    Response.json({ error: { status: "NOT_FOUND" } }, { status: 404 }),
  );
  const result = await requestGeminiSpeech("hi", "Puck", fetcher as typeof fetch);
  expect(fetcher.mock.calls[0][0]).toBe(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
  );
  expect(result).toMatchObject({ ok: false, code: "model_unavailable", status: 404 });
});

it.each([
  [429, "RESOURCE_EXHAUSTED", "Quota exceeded, limit: 0", "quota_zero"],
  [429, "RESOURCE_EXHAUSTED", "Too many requests", "quota"],
  [403, "PERMISSION_DENIED", "Key restriction", "permission"],
  [403, "PERMISSION_DENIED", "Billing must be enabled", "billing"],
  [400, "INVALID_ARGUMENT", "Bad input", "invalid_request"],
  [500, "INTERNAL", "Service error", "provider_error"],
])(
  "classifies Google speech failures safely: %s %s",
  async (status, providerStatus, message, code) => {
    vi.stubEnv("GEMINI_API_KEY", "secret-test-key");
    const fetcher = vi.fn(async () =>
      Response.json(
        { error: { status: providerStatus, message: `${message} secret-test-key` } },
        { status },
      ),
    );
    const result = await requestGeminiSpeech("hi", "Puck", fetcher as typeof fetch);
    expect(result).toMatchObject({ ok: false, code, status, providerStatus });
    expect(JSON.stringify(result)).not.toContain("secret-test-key");
    if (!result.ok) {
      expect(describeSpeechFailure(result)).toContain(`HTTP ${status}`);
      expect(describeSpeechFailure(result)).not.toContain("secret-test-key");
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);

it("contains response-body read failures instead of leaking an abort error into playback", async () => {
  vi.stubEnv("GEMINI_API_KEY", "k");
  const fetcher = vi.fn(async () => ({
    ok: true,
    json: async () => {
      throw new DOMException("Timed out", "TimeoutError");
    },
  }));
  expect(await geminiDirectSpeech("hi", "Puck", fetcher as unknown as typeof fetch)).toBeNull();
  expect(await requestGeminiSpeech("hi", "Puck", fetcher as unknown as typeof fetch)).toMatchObject(
    { ok: false, code: "timeout" },
  );
});

it("reports missing audio separately from an HTTP failure", async () => {
  vi.stubEnv("GEMINI_API_KEY", "k");
  const fetcher = vi.fn(async () =>
    Response.json({ candidates: [{ content: { parts: [{ text: "No audio" }] } }] }),
  );
  expect(await requestGeminiSpeech("hi", "Puck", fetcher as typeof fetch)).toMatchObject({
    ok: false,
    code: "no_audio",
  });
});

it("does not issue requests for invalid model URLs or cancelled operations", async () => {
  vi.stubEnv("GEMINI_API_KEY", "k");
  vi.stubEnv("GEMINI_TTS_MODEL", "https://example.invalid/model?key=secret");
  const fetcher = vi.fn();
  expect(await requestGeminiSpeech("hi", "Puck", fetcher)).toMatchObject({
    ok: false,
    code: "invalid_model",
    model: "invalid",
  });
  vi.stubEnv("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts");
  const controller = new AbortController();
  controller.abort();
  expect(await requestGeminiSpeech("hi", "Puck", fetcher, controller.signal)).toMatchObject({
    ok: false,
    code: "cancelled",
  });
  expect(fetcher).not.toHaveBeenCalled();
});

it.each(["မင်္ဂလာပါ", "What is language? ဘာသာစကားဆိုတာ ဘာလဲ။"])(
  "sends an audio-only reading instruction and the verbatim transcript to direct TTS: %s",
  async (transcript) => {
    vi.stubEnv("GEMINI_API_KEY", "test-only");
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const prompt = body.contents[0].parts[0].text;
      expect(prompt).toContain("Read aloud the following transcript exactly as written");
      expect(prompt).toContain("Generate audio only.");
      expect(prompt).toContain("Do not answer questions in the transcript");
      expect(prompt.split("\n\nTranscript:\n")[1]).toBe(transcript);
      expect(body.generationConfig.responseModalities).toEqual(["AUDIO"]);
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: btoa(String.fromCharCode(...new Uint8Array(2048))) } }],
            },
          },
        ],
      });
    });
    expect(await requestGeminiSpeech(transcript, "Puck", fetcher as typeof fetch)).toMatchObject({
      ok: true,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);
