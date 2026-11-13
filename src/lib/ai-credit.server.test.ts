import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), auth: vi.fn() }));
vi.mock("./api-guard.server", () => ({ requireUser: mocks.auth }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
import { withAiCredit } from "./ai-credit.server";
const request = () =>
  new Request("https://school.test/api/ai", {
    method: "POST",
    headers: { "Idempotency-Key": "00000000-0000-4000-8000-000000000001" },
  });
beforeEach(() => {
  vi.stubEnv("AI_CREDIT_GUARD_ENABLED", "true");
  mocks.auth.mockResolvedValue({ userId: "student" });
  mocks.rpc.mockReset();
  mocks.rpc.mockResolvedValue({ data: { ok: true }, error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
});
it("refuses provider work when credit service is unavailable", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: "missing" } });
  const provider = vi.fn();
  expect((await withAiCredit(request(), "check", provider)).status).toBe(503);
  expect(provider).not.toHaveBeenCalled();
});
it("does not charge replayed requests or bypass refused authentication", async () => {
  const provider = vi.fn();
  mocks.rpc.mockResolvedValue({ data: { ok: false, reason: "duplicate" }, error: null });
  expect((await withAiCredit(request(), "tutor", provider)).status).toBe(409);
  expect(provider).not.toHaveBeenCalled();
  mocks.auth.mockResolvedValue(new Response("Sign in", { status: 401 }));
  expect((await withAiCredit(request(), "tutor", provider)).status).toBe(401);
});
it("refunds failed responses exactly once and settles successful responses", async () => {
  await withAiCredit(request(), "check", async () => new Response("failed", { status: 502 }));
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    "settle_ai_credit",
    expect.objectContaining({ p_success: false }),
  );
  await withAiCredit(request(), "check", async () => Response.json({ answer: "yes" }));
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    "settle_ai_credit",
    expect.objectContaining({ p_success: true }),
  );
});
it("detects AI SDK SSE errors even when split across chunks and HTTP status is 200", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      c.enqueue(encoder.encode('data: {"ty'));
      c.enqueue(encoder.encode('pe":"error","errorText":"failed"}\n\n'));
      c.close();
    },
  });
  const response = await withAiCredit(
    request(),
    "tutor",
    async () => new Response(body, { headers: { "Content-Type": "text/event-stream" } }),
  );
  await response.text();
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    "settle_ai_credit",
    expect.objectContaining({ p_success: false }),
  );
});
it("new classroom reservations remain required even when the legacy rollout flag is off", async () => {
  vi.stubEnv("AI_CREDIT_GUARD_ENABLED", "false");
  await withAiCredit(request(), "classroom", async () => Response.json({ answer: "ok" }), true);
  expect(mocks.rpc).toHaveBeenCalledWith("reserve_ai_credit", expect.anything());
});

it("does not refund a user cancellation after answer text was delivered", async () => {
  const encoder = new TextEncoder();
  const source = new ReadableStream({
    start(c) {
      c.enqueue(encoder.encode('data: {"type":"text-delta","delta":"answer"}\n\n'));
    },
  });
  const response = await withAiCredit(
    request(),
    "tutor",
    async () => new Response(source, { headers: { "Content-Type": "text/event-stream" } }),
  );
  const reader = response.body!.getReader();
  await reader.read();
  await reader.cancel();
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    "settle_ai_credit",
    expect.objectContaining({ p_success: true }),
  );
});

it("refunds cancellation before any streamed text, including a pending pull", async () => {
  const source = new ReadableStream();
  const response = await withAiCredit(
    request(),
    "tutor",
    async () => new Response(source, { headers: { "Content-Type": "text/event-stream" } }),
  );
  await response.body!.cancel();
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    "settle_ai_credit",
    expect.objectContaining({ p_success: false }),
  );
});
