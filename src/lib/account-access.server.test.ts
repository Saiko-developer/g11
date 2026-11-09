import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { requireActiveAccount } from "./account-access.server";
import { requireUser } from "./api-guard.server";
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://example.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-key");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const request = () =>
  new Request("https://school.test/api/tts", { headers: { Authorization: "Bearer token" } });
it("checks the authenticated caller's database status, without trusting a submitted user ID", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ status: "active", is_admin: false }));
  expect(await requireActiveAccount(request())).toBeNull();
  expect(fetch).toHaveBeenCalledWith(
    "https://example.test/rest/v1/rpc/my_access",
    expect.objectContaining({
      method: "POST",
      body: "{}",
      headers: expect.objectContaining({ Authorization: "Bearer token" }),
    }),
  );
});
it("blocks suspended accounts with 403, not another login", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ status: "suspended" }));
  const result = await requireActiveAccount(request());
  expect(result?.status).toBe(403);
  expect((await result!.json()).error).toBe("account_suspended");
});
it.each([null, {}, { status: "unknown" }])(
  "fails closed on invalid status response %j",
  async (data) => {
    vi.mocked(fetch).mockResolvedValue(Response.json(data));
    expect((await requireActiveAccount(request()))?.status).toBe(503);
  },
);
it.each([403, 500])(
  "reports account service failure %i without permission to call AI",
  async (status) => {
    vi.mocked(fetch).mockResolvedValue(new Response("blocked", { status }));
    expect((await requireActiveAccount(request()))?.status).toBe(503);
  },
);
it("fails closed on a network error", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  expect((await requireActiveAccount(request()))?.status).toBe(503);
});
it("checks account status after bearer verification only when explicitly requested", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(Response.json({ id: "student" }))
    .mockResolvedValueOnce(Response.json({ status: "suspended" }));
  expect(((await requireUser(request(), { enforceAccountStatus: true })) as Response).status).toBe(
    403,
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  vi.mocked(fetch)
    .mockClear()
    .mockResolvedValueOnce(Response.json({ id: "student" }));
  expect(await requireUser(request())).toEqual({ userId: "student" });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("does not turn invalid project keys into another student login", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ message: "Invalid API key" }, { status: 401 }),
  );
  expect((await requireActiveAccount(request()))?.status).toBe(503);
});
it("lets the client refresh a genuinely rejected access token", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ code: "bad_jwt" }, { status: 401 }));
  expect((await requireActiveAccount(request()))?.status).toBe(401);
});
