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
    "0008_remove_narration_daily_cap",
  ])
    await db.exec(await readFile(`drizzle/migrations/${file}.sql`, "utf8"));
  await db.query("INSERT INTO auth.users VALUES($1)", [uid]);
  await db.query("INSERT INTO profiles(id) VALUES($1)", [uid]);
  await db.exec("SET ROLE service_role");
  // Revised narration must never inherit the old clip's offset or completion.
  await db.query("INSERT INTO study_enrollments(user_id,grade) VALUES($1,10)", [uid]);
  const oldSteps = Array.from({ length: 16 }, (_, i) => i);
  await db.query("SELECT save_classroom_progress($1,'g10-u1-reading','pilot-v1',15,8,$2,0,64)", [
    uid,
    oldSteps,
  ]);
  await db.query("SELECT save_classroom_progress($1,'g10-u1-reading','teacher-v2',0,0,'{}',0,64)", [
    uid,
  ]);
  const histories = (
    await db.query(
      "SELECT version,audio_offset,completed FROM classroom_progress WHERE user_id=$1 ORDER BY version",
      [uid],
    )
  ).rows;
  assert.equal(histories.length, 2);
  assert.equal(histories[0].version, "pilot-v1");
  assert.equal(histories[0].audio_offset, 8);
  assert.equal(histories[0].completed.length, 16);
  assert.equal(histories[1].version, "teacher-v2");
  assert.equal(histories[1].audio_offset, 0);
  assert.equal(histories[1].completed.length, 0);
  const revisedFinish = async () =>
    (
      await db.query(
        "SELECT finish_daily_class($1,10,'reading-myanmar-teacher-v2',0,'g10-u1-reading','teacher-v2',0,16) AS r",
        [uid],
      )
    ).rows[0].r;
  assert.equal((await revisedFinish()).reason, "class_incomplete");
  await db.query("SELECT save_classroom_progress($1,'g10-u1-reading','teacher-v2',15,0,$2,1,64)", [
    uid,
    oldSteps,
  ]);
  assert.equal((await revisedFinish()).ok, true);
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
  // A full Reading passage can be prepared on one day; duplicate claims still lose.
  for (let i = 0; i < 64; i++) {
    const hash = String(i).padStart(64, "0");
    const result = await db.query(
      "SELECT claim_classroom_audio($1,'g10-u1-reading','teacher-v2',$2) AS r",
      [hash, `clips/${hash}.wav`],
    );
    assert.equal(result.rows[0].r, true);
  }
  const sharedHash = "f".repeat(64);
  const duplicates = await Promise.all(
    Array.from({ length: 8 }, () =>
      db.query(
        "SELECT claim_classroom_audio($1,'g10-u1-reading','teacher-v2','clips/shared.wav') AS r",
        [sharedHash],
      ),
    ),
  );
  assert.equal(duplicates.filter((result) => result.rows[0].r).length, 1);
  await db.exec("RESET ROLE; SET ROLE authenticated");
  for (const sql of [
    "SELECT * FROM classroom_audio",
    "SELECT * FROM classroom_live_settings",
    "SELECT claim_classroom_audio(repeat('b',64),'g10-u1-reading','pilot-v1','b.wav')",
    "SELECT reserve_ai_credit('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','classroom')",
  ])
    await assert.rejects(db.query(sql), /permission denied/);
  console.log(
    "PASS: runner migrations 0002–0005 + 0008, no daily narration cap, version-isolated progress/completion, credits/replay/single refund, private audio claims and live settings denied to students.",
  );
} finally {
  await db.close();
}
