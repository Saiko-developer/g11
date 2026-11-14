import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { PGlite } = createRequire(resolve(process.argv[2]))("@electric-sql/pglite");
const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
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
    "0009_unit_teaching_and_homework",
    "0010_classroom_grammar_writing_methods",
  ])
    await db.exec(await readFile(`drizzle/migrations/${file}.sql`, "utf8"));
  await db.exec("GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role");
  await db.query("INSERT INTO auth.users VALUES($1),($2)", [alice, bob]);
  await db.query("INSERT INTO profiles(id) VALUES($1),($2)", [alice, bob]);
  const finish = async (skill, practised = true, user = alice) =>
    (
      await db.query(
        "SELECT save_unit_section($1,$2,$3,repeat('a',64),'{\"draft\":\"practice\"}',$4,true) AS r",
        [
          user,
          skill,
          skill === "reading"
            ? "teacher-v2"
            : skill === "grammar"
              ? "rule-first-v1"
              : skill === "writing"
                ? "point-first-v1"
                : "unit-teacher-v1",
          practised,
        ],
      )
    ).rows[0].r;
  const skills = ["reading", "vocabulary", "grammar", "listening", "speaking", "writing"];
  const counts = [64, 12, 16, 8, 12, 16];
  const save = async (skill, count) =>
    db.query("SELECT save_classroom_progress($1,$2,$3,0,0,$4,0,$5)", [
      alice,
      `g10-u1-${skill}`,
      skill === "reading"
        ? "teacher-v2"
        : skill === "grammar"
          ? "rule-first-v1"
          : skill === "writing"
            ? "point-first-v1"
            : "unit-teacher-v1",
      Array.from({ length: count }, (_, i) => i),
      count,
    ]);
  await db.exec("SET ROLE service_role");
  assert.equal((await finish("reading")).reason, "teacher_review_required");
  await db.query(
    "INSERT INTO classroom_publications(lesson_id,version,content_hash,reviewed_by) SELECT 'g10-u1-'||s,CASE s WHEN 'reading' THEN 'teacher-v2' WHEN 'grammar' THEN 'rule-first-v1' WHEN 'writing' THEN 'point-first-v1' ELSE 'unit-teacher-v1' END,repeat('a',64),$1 FROM unnest($2::text[]) s",
    [alice, skills],
  );
  assert.equal((await finish("reading")).reason, "section_incomplete");
  for (let i = 0; i < skills.length; i++) {
    await save(skills[i], counts[i]);
    if (skills[i] === "listening")
      assert.equal((await finish("listening", false)).reason, "practice_required");
    assert.equal((await finish(skills[i])).ok, true);
    const n = (
      await db.query("SELECT count(*)::int n FROM unit_homework WHERE user_id=$1", [alice])
    ).rows[0].n;
    assert.equal(n, i === 5 ? 1 : 0, "Homework must wait for all six sections");
  }
  assert.equal((await finish("writing")).ok, true);
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM unit_homework")).rows[0].n,
    1,
    "Idempotent assignment",
  );
  await db.exec("RESET ROLE");
  await db.query("UPDATE profiles SET status='banned' WHERE id=$1", [bob]);
  await db.exec("SET ROLE service_role");
  assert.equal((await finish("reading", true, bob)).reason, "forbidden");
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [bob]);
  await db.exec("SET ROLE authenticated");
  assert.equal((await db.query("SELECT * FROM unit_homework")).rows.length, 0);
  assert.equal((await db.query("SELECT * FROM unit_section_learning")).rows.length, 0);
  await assert.rejects(() => finish("reading"), /permission denied/);
  await assert.rejects(
    () =>
      db.query(
        "INSERT INTO unit_homework(user_id,grade,unit,course_version) VALUES($1,10,1,'g10-u1-course-v1')",
        [bob],
      ),
    /permission denied/,
  );
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [alice]);
  await db.exec("SET ROLE authenticated");
  assert.equal((await db.query("SELECT * FROM unit_homework")).rows.length, 1);
  assert.equal((await db.query("SELECT * FROM unit_section_learning")).rows.length, 6);
  await db.exec("RESET ROLE; SET ROLE anon");
  await assert.rejects(() => db.query("SELECT * FROM unit_homework"), /permission denied/);
  await db.exec("RESET ROLE; SET ROLE service_role");
  await db.query(
    "SELECT save_classroom_progress($1,'g11-u12-grammar','rule-first-v1',0,0,'{}',0,24)",
    [alice],
  );
  await assert.rejects(
    () =>
      db.query(
        "SELECT save_classroom_progress($1,'g11-u13-grammar','rule-first-v1',0,0,'{}',0,24)",
        [alice],
      ),
    /Invalid progress/,
  );
  console.log(
    "Unit course SQL checks passed: all six sections same day, full-progress gate, publication gate, practice gate, idempotent homework, RLS and server-only writes.",
  );
} finally {
  await db.close();
}
