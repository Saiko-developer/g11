import { describe, expect, it, vi } from "vitest";
import {
  adjustWallet,
  assertActiveAdmin,
  assertNotMainAdmin,
  loadAdminAccounts,
} from "./admin-account-service.server";
const id = "00000000-0000-4000-8000-000000000001";
const account = {
  id,
  email: "owner@example.test",
  full_name: null,
  avatar_url: null,
  status: "active",
  suspended_until: null,
  created_at: "2026-11-09T00:00:00Z",
  last_seen_at: "2026-11-09T00:00:00Z",
  tutor_bonus: 0,
  exam_bonus: 0,
  tutor_used_today: 0,
  exam_used_today: 0,
  scholarship: "none",
  scholarship_note: null,
  is_admin: true,
  is_main_admin: true,
  is_teacher: false,
};
const active = { data: { status: "active", is_admin: true }, error: null };
const client = (rpc: ReturnType<typeof vi.fn>) =>
  ({ rpc }) as unknown as Parameters<typeof adjustWallet>[0];
describe("authoritative admin account operations", () => {
  it("preserves scholarship by sending null on a tutor-only grant", async () => {
    const rpc = vi.fn().mockResolvedValueOnce(active).mockResolvedValueOnce({ error: null });
    await adjustWallet(client(rpc), { id, addBonus: 20 });
    expect(rpc).toHaveBeenLastCalledWith("admin_tutor_update", {
      _user: id,
      _add_bonus: 20,
      _scholarship: null,
    });
  });
  it("never invokes tutor/scholarship mutation for an exam-only grant", async () => {
    const rpc = vi.fn().mockResolvedValueOnce(active).mockResolvedValueOnce({ error: null });
    await adjustWallet(client(rpc), { id, addExam: 5 });
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith("admin_exam_credit", { _user: id, _add: 5 });
  });
  it.each([
    { id, addBonus: -1 },
    { id, addExam: 1.5 },
    { id, addBonus: Infinity },
    { id, addBonus: 100001 },
    { id, addExam: 1, addBonus: 1 },
    { id },
  ])("rejects invalid/combined grants before contacting database: %j", async (data) => {
    const rpc = vi.fn();
    await expect(adjustWallet(client(rpc), data)).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([{ status: "active", is_admin: false }, { status: "suspended", is_admin: true }, null])(
    "fails closed on non-admin/suspended/malformed access %j",
    async (data) => {
      const rpc = vi.fn().mockResolvedValue({ data, error: null });
      await expect(assertActiveAdmin(client(rpc))).rejects.toThrow("Forbidden");
    },
  );
  it("does not ignore an access query failure", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "unavailable" } });
    await expect(assertActiveAdmin(client(rpc))).rejects.toThrow("verify admin");
  });
  it("uses the SQL-protected snapshot without opening a service-role client", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce({ data: [account], error: null });
    const load = vi.fn();
    expect(await loadAdminAccounts(client(rpc), load)).toEqual([account]);
    expect(load).not.toHaveBeenCalled();
  });
  it("never guesses account totals when a deployed snapshot fails or is malformed", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce({ data: null, error: { code: "42501", message: "forbidden" } });
    const load = vi.fn();
    await expect(loadAdminAccounts(client(rpc), load)).rejects.toThrow("forbidden");
    expect(load).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce(active).mockResolvedValueOnce({ data: [{ id }], error: null });
    await expect(loadAdminAccounts(client(rpc), load)).rejects.toThrow();
  });
  it("fails closed if protected-account verification is unavailable", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(assertNotMainAdmin(client(rpc), id)).rejects.toThrow("verify protected");
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(assertNotMainAdmin(client(rpc), id)).rejects.toThrow("main admin");
  });
});

function fallback(failWallet = false) {
  const profile = {
    id: account.id,
    email: account.email,
    full_name: account.full_name,
    avatar_url: account.avatar_url,
    status: account.status,
    suspended_until: account.suspended_until,
    created_at: account.created_at,
    last_seen_at: account.last_seen_at,
  };
  const ranges: Record<string, Array<[number, number]>> = {};
  const data: Record<string, unknown[]> = {
    profiles: [profile],
    user_roles: [],
    tutor_wallets: [],
    tutor_usage: [],
    exam_generations: Array.from({ length: 1001 }, () => ({ user_id: id })),
  };
  const from = vi.fn((table: string) => {
    const query = {
      select: vi.fn(),
      order: vi.fn(),
      in: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      range: vi.fn(async (start: number, end: number) => {
        (ranges[table] ??= []).push([start, end]);
        return table === "tutor_wallets" && failWallet
          ? { data: null, error: { message: "wallet read failed" } }
          : { data: data[table].slice(start, end + 1), error: null };
      }),
    };
    for (const method of [query.select, query.order, query.in, query.eq, query.gte, query.lt])
      method.mockReturnValue(query);
    return query;
  });
  const rpc = vi.fn(async (name: string) =>
    name === "my_access"
      ? active
      : name === "admin_account_summaries"
        ? { data: null, error: { code: "PGRST202", message: "missing migration" } }
        : { data: true, error: null },
  );
  const db = { rpc, from } as unknown as Parameters<typeof loadAdminAccounts>[0];
  return { db, ranges };
}
it("keeps an older backend usable with verified main-admin flags, zero missing-wallet balance, and all query pages", async () => {
  const { db, ranges } = fallback();
  const rows = await loadAdminAccounts(db, async () => db);
  expect(rows[0]).toMatchObject({
    tutor_bonus: 0,
    exam_bonus: 0,
    is_admin: true,
    is_main_admin: true,
    exam_used_today: 1001,
  });
  expect(ranges.exam_generations).toEqual([
    [0, 999],
    [1000, 1999],
  ]);
});
it("does not convert compatibility wallet-query failures into a zero/five balance", async () => {
  const { db } = fallback(true);
  await expect(loadAdminAccounts(db, async () => db)).rejects.toThrow("wallet read failed");
});
