import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import { accountSchema, walletUpdateSchema } from "./admin-account";

type Db = SupabaseClient<Database>;

export async function assertActiveAdmin(db: Db) {
  const { data, error } = await db.rpc("my_access");
  if (error) throw new Error("Could not verify admin access. Please try again.");
  const access = data as { status?: string; is_admin?: boolean } | null;
  if (access?.status !== "active" || access.is_admin !== true) throw new Error("Forbidden");
}
export async function assertNotMainAdmin(db: Db, id: string) {
  const { data, error } = await db.rpc("is_main_admin", { _user_id: id });
  if (error || typeof data !== "boolean")
    throw new Error("Could not verify protected account status.");
  if (data) throw new Error("The main admin account cannot be changed");
}
export async function adjustWallet(db: Db, raw: z.infer<typeof walletUpdateSchema>) {
  const data = walletUpdateSchema.parse(raw);
  await assertActiveAdmin(db);
  // Exam-only grants never touch the tutor/scholarship wallet operation.
  const { error } =
    data.addExam !== undefined
      ? await db.rpc("admin_exam_credit", { _user: data.id, _add: data.addExam })
      : await db.rpc("admin_tutor_update", {
          _user: data.id,
          _add_bonus: data.addBonus ?? 0,
          _scholarship: (data.scholarship ?? null) as string,
        });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Read all pages; never silently convert a failed/truncated query to a balance. */
async function readAll<T>(query: {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}): Promise<{ data: T[]; error: { message: string } | null }> {
  const data: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await query.range(offset, offset + 999);
    if (result.error) throw new Error(result.error.message);
    if (!Array.isArray(result.data)) throw new Error("Account data is unavailable.");
    data.push(...result.data);
    if (result.data.length < 1000) return { data, error: null };
  }
}

/** Migration-first snapshot, with a strict older-backend fallback during rollout. */
export async function loadAdminAccounts(db: Db, loadAdmin: () => Promise<Db>) {
  await assertActiveAdmin(db);
  const snapshot = await db.rpc("admin_account_summaries");
  if (!snapshot.error) return z.array(accountSchema).parse(snapshot.data);
  if (!["PGRST202", "42883"].includes(snapshot.error.code)) throw new Error(snapshot.error.message);
  // No guessed balances on query errors. This compatibility path uses existing RPCs only.
  const profiles = await readAll(
    db
      .from("profiles")
      .select("id,email,full_name,avatar_url,status,suspended_until,created_at,last_seen_at")
      .order("last_seen_at", { ascending: false }),
  );
  if (profiles.error) throw new Error(profiles.error.message);
  const rows = profiles.data ?? [];
  if (!rows.length) return [];
  const admin = await loadAdmin();
  const ids = rows.map((profile) => profile.id);
  const today = new Date(Date.now() + 6.5 * 3600000).toISOString().slice(0, 10);
  const since = new Date(new Date(`${today}T00:00:00Z`).getTime() - 6.5 * 3600000).toISOString();
  const until = new Date(new Date(since).getTime() + 86400000).toISOString();
  const [roles, wallets, usage, exams] = await Promise.all([
    readAll(admin.from("user_roles").select("user_id,role").in("user_id", ids)),
    readAll(
      admin
        .from("tutor_wallets")
        .select("user_id,bonus_left,exam_bonus_left,scholarship,scholarship_note")
        .in("user_id", ids),
    ),
    readAll(admin.from("tutor_usage").select("user_id,used").in("user_id", ids).eq("day", today)),
    readAll(
      admin
        .from("exam_generations")
        .select("user_id")
        .in("user_id", ids)
        .gte("created_at", since)
        .lt("created_at", until),
    ),
  ]);
  for (const result of [roles, wallets, usage, exams])
    if (result.error) throw new Error(result.error.message);
  const protectedIds = new Set<string>();
  // Bounded concurrency; query SQL for every loaded account instead of copying email rules.
  for (let offset = 0; offset < ids.length; offset += 10) {
    const flags = await Promise.all(
      ids.slice(offset, offset + 10).map(async (id) => {
        const result = await db.rpc("is_main_admin", { _user_id: id });
        if (result.error || typeof result.data !== "boolean")
          throw new Error("Could not verify protected account status.");
        return { id, protected: result.data };
      }),
    );
    flags.forEach((flag) => {
      if (flag.protected) protectedIds.add(flag.id);
    });
  }
  const walletMap = new Map((wallets.data ?? []).map((wallet) => [wallet.user_id, wallet]));
  const usageMap = new Map((usage.data ?? []).map((item) => [item.user_id, item.used]));
  const examMap = new Map<string, number>();
  for (const exam of exams.data ?? [])
    examMap.set(exam.user_id, (examMap.get(exam.user_id) ?? 0) + 1);
  return z.array(accountSchema).parse(
    rows.map((profile) => ({
      ...profile,
      tutor_bonus: walletMap.get(profile.id)?.bonus_left ?? 0,
      exam_bonus: walletMap.get(profile.id)?.exam_bonus_left ?? 0,
      tutor_used_today: usageMap.get(profile.id) ?? 0,
      exam_used_today: examMap.get(profile.id) ?? 0,
      scholarship: walletMap.get(profile.id)?.scholarship || "none",
      scholarship_note: walletMap.get(profile.id)?.scholarship_note ?? null,
      is_main_admin: protectedIds.has(profile.id),
      is_admin:
        protectedIds.has(profile.id) ||
        (roles.data ?? []).some((role) => role.user_id === profile.id && role.role === "admin"),
      is_teacher: (roles.data ?? []).some(
        (role) => role.user_id === profile.id && role.role === "teacher",
      ),
    })),
  );
}
