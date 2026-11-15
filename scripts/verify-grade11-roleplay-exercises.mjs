// Disposable PostgreSQL fixture for the existing Grade 11 session functions; no hosted writes.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const { PGlite } = createRequire(resolve(process.argv[2]))("@electric-sql/pglite");
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    GRANT USAGE ON SCHEMA auth TO authenticated,anon;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY,status text DEFAULT 'active');
    CREATE FUNCTION public.is_active_ai_account() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND status='active')$$;
    CREATE FUNCTION public.mm_today() RETURNS date LANGUAGE sql STABLE AS $$SELECT (now() AT TIME ZONE 'Asia/Yangon')::date$$;`);
  const original = await readFile("drizzle/migrations/0000_grade11_speaking_allowance.sql", "utf8");
  await db.exec(
    original.slice(
      original.indexOf("CREATE TABLE public.grade11_speaking_sessions"),
      original.indexOf("CREATE OR REPLACE FUNCTION public.admin_account_summaries"),
    ),
  );
  await db.exec(await readFile("drizzle/migrations/0013_grade11_unit2_unit3_roleplay.sql", "utf8"));
  const alice = randomUUID(),
    bob = randomUUID();
  await db.query("INSERT INTO profiles(id) VALUES($1),($2)", [alice, bob]);
  const asUser = async (user) => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.exec("SET ROLE authenticated");
  };
  const prepare = async (unit, exercise, session = null, revision = null) =>
    (
      await db.query("SELECT grade11_speaking_prepare($1,$2,$3,$4,$5,$6,$7) AS r", [
        unit,
        exercise,
        session,
        randomUUID(),
        randomUUID(),
        session ? "turn" : "open",
        revision,
      ])
    ).rows[0].r;
  await asUser(alice);
  assert.equal((await prepare(2, "3D-33")).reason, "invalid");
  assert.equal((await prepare(3, "3D-99")).reason, "invalid");
  for (const [unit, exercise] of [
    [1, "1D-30"],
    [1, "1D-31"],
    [2, "2D-18"],
    [3, "3D-33"],
    [5, "5D-14"],
    [5, "5D-21"],
  ]) {
    const opened = await prepare(unit, exercise);
    assert.equal(opened.ok, true, exercise);
    assert.equal(opened.exercise, exercise);
    // Another account cannot continue the reserved session.
    await asUser(bob);
    assert.equal((await prepare(unit, exercise, opened.session, 0)).reason, "no_session");
    await db.exec("RESET ROLE");
    await db.query("UPDATE grade11_speaking_requests SET state='failed' WHERE session_id=$1", [
      opened.session,
    ]);
    await db.query("UPDATE grade11_speaking_sessions SET state='failed' WHERE id=$1", [
      opened.session,
    ]);
    await asUser(alice);
  }
  await db.exec("RESET ROLE");
  assert.equal(
    (
      await db.query(
        "SELECT has_function_privilege('anon','public.grade11_speaking_prepare(integer,text,uuid,uuid,uuid,text,integer)','EXECUTE') AS allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await asUser(bob);
  await assert.rejects(
    () => db.query("SELECT * FROM grade11_speaking_requests"),
    /permission denied/,
  );
  console.log(
    "Grade 11 roleplay migration passed: all six canonical exercise IDs, unit mismatch/unknown rejection, caller-owned sessions, private claims and anonymous execution denied.",
  );
} finally {
  await db.close();
}
