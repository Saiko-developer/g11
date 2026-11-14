import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { PGlite } = createRequire(resolve(process.argv[2]))("@electric-sql/pglite");
const db = new PGlite();
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
  await db.exec(
    "INSERT INTO classroom_audio(hash,lesson_id,version,storage_path,created_at) VALUES(repeat('c',64),'g10-u1-grammar','rule-first-v1','clips/c.wav',now()-interval '1 day')",
  );
  await db.exec(
    await readFile("drizzle/migrations/0011_recover_classroom_audio_leases.sql", "utf8"),
  );
  const tokens = [1, 2, 3, 4].map((i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
  const claim = async (hash, token) =>
    (
      await db.query(
        "SELECT claim_classroom_audio_lease($1,'g10-u1-grammar','rule-first-v1',$2,$3) r",
        [hash.repeat(64), `clips/${hash}.wav`, token],
      )
    ).rows[0].r;
  await db.exec("SET ROLE service_role");
  assert.equal(await claim("a", tokens[0]), true);
  assert.equal(await claim("a", tokens[1]), false, "Do not steal a live generation");
  assert.equal(
    await claim("c", tokens[1]),
    true,
    "Old abandoned clip must be recoverable immediately",
  );
  await db.exec(
    "UPDATE classroom_audio SET lease_until=now()-interval '1 second' WHERE hash=repeat('a',64)",
  );
  assert.equal(await claim("a", tokens[1]), true);
  const old = await db.query(
    "UPDATE classroom_audio SET state='ready' WHERE hash=repeat('a',64) AND generation_token=$1 AND state='preparing' RETURNING hash",
    [tokens[0]],
  );
  assert.equal(old.rows.length, 0, "Old worker cannot overwrite recovery owner");
  const ready = await db.query(
    "UPDATE classroom_audio SET state='ready',lease_until=NULL WHERE hash=repeat('a',64) AND generation_token=$1 AND state='preparing' RETURNING hash",
    [tokens[1]],
  );
  assert.equal(ready.rows.length, 1);
  assert.equal(await claim("a", tokens[2]), false, "Never regenerate ready audio");
  assert.equal(await claim("b", tokens[0]), true);
  for (let i = 1; i < 3; i++) {
    await db.exec(
      "UPDATE classroom_audio SET lease_until=now()-interval '1 second' WHERE hash=repeat('b',64)",
    );
    assert.equal(await claim("b", tokens[i]), true);
  }
  await db.exec(
    "UPDATE classroom_audio SET lease_until=now()-interval '1 second' WHERE hash=repeat('b',64)",
  );
  assert.equal(
    await claim("b", tokens[3]),
    false,
    "Crash recovery must not create an infinite paid retry loop",
  );
  await db.exec("RESET ROLE; SET ROLE authenticated");
  await assert.rejects(() => claim("d", tokens[0]), /permission denied/);
  await db.exec("RESET ROLE; SET ROLE anon");
  await assert.rejects(() => claim("d", tokens[0]), /permission denied/);
  console.log(
    "Audio lease SQL checks passed: one live owner, abandoned-clip recovery, old-worker fencing, ready-cache reuse, bounded crash recovery and server-only execution.",
  );
} finally {
  await db.close();
}
