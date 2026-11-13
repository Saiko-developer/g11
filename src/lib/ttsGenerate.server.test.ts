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
