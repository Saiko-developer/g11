import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localTestDb } from "./lib/local-test-db.mjs";
const db = await localTestDb(process.argv[2]);
try {
  const a = randomUUID(),
    b = randomUUID();
  await db.query("INSERT INTO auth.users(id,email) VALUES($1,$2),($3,$4)", [
    a,
    "g11-a@example.test",
    b,
    "g11-b@example.test",
  ]);
  const asUser = async (id) => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("SET ROLE authenticated");
  };
  const rpc = async (sql, args = []) => (await db.query(sql, args)).rows[0].result;
  const status = (unit) => rpc("SELECT grade11_speaking_status($1) AS result", [unit]);
  const prepare = async (
    unit,
    {
      session = null,
      op = "open",
      revision = null,
      key = randomUUID(),
      claim = randomUUID(),
      exercise = null,
    } = {},
  ) => ({
    key,
    claim,
    result: await rpc("SELECT grade11_speaking_prepare($1,$2,$3,$4,$5,$6,$7) AS result", [
      unit,
      exercise,
      session,
      key,
      claim,
      op,
      revision,
    ]),
  });
  const complete = (
    p,
    success = true,
    payload = { reply: "Hello", replyMy: "မင်္ဂလာပါ" },
    history = [],
  ) =>
    rpc("SELECT grade11_speaking_complete($1,$2,$3,$4,$5) AS result", [
      p.key,
      p.claim,
      success,
      payload,
      history,
    ]);
  const end = (session) => rpc("SELECT grade11_speaking_end($1) AS result", [session]);
  await asUser(a);
  let p = await prepare(1);
  assert.equal(p.result.fresh, true);
  assert.equal((await status(1)).used, 0);
  assert.equal((await prepare(2)).result.reason, "busy");
  assert.equal((await complete({ ...p, claim: randomUUID() }, false)).reason, "stale");
  assert.equal((await prepare(2)).result.reason, "busy");
  assert.equal((await complete(p, false)).reason, "retry");
  assert.equal((await status(1)).used, 0);
  p = await prepare(1);
  const opened = await complete(p);
  assert.equal(opened.revision, 1);
  assert.equal(Date.parse(opened.expiresAt) - Date.parse(opened.serverNow), 300000);
  assert.equal((await status(1)).used, 1);
  assert.deepEqual((await status(1)).unitsUsed, [1]);
  const replay = await prepare(1, { key: p.key });
  assert.equal(replay.result.cached, true);
  assert.equal(replay.result.expiresAt, opened.expiresAt);
  const resume = await prepare(1);
  assert.equal(resume.result.resumed, true);
  assert.equal(resume.result.session, opened.session);
  assert.equal((await prepare(2)).result.reason, "active_session");
  assert.equal(
    (await prepare(1, { session: opened.session, op: "turn", revision: 0 })).result.reason,
    "stale",
  );
  const turn = await prepare(1, { session: opened.session, op: "turn", revision: 1 });
  assert.equal(turn.result.fresh, true);
  assert.equal(
    (await prepare(1, { session: opened.session, op: "turn", revision: 1 })).result.reason,
    "busy",
  );
  const updated = await complete(turn);
  assert.equal(updated.revision, 2);
  assert.equal(updated.expiresAt, opened.expiresAt);
  await assert.rejects(db.query("SELECT * FROM grade11_speaking_requests"));
  await asUser(b);
  assert.equal(
    (await rpc("SELECT grade11_speaking_validate($1,1) AS result", [opened.session])).reason,
    "expired",
  );
  assert.equal((await complete(turn)).reason, "stale");
  assert.equal((await status(1)).used, 0);
  await asUser(a);
  assert.equal(
    (await rpc("SELECT grade11_speaking_validate($1,1) AS result", [opened.session])).ok,
    true,
  );
  await end(opened.session);
  const feedback = await prepare(1, { session: opened.session, op: "finish" });
  assert.equal(feedback.result.fresh, true);
  await complete(feedback, true, { feedbackMy: "Well done" });
  assert.equal((await prepare(1, { session: opened.session, op: "finish" })).result.cached, true);
  p = await prepare(1);
  await complete(p);
  await end(p.result.session);
  assert.equal((await prepare(1)).result.reason, "unit_limit");
  p = await prepare(2);
  const second = await complete(p);
  await db.exec("RESET ROLE");
  await db.query(
    "UPDATE grade11_speaking_sessions SET expires_at=now()-interval '1 second' WHERE id=$1",
    [second.session],
  );
  await asUser(a);
  assert.equal(
    (await rpc("SELECT grade11_speaking_validate($1,2) AS result", [second.session])).reason,
    "expired",
  );
  assert.equal(
    (await prepare(2, { session: second.session, op: "turn", revision: 1 })).result.reason,
    "expired",
  );
  p = await prepare(2);
  await complete(p);
  await end(p.result.session);
  assert.equal((await status(1)).sessionsUsed, 4);
  assert.deepEqual((await status(1)).unitsUsed, [1, 2]);
  assert.equal((await prepare(3)).result.reason, "daily_unit_limit");
  assert.equal((await rpc("SELECT speaking_unit_status(1) AS result")).limit, 5);
  assert.equal((await rpc("SELECT speaking_unit_status(1) AS result")).used, 0);
  await db.exec("RESET ROLE");
  await db.query(
    "UPDATE grade11_speaking_sessions SET practice_day=public.mm_today()-1 WHERE user_id=$1",
    [a],
  );
  await asUser(a);
  assert.equal((await status(3)).sessionsUsed, 0);
  assert.equal((await prepare(3)).result.fresh, true);
  await db.exec("RESET ROLE");
  await db.query(
    "UPDATE grade11_speaking_requests SET lease_until=now()-interval '1 second' WHERE user_id=$1 AND state='pending'",
    [a],
  );
  await asUser(a);
  assert.equal((await prepare(4)).result.fresh, true);
  for (const signature of [
    "public.grade11_speaking_status(integer)",
    "public.grade11_speaking_prepare(integer,text,uuid,uuid,uuid,text,integer)",
    "public.grade11_speaking_complete(uuid,uuid,boolean,jsonb,jsonb)",
    "public.grade11_speaking_validate(uuid,integer)",
  ]) {
    await db.exec("RESET ROLE");
    assert.equal(
      (await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') AS allowed", [signature]))
        .rows[0].allowed,
      false,
    );
  }
  console.log(
    "PASS: Grade 11 failed-start release, 2x2x5 caps, overlapping reservations, private claims, cached retry/resume, fixed deadline, revision protection, ownership, expiry, one-time feedback, Myanmar-day reset, lease recovery and Grade 10 isolation.",
  );
} finally {
  await db.close();
}
