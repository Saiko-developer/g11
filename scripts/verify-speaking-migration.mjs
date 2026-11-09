// Disposable local PostgreSQL via PGlite; never connects to a hosted database.
// Install @electric-sql/pglite in a temporary directory, then pass its package.json.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve(process.argv[2] || "package.json"));
const { PGlite } = require("@electric-sql/pglite");
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
    CREATE TABLE storage.objects (id uuid PRIMARY KEY, name text, bucket_id text);
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
      $$ SELECT (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'),1)-1] $$;
  `);
  await db.exec(await readFile("drizzle/migrations/0000_initial_app_schema.sql", "utf8"));
  await db.exec(await readFile("drizzle/migrations/0001_support_and_announcements.sql", "utf8"));
  const migration = await readFile("drizzle/migrations/0002_restore_speaking_practice.sql", "utf8");
  await db.exec(migration);
  const alice = "00000000-0000-4000-8000-000000000001";
  const bob = "00000000-0000-4000-8000-000000000002";
  await db.query(
    `INSERT INTO auth.users(id,email) VALUES ($1,'alice@example.test'),($2,'bob@example.test')`,
    [alice, bob],
  );
  const asUser = async (id) => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("SET ROLE authenticated");
  };
  const rpc = async (sql, args = []) => (await db.query(sql, args)).rows[0].result;
  await asUser(alice);
  assert.equal((await rpc("SELECT speaking_unit_status(1) AS result")).used, 0);
  let sid;
  for (let i = 0; i < 5; i++) {
    const result = await rpc("SELECT start_speaking_session(1) AS result");
    assert.equal(result.ok, true);
    sid = result.session;
  }
  assert.deepEqual(await rpc("SELECT start_speaking_session(1) AS result"), {
    ok: false,
    reason: "unit_limit",
  });
  assert.equal((await rpc("SELECT start_speaking_session(2) AS result")).ok, true);
  for (let i = 0; i < 20; i++)
    assert.equal((await rpc("SELECT speaking_turn($1) AS result", [sid])).ok, true);
  assert.deepEqual(await rpc("SELECT speaking_turn($1) AS result", [sid]), {
    ok: false,
    reason: "limit",
  });
  await asUser(bob);
  assert.deepEqual(await rpc("SELECT speaking_turn($1) AS result", [sid]), {
    ok: false,
    reason: "no_session",
  });
  assert.equal((await db.query("SELECT * FROM speaking_sessions")).rows.length, 0);
  assert.equal((await rpc("SELECT speaking_unit_status(1) AS result")).used, 0);
  await db.exec("RESET ROLE");
  await db.query("UPDATE speaking_sessions SET expires_at=now()-interval '1 minute' WHERE id=$1", [
    sid,
  ]);
  await asUser(alice);
  assert.deepEqual(await rpc("SELECT speaking_turn($1) AS result", [sid]), {
    ok: false,
    reason: "expired",
  });
  await db.exec("RESET ROLE");
  await db.query("INSERT INTO user_roles(user_id,role) VALUES ($1,'teacher')", [alice]);
  await asUser(alice);
  assert.equal((await rpc("SELECT speaking_unit_status(1) AS result")).unlimited, true);
  assert.equal((await rpc("SELECT start_speaking_session(1) AS result")).ok, true);
  await db.exec("RESET ROLE");
  const before = (await db.query("SELECT count(*)::int AS n FROM speaking_sessions")).rows[0].n;
  await db.exec(migration); // reapplication must preserve sessions
  assert.equal(
    (await db.query("SELECT count(*)::int AS n FROM speaking_sessions")).rows[0].n,
    before,
  );
  const privileges = (
    await db.query(`SELECT
    has_function_privilege('anon','public.start_speaking_session(integer)','EXECUTE') AS anon_start,
    has_function_privilege('authenticated','public.start_speaking_session(integer)','EXECUTE') AS student_start,
    has_table_privilege('authenticated','public.speaking_sessions','INSERT') AS direct_insert,
    has_table_privilege('authenticated','public.speaking_sessions','UPDATE') AS direct_update`)
  ).rows[0];
  assert.deepEqual(privileges, {
    anon_start: false,
    student_start: true,
    direct_insert: false,
    direct_update: false,
  });
  console.log(
    "PASS: full remix baseline + restored migration; five-session limit, separate units/users, 20-turn limit, expiry, teacher access, RLS, privileges, safe reapplication.",
  );
} finally {
  await db.close();
}
