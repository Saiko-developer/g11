import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  post: vi.fn(),
  auth: vi.fn(),
  scope: vi.fn(),
  speech: vi.fn(),
  cache: vi.fn(),
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
vi.mock("@/lib/api-guard.server", () => ({ requireUser: m.auth }));
vi.mock("@/lib/grade11SpeakingSessions.server", () => ({ validateGrade11Speaking: m.scope }));
vi.mock("@/lib/ttsGenerate.server", () => ({ generateSpeech: m.speech }));
vi.mock("@/lib/grade11GrammarAudioCache.server", () => ({ grade11GrammarAudio: m.cache }));
vi.mock("@/lib/ai-credit.server", () => ({
  withAiCredit: async (_r: Request, _op: string, run: () => Promise<Response>) => m.credit ?? run(),
}));
import "../routes/api/tts";
const request = (extra: object = {}) =>
  new Request("https://example.com/api/tts", {
    method: "POST",
    body: JSON.stringify({ text: "Hello", provider: "openai", voice: "echo", ...extra }),
  });
beforeEach(() => {
  m.auth.mockReset().mockResolvedValue({ userId: "student" });
  m.scope.mockReset().mockResolvedValue({ ok: true });
  m.speech.mockReset().mockResolvedValue(new Response(new Uint8Array(2048)));
  m.cache.mockReset();
  m.credit = null;
});
afterEach(() => vi.clearAllMocks());
it("preserves requested voice and passes caller cancellation into shared fallback", async () => {
  const req = request();
  expect((await m.post({ request: req })).status).toBe(200);
  expect(m.speech).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "openai", voice: "echo", signal: req.signal }),
  );
});
it("does not generate audio for anonymous users", async () => {
  m.auth.mockResolvedValue(new Response(null, { status: 401 }));
  expect((await m.post({ request: request() })).status).toBe(401);
  expect(m.speech).not.toHaveBeenCalled();
});
it("does not bypass account credit limits during provider failover", async () => {
  m.credit = new Response(null, { status: 429 });
  expect((await m.post({ request: request() })).status).toBe(429);
  expect(m.speech).not.toHaveBeenCalled();
});
it("checks Grade 11 speaking ownership before spending on speech", async () => {
  m.scope.mockResolvedValue(new Response(null, { status: 403 }));
  expect(
    (
      await m.post({
        request: request({ grade11SpeakingSession: "other", grade11SpeakingUnit: 8 }),
      })
    ).status,
  ).toBe(403);
  expect(m.speech).not.toHaveBeenCalled();
});
it("keeps cached lesson playback independent from new generation", async () => {
  m.cache.mockResolvedValue(new Response(new Uint8Array(2048)));
  expect((await m.post({ request: request({ lessonCache: "grade11-grammar" }) })).status).toBe(200);
  expect(m.speech).not.toHaveBeenCalled();
});
