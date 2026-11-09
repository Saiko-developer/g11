import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localTestDb } from "./lib/local-test-db.mjs";
const db = await localTestDb(process.argv[2]);
try {
  const owner = "00000000-0000-4000-8000-000000000081",
    learner = "00000000-0000-4000-8000-000000000082",
    other = "00000000-0000-4000-8000-000000000083";
  // Find the committed SQL owner address rather than duplicating the production rule.
  const baseline = await readFile("drizzle/migrations/0000_initial_app_schema.sql", "utf8");
  const email = /lower\(email\) IN \('([^']+)'/.exec(baseline)[1];
  await db.query("INSERT INTO auth.users(id,email) VALUES ($1,$2),($3,$4),($5,$6)", [
    owner,
    email,
    learner,
    "learner@example.test",
    other,
    "other@example.test",
  ]);
  const asUser = async (id) => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("SET ROLE authenticated");
  };
  const rpc = async (sql, args = []) => (await db.query(sql, args)).rows[0].result;
  await db.query("UPDATE tutor_wallets SET scholarship='approved' WHERE user_id=$1", [learner]);
  await asUser(other);
  await assert.rejects(db.query("SELECT admin_account_summaries()"));
  await asUser(owner);
  assert.equal(
    (await db.query("UPDATE profiles SET status='suspended' WHERE id=$1 RETURNING id", [owner]))
      .rows.length,
    0,
  );
  await db.query("SELECT admin_tutor_update($1,10,NULL)", [learner]);
  await db.query("SELECT admin_tutor_update($1,5,'')", [learner]);
  await db.query("SELECT admin_exam_credit($1,3)", [learner]);
  let account = (await rpc("SELECT admin_account_summaries() AS result")).find(
    (row) => row.id === learner,
  );
  assert.equal(account.scholarship, "approved");
  assert.equal(account.tutor_bonus, 15);
  assert.equal(account.exam_bonus, 3);
  await assert.rejects(db.query("SELECT admin_tutor_update($1,1,'unlimited')", [learner]));
  await assert.rejects(db.query("SELECT admin_exam_credit($1,-1)", [learner]));
  await db.exec("RESET ROLE");
  await db.query("UPDATE profiles SET status='suspended', suspended_until=NULL WHERE id=$1", [
    learner,
  ]);
  await asUser(learner);
  assert.deepEqual(await rpc("SELECT consume_tutor_message() AS result"), {
    ok: false,
    reason: "suspended",
  });
  assert.deepEqual(await rpc("SELECT start_speaking_session(1) AS result"), {
    ok: false,
    reason: "suspended",
  });
  assert.deepEqual(
    await rpc("SELECT speaking_turn($1) AS result", ["00000000-0000-4000-8000-000000000099"]),
    { ok: false, reason: "suspended" },
  );
  await assert.rejects(db.query("SELECT admin_account_summaries()"));
  await assert.rejects(db.query("SELECT admin_exam_credit($1,5)", [learner]));
  await db.exec("RESET ROLE");
  assert.equal(
    (await db.query("SELECT * FROM tutor_usage WHERE user_id=$1", [learner])).rows.length,
    0,
  );
  assert.equal(
    (await db.query("SELECT * FROM speaking_sessions WHERE user_id=$1", [learner])).rows.length,
    0,
  );
  await db.query("UPDATE profiles SET suspended_until=now()-interval '1 minute' WHERE id=$1", [
    learner,
  ]);
  await asUser(learner);
  assert.equal((await rpc("SELECT consume_tutor_message() AS result")).ok, true);
  assert.equal((await rpc("SELECT start_speaking_session(1) AS result")).ok, true);
  await db.exec("RESET ROLE");
  // An owner still has SQL admin rights even when the separate role row is absent.
  await db.query("DELETE FROM user_roles WHERE user_id=$1 AND role='admin'", [owner]);
  await db.query("DELETE FROM tutor_wallets WHERE user_id=$1", [other]);
  await db.query(
    "INSERT INTO exam_generations(user_id,unit,paper,created_at) VALUES ($1,1,$2,(public.mm_today()::timestamp AT TIME ZONE 'Asia/Yangon')-interval '1 second'),($1,1,$2,(public.mm_today()::timestamp AT TIME ZONE 'Asia/Yangon')+interval '1 second')",
    [other, {}],
  );
  await asUser(owner);
  const snapshot = await rpc("SELECT admin_account_summaries() AS result");
  const ownerRow = snapshot.find((row) => row.id === owner);
  assert.equal(ownerRow.is_admin, true);
  assert.equal(ownerRow.is_main_admin, true);
  const missing = snapshot.find((row) => row.id === other);
  assert.equal(missing.tutor_bonus, 0);
  assert.equal(missing.exam_used_today, 1);
  await db.exec("RESET ROLE");
  await db.query("UPDATE profiles SET status='suspended' WHERE id=$1", [owner]);
  await asUser(owner);
  await assert.rejects(db.query("SELECT admin_account_summaries()"));
  await assert.rejects(db.query("SELECT admin_tutor_update($1,1,NULL)", [learner]));
  await db.exec("RESET ROLE");
  await db.exec(await readFile("drizzle/migrations/0004_admin_account_integrity.sql", "utf8"));
  assert.equal(
    (await db.query("SELECT scholarship FROM tutor_wallets WHERE user_id=$1", [learner])).rows[0]
      .scholarship,
    "approved",
  );
  for (const signature of [
    "public.admin_account_summaries()",
    "public.admin_tutor_update(uuid,integer,text)",
    "public.admin_exam_credit(uuid,integer)",
    "public.consume_tutor_message()",
    "public.is_active_ai_account()",
  ]) {
    assert.equal(
      (await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') AS allowed", [signature]))
        .rows[0].allowed,
      false,
    );
  }
  console.log(
    "PASS: scholarship preservation, independent exam grant, suspended-user RPC denial without quota/session consumption, expiry recovery, canonical owner privileges, zero missing-wallet balances, Myanmar-day counts, suspended-admin denial, restricted grants and repeat-safe migration.",
  );
} finally {
  await db.close();
}
