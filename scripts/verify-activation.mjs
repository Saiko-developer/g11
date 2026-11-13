// Disposable PostgreSQL only: verifies the actual runner migration, never a hosted database.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { PGlite } = createRequire(resolve(process.argv[2]))("@electric-sql/pglite");
const db = new PGlite();
const uid = "00000000-0000-4000-8000-000000000001";
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE profiles(id uuid PRIMARY KEY,status text DEFAULT 'active',suspended_until timestamptz);
 CREATE TABLE tutor_wallets(user_id uuid PRIMARY KEY,bonus_left int DEFAULT 0,updated_at timestamptz DEFAULT now());
 CREATE TABLE tutor_usage(user_id uuid,day date,used int,PRIMARY KEY(user_id,day));
 CREATE FUNCTION mm_today() RETURNS date LANGUAGE sql STABLE AS $$SELECT (now() AT TIME ZONE 'Asia/Yangon')::date$$;
 CREATE FUNCTION is_active_ai_account() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND status='active')$$;
 CREATE FUNCTION tutor_quota() RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$DECLARE n int; BEGIN
 INSERT INTO tutor_wallets(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT COALESCE((SELECT used FROM tutor_usage WHERE user_id=auth.uid() AND day=mm_today()),0) INTO n;
 RETURN jsonb_build_object('daily_left',greatest(2-n,0),'unlimited',false); END$$;`);
  for (const file of [
    "0002_reading_classroom_progress",
    "0003_teacher_led_daily_plan",
    "0004_apply_daily_study_plan_storage",
    "0005_activate_classroom_narration",
  ])
    await db.exec(await readFile(`drizzle/migrations/${file}.sql`, "utf8"));
  await db.query("INSERT INTO auth.users VALUES($1)", [uid]);
  await db.query("INSERT INTO profiles(id) VALUES($1)", [uid]);
  await db.exec("SET ROLE service_role");
  const reserve = async (id) =>
    (await db.query("SELECT reserve_ai_credit($1,$2,'classroom') AS r", [uid, id])).rows[0].r;
  const id = "00000000-0000-4000-8000-000000000010";
  assert.equal((await reserve(id)).ok, true);
  assert.equal((await reserve(id)).reason, "duplicate");
  await db.query("SELECT settle_ai_credit($1,$2,false)", [uid, id]);
  await db.query("SELECT settle_ai_credit($1,$2,false)", [uid, id]);
  assert.equal(
    (await db.query("SELECT count(*)::int AS n FROM ai_credit_ledger WHERE event='refund'")).rows[0]
      .n,
    1,
  );
  const claim = await db.query(
    "SELECT claim_classroom_audio(repeat('a',64),'g10-u1-reading','pilot-v1','clips/a.wav') AS r",
  );
  assert.equal(claim.rows[0].r, true);
  const repeat = await db.query(
    "SELECT claim_classroom_audio(repeat('a',64),'g10-u1-reading','pilot-v1','clips/a.wav') AS r",
  );
  assert.equal(repeat.rows[0].r, false);
  assert.equal(
    (await db.query("SELECT live_enabled FROM classroom_live_settings")).rows[0].live_enabled,
    false,
  );
  await db.exec("RESET ROLE; SET ROLE authenticated");
  for (const sql of [
    "SELECT * FROM classroom_audio",
    "SELECT * FROM classroom_live_settings",
    "SELECT claim_classroom_audio(repeat('b',64),'g10-u1-reading','pilot-v1','b.wav')",
    "SELECT reserve_ai_credit('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','classroom')",
  ])
    await assert.rejects(db.query(sql), /permission denied/);
  console.log(
    "PASS: runner migrations 0002–0005, credits/replay/single refund, private audio claims and live settings denied to students.",
  );
} finally {
  await db.close();
}
