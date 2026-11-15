import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  post: vi.fn(),
  auth: vi.fn(),
  direct: vi.fn(),
  scope: vi.fn(),
  credit: null as Response | null,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    () =>
    (config: {
      server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } };
    }) => {
      m.post.mockImplementation(config.server.handlers.POST);
      return {};
    },
}));
vi.mock("@/lib/api-guard.server", () => ({
  requireUser: m.auth,
  untrusted: (_label: string, value: string) => value,
  cleanLine: (v: string) => v,
}));
vi.mock("@/lib/ai-credit.server", () => ({
  withAiCredit: async (_r: Request, _op: string, run: () => Promise<Response>) => m.credit ?? run(),
}));
vi.mock("@/lib/grade11SpeakingSessions.server", () => ({ validateGrade11Speaking: m.scope }));
vi.mock("@/lib/gemini-direct.server", async (original) => ({
  ...(await original<object>()),
  geminiDirectTranscribe: m.direct,
}));
import "../routes/api/transcribe";
function request(extra: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", new File(["voice"], "voice.webm", { type: "audio/webm" }));
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return { formData: async () => form, signal: new AbortController().signal } as Request;
}
beforeEach(() => {
  vi.stubEnv("LOVABLE_API_KEY", "test-only");
  m.credit = null;
  m.auth.mockReset().mockResolvedValue({ userId: "student" });
  m.scope.mockReset().mockResolvedValue({ ok: true });
  m.direct.mockReset().mockResolvedValue("Hello");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("credits", { status: 402 })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("recovers transcription after gateway credit failure", async () => {
  const result = await m.post({ request: request({ language: "en" }) });
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ text: "Hello" });
  expect(m.direct).toHaveBeenCalledTimes(1);
});
it("allows direct-only transcription without Lovable", async () => {
  vi.stubEnv("LOVABLE_API_KEY", "");
  const result = await m.post({ request: request() });
  expect(result.status).toBe(200);
  expect(fetch).not.toHaveBeenCalled();
  expect(m.direct).toHaveBeenCalledTimes(1);
});
it("returns service failure rather than student credit failure when both fail", async () => {
  m.direct.mockResolvedValue(null);
  const result = await m.post({ request: request() });
  expect(result.status).toBe(503);
  expect((await result.json()).error).toBe("ai_provider_unavailable");
});
it("preserves silence without spending on another provider", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ text: "" }));
  const result = await m.post({ request: request() });
  expect(await result.json()).toEqual({ text: "" });
  expect(m.direct).not.toHaveBeenCalled();
});
it("recovers malformed successful upstream responses", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ unexpected: true }));
  expect((await m.post({ request: request({ grade: "11" }) })).status).toBe(200);
  expect(m.direct).toHaveBeenCalledTimes(1);
});
it("does not bypass student credit denial", async () => {
  m.credit = new Response(null, { status: 429 });
  expect((await m.post({ request: request() })).status).toBe(429);
  expect(fetch).not.toHaveBeenCalled();
  expect(m.direct).not.toHaveBeenCalled();
});
it("does not call either provider for anonymous users", async () => {
  m.auth.mockResolvedValue(new Response(null, { status: 401 }));
  expect((await m.post({ request: request() })).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
  expect(m.direct).not.toHaveBeenCalled();
});
it("validates speaking session ownership before either provider", async () => {
  m.scope.mockResolvedValue(new Response(null, { status: 403 }));
  expect(
    (
      await m.post({
        request: request({ grade11SpeakingSession: "other", grade11SpeakingUnit: "8" }),
      })
    ).status,
  ).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
  expect(m.direct).not.toHaveBeenCalled();
});
