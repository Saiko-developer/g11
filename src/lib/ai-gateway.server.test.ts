import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { LanguageModelV3, LanguageModelV3StreamPart } from "@ai-sdk/provider";
const m = vi.hoisted(() => ({ generate: vi.fn(), stream: vi.fn() }));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => () => ({
    doGenerate: m.generate,
    doStream: m.stream,
    specificationVersion: "v3",
    provider: "google",
    modelId: "backup",
    supportedUrls: {},
  }),
}));
import { getChatModel, withGeminiFallback } from "./ai-gateway.server";
const options = { prompt: [] };
const frames = (parts: LanguageModelV3StreamPart[]) =>
  new ReadableStream<LanguageModelV3StreamPart>({
    start(c) {
      for (const part of parts) c.enqueue(part);
      c.close();
    },
  });
const model = (stream = vi.fn(), generate = vi.fn()) =>
  ({
    specificationVersion: "v3",
    provider: "test",
    modelId: "primary",
    supportedUrls: {},
    doGenerate: generate,
    doStream: stream,
  }) as unknown as LanguageModelV3;
const consume = async (stream: ReadableStream<LanguageModelV3StreamPart>) => {
  const out = [];
  const reader = stream.getReader();
  for (;;) {
    const next = await reader.read();
    if (next.done) return out;
    out.push(next.value);
  }
};
beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-only");
  m.generate.mockReset().mockResolvedValue({ content: [{ type: "text", text: "backup" }] });
  m.stream
    .mockReset()
    .mockResolvedValue({ stream: frames([{ type: "text-delta", id: "t", delta: "backup" }]) });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("recovers text generation from Lovable 402 using Gemini once", async () => {
  const primary = vi.fn().mockRejectedValue(Object.assign(new Error("402"), { statusCode: 402 }));
  await withGeminiFallback(model(undefined, primary)).doGenerate(options);
  expect(primary).toHaveBeenCalledTimes(1);
  expect(m.generate).toHaveBeenCalledTimes(1);
});
it("supports direct-only configuration without calling Gemini twice", async () => {
  vi.stubEnv("LOVABLE_API_KEY", "");
  m.generate.mockRejectedValue(new Error("403 invalid key"));
  await expect(getChatModel("unused").doGenerate(options)).rejects.toMatchObject({
    code: "ai_provider_unavailable",
    statusCode: 503,
  });
  expect(m.generate).toHaveBeenCalledTimes(1);
});
it("recovers a returned stream error frame before content is delivered", async () => {
  const stream = vi.fn().mockResolvedValue({
    stream: frames([
      { type: "stream-start", warnings: [] },
      { type: "error", error: new Error("402") },
    ]),
  });
  const result = await withGeminiFallback(model(stream)).doStream(options);
  expect(await consume(result.stream)).toEqual([{ type: "text-delta", id: "t", delta: "backup" }]);
  expect(m.stream).toHaveBeenCalledTimes(1);
});
it("does not replay text after partial primary output", async () => {
  const stream = vi.fn().mockResolvedValue({
    stream: frames([
      { type: "text-delta", id: "t", delta: "hello" },
      { type: "error", error: new Error("402") },
    ]),
  });
  const parts = await consume((await withGeminiFallback(model(stream)).doStream(options)).stream);
  expect(parts[0]).toMatchObject({ delta: "hello" });
  expect(parts[1]).toMatchObject({ type: "error", error: { code: "ai_provider_unavailable" } });
  expect(m.stream).not.toHaveBeenCalled();
});
it("does not call fallback after caller cancellation", async () => {
  const controller = new AbortController();
  controller.abort();
  const primary = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
  await expect(
    withGeminiFallback(model(undefined, primary)).doGenerate({
      ...options,
      abortSignal: controller.signal,
    }),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(m.generate).not.toHaveBeenCalled();
});
it("reports provider outage rather than student credit exhaustion when both fail", async () => {
  m.stream.mockRejectedValue(new Error("403"));
  await expect(
    withGeminiFallback(model(vi.fn().mockRejectedValue(new Error("402")))).doStream(options),
  ).rejects.toMatchObject({ code: "ai_provider_unavailable", statusCode: 503 });
  expect(m.stream).toHaveBeenCalledTimes(1);
});
it("sanitizes error frames from the backup as well", async () => {
  m.stream.mockResolvedValue({
    stream: frames([{ type: "error", error: new Error("402 provider credit") }]),
  });
  const result = await withGeminiFallback(
    model(vi.fn().mockRejectedValue(new Error("402"))),
  ).doStream(options);
  const parts = await consume(result.stream);
  expect(parts[0]).toMatchObject({ type: "error", error: { code: "ai_provider_unavailable" } });
});
it("returns a provider configuration error without either key", () => {
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("LOVABLE_API_KEY", "");
  expect(() => getChatModel("unused")).toThrow("AI provider unavailable");
});
