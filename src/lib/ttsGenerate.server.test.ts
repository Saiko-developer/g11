import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("./gemini-direct.server", () => ({ geminiDirectSpeech: vi.fn(async () => null) }));
import { generateSpeech } from "./ttsGenerate.server";
beforeEach(() => {
  vi.stubEnv("LOVABLE_API_KEY", "test-only");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(new Uint8Array(2048))),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("never spends on a rejected OpenAI voice for Gemini-only classroom narration", async () => {
  expect((await generateSpeech({ text: "မင်္ဂလာပါ", provider: "gemini" })).status).toBe(503);
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("preserves the existing OpenAI fallback for other speech callers", async () => {
  const result = await generateSpeech({ text: "မင်္ဂလာပါ" });
  expect(result.status).toBe(200);
  expect(result.headers.get("X-TTS-Provider")).toBe("openai");
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("falls back to direct Gemini even when Speaking explicitly requests OpenAI", async () => {
  const { geminiDirectSpeech } = await import("./gemini-direct.server");
  vi.mocked(geminiDirectSpeech).mockResolvedValueOnce(new Uint8Array(2048));
  vi.mocked(fetch)
    .mockReset()
    .mockResolvedValueOnce(new Response("provider credits", { status: 402 }));
  const result = await generateSpeech({ text: "Hello", voice: "echo", provider: "openai" });
  expect(result.status).toBe(200);
  expect(result.headers.get("X-TTS-Provider")).toBe("gemini");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).voice).toBe("echo");
});
it("works with Gemini-only configuration when Lovable is absent", async () => {
  vi.stubEnv("LOVABLE_API_KEY", "");
  const { geminiDirectSpeech } = await import("./gemini-direct.server");
  vi.mocked(geminiDirectSpeech).mockResolvedValueOnce(new Uint8Array(2048));
  expect((await generateSpeech({ text: "မင်္ဂလာပါ", provider: "gemini" })).status).toBe(200);
  expect(fetch).not.toHaveBeenCalled();
});
it("does not misreport provider credit failure as account credit failure", async () => {
  vi.mocked(fetch)
    .mockReset()
    .mockResolvedValueOnce(new Response("credits exhausted", { status: 402 }));
  const result = await generateSpeech({ text: "Hello", provider: "openai" });
  expect(result.status).toBe(503);
  expect((await result.json()).error).toBe("ai_provider_unavailable");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("preserves a successful requested OpenAI voice without calling Gemini", async () => {
  const { geminiDirectSpeech } = await import("./gemini-direct.server");
  vi.mocked(geminiDirectSpeech).mockClear();
  vi.mocked(fetch)
    .mockReset()
    .mockResolvedValueOnce(new Response(new Uint8Array(2048)));
  const result = await generateSpeech({ text: "Hello", voice: "echo", provider: "openai" });
  expect(result.headers.get("X-TTS-Provider")).toBe("openai");
  expect(geminiDirectSpeech).not.toHaveBeenCalled();
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).input).toBe("Hello");
});
it("does not spend on fallback after cancellation", async () => {
  const { geminiDirectSpeech } = await import("./gemini-direct.server");
  vi.mocked(geminiDirectSpeech).mockClear();
  const controller = new AbortController();
  controller.abort();
  expect((await generateSpeech({ text: "Hello", signal: controller.signal })).status).toBe(499);
  expect(fetch).not.toHaveBeenCalled();
  expect(geminiDirectSpeech).not.toHaveBeenCalled();
});

it("gives gateway Gemini an explicit audio-only transcript task too", async () => {
  vi.mocked(fetch)
    .mockReset()
    .mockResolvedValueOnce(new Response(new Uint8Array(2048)));
  const response = await generateSpeech({ text: "မင်္ဂလာပါ", provider: "gemini" });
  const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
  expect(response.status).toBe(200);
  expect(body.contents[0].parts[0].text).toContain("Generate audio only.");
  expect(body.contents[0].parts[0].text).toMatch(/Transcript:\nမင်္ဂလာပါ$/);
  expect(body.generationConfig.responseModalities).toEqual(["AUDIO"]);
});
