// Disposable local Postgres only. No hosted DB credentials or database operations.
// npm install --prefix /tmp/saya-sql --no-package-lock @electric-sql/pglite@0.3.14
// node scripts/verify-step2.mjs /tmp/saya-sql/package.json
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve(process.argv[2]));
const { PGlite } = require("@electric-sql/pglite");
const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const ids = Array.from(
  { length: 20 },
  (_, i) => `00000000-0000-4000-8000-${String(i + 10).padStart(12, "0")}`,
);
const result = async (sql, args = []) => (await db.query(sql, args)).rows[0].result;
const asUser = async (id) => {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("SET ROLE authenticated");
};
try {
  await db.exec(`
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE public.profiles(id uuid PRIMARY KEY,status text DEFAULT 'active',suspended_until timestamptz);
 CREATE TABLE public.tutor_wallets(user_id uuid PRIMARY KEY,bonus_left int DEFAULT 0,updated_at timestamptz DEFAULT now());
 CREATE TABLE public.tutor_usage(user_id uuid,day date,used int DEFAULT 0,PRIMARY KEY(user_id,day));
 CREATE TABLE public.payment_settings(id int PRIMARY KEY,packages jsonb,exam_packages jsonb);
 CREATE TABLE public.topup_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,kind text,method text,credits int,price int,txn_ref text,status text DEFAULT 'pending',reviewed_by uuid,reviewed_at timestamptz);
 CREATE FUNCTION public.mm_today() RETURNS date LANGUAGE sql STABLE AS $$ SELECT (now() AT TIME ZONE 'Asia/Yangon')::date $$;
 CREATE FUNCTION public.is_active_ai_account() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND status='active') $$;
 CREATE FUNCTION public.tutor_quota() RETURNS jsonb LANGUAGE plpgsql AS $$
 DECLARE n int; b int; BEGIN
 SELECT COALESCE((SELECT used FROM public.tutor_usage WHERE user_id=auth.uid() AND day=public.mm_today()),0) INTO n;
 INSERT INTO public.tutor_wallets(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT bonus_left INTO b FROM public.tutor_wallets WHERE user_id=auth.uid();
 RETURN jsonb_build_object('daily_left',greatest(2-n,0),'bonus_left',b,'unlimited',false); END $$;
 `);
  await db.exec(await readFile("docs/step2/schema.sql", "utf8"));
  await db.query("INSERT INTO auth.users VALUES($1),($2)", [alice, bob]);
  await db.query("INSERT INTO public.profiles(id) VALUES($1),($2)", [alice, bob]);
  await db.exec("GRANT SELECT ON public.tutor_wallets TO service_role; SET ROLE service_role");
  const reserve = (i, user = alice) =>
    result("SELECT public.reserve_ai_credit($1,$2,'classroom') AS result", [user, ids[i]]);
  const settle = (i, ok, user = alice) =>
    db.query("SELECT public.settle_ai_credit($1,$2,$3)", [user, ids[i], ok]);
  assert.equal((await reserve(0)).ok, true);
  assert.equal((await reserve(0)).reason, "duplicate");
  assert.equal((await reserve(1)).ok, true);
  assert.equal((await reserve(2)).reason, "rate_limit"); // Two concurrent in-flight requests.
  await settle(0, true);
  await settle(1, true);
  assert.equal((await reserve(2)).reason, "limit"); // Exactly two free requests.
  await db.exec("RESET ROLE");
  await db.query("UPDATE tutor_wallets SET bonus_left=1 WHERE user_id=$1", [alice]);
  await db.exec("SET ROLE service_role");
  assert.equal((await reserve(2)).ok, true);
  await settle(2, false);
  await settle(2, false);
  assert.equal(
    await result("SELECT bonus_left AS result FROM public.tutor_wallets WHERE user_id=$1", [alice]),
    1,
  );
  assert.equal(
    await result(
      "SELECT count(*)::int AS result FROM ai_credit_ledger WHERE user_id=$1 AND event='refund'",
      [alice],
    ),
    1,
  );
  await reserve(3);
  await settle(3, true);
  assert.equal((await reserve(4)).reason, "limit");
  await asUser(alice);
  assert.equal(await result("SELECT count(*)::int AS result FROM public.ai_credit_requests"), 4);
  await asUser(bob);
  assert.equal(await result("SELECT count(*)::int AS result FROM public.ai_credit_requests"), 0);
  for (const sql of [
    "SELECT public.reserve_ai_credit($1,$2,'tutor')",
    "SELECT public.settle_ai_credit($1,$2,false)",
  ]) {
    await assert.rejects(db.query(sql, [alice, ids[0]]), /permission denied/);
  }
  await db.exec("RESET ROLE; SET ROLE service_role");
  const save = (rev, completed = [0]) =>
    result(
      "SELECT public.save_classroom_progress($1,'g10-u1-reading','pilot-v1',1,2.5,$2,$3,64) AS result",
      [alice, completed, rev],
    );
  assert.equal((await save(0)).revision, 1);
  assert.equal((await save(0)).reason, "stale");
  assert.deepEqual((await save(1, [1])).completed, [0, 1]);
  await assert.rejects(save(2, [64]), /Invalid progress/);
  await asUser(bob);
  assert.equal(await result("SELECT count(*)::int AS result FROM classroom_progress"), 0);
  await assert.rejects(
    db.query(
      "INSERT INTO classroom_progress(user_id,lesson_id,version) VALUES($1,'g10-u1-reading','pilot-v1')",
      [bob],
    ),
    /permission denied/,
  );
  await db.exec("RESET ROLE");
  await db.exec(
    `INSERT INTO payment_settings VALUES(1,'[{"credits":50,"price":1000}]','[]'); GRANT INSERT ON topup_requests TO authenticated;`,
  );
  await asUser(alice);
  await assert.rejects(
    db.query(
      "INSERT INTO topup_requests(user_id,kind,method,credits,price,txn_ref) VALUES($1,'tutor','kpay',999,1,'TXN123456')",
      [alice],
    ),
    /Package changed/,
  );
  await db.query(
    "INSERT INTO topup_requests(user_id,kind,method,credits,price,txn_ref) VALUES($1,'tutor','wavepay',50,1000,'TXN123456')",
    [alice],
  );
  await asUser(bob);
  await assert.rejects(
    db.query(
      "INSERT INTO topup_requests(user_id,kind,method,credits,price,txn_ref) VALUES($1,'tutor','wavepay',50,1000,'TXN123456')",
      [bob],
    ),
    /already submitted/,
  );
  await db.exec("RESET ROLE; SET ROLE service_role");
  assert.equal(
    await result(
      "SELECT claim_classroom_audio(repeat('a',64),'g10-u1-reading','pilot-v1','clips/a.wav') AS result",
    ),
    true,
  );
  assert.equal(
    await result(
      "SELECT claim_classroom_audio(repeat('a',64),'g10-u1-reading','pilot-v1','clips/a.wav') AS result",
    ),
    false,
  );
  await db.exec("RESET ROLE");
  await db.query("UPDATE profiles SET status='suspended' WHERE id=$1", [bob]);
  await db.exec("SET ROLE service_role");
  assert.equal((await reserve(5, bob)).reason, "suspended");
  console.log(
    "PASS: schema, quotas, replay, refund, in-flight cap, RLS, stale progress, invalid steps, package tampering, duplicate payments, audio claims, suspension.",
  );
} finally {
  await db.close();
}
