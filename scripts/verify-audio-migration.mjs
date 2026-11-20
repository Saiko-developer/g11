import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(resolve(process.argv[2] || "package.json"));
const { PGlite } = require("@electric-sql/pglite");
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA storage;CREATE FUNCTION public.mm_today() RETURNS date LANGUAGE sql STABLE AS $$ SELECT (now() AT TIME ZONE 'Asia/Yangon')::date $$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 GRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;GRANT ALL ON storage.objects TO anon,authenticated,service_role;
 CREATE POLICY existing_permissive_policy ON storage.objects FOR ALL TO authenticated USING(true) WITH CHECK(true);`);
  await db.exec(
    "INSERT INTO storage.buckets(id,name,public) VALUES ('saya-owl-lesson-audio','saya-owl-lesson-audio',false)",
  );
  await db.exec(await readFile("drizzle/migrations/0014_permanent_mp3_audio.sql", "utf8"));
  await db.exec(await readFile("drizzle/migrations/0016_audio_script_drafts.sql", "utf8"));
  const uid = "00000000-0000-4000-8000-000000000001";
  await db.exec(
    `INSERT INTO lesson_mp3_catalog(id,grade,unit,lesson_id,section,segment_id,segment_order,script_hash,script_version) VALUES('pilot',11,1,'unit1','grammar','one',1,'hash','v1');`,
  );
  await db.exec(`SET ROLE service_role`);
  const enqueue = async (regenerate = false) =>
    (await db.query(`SELECT lesson_mp3_enqueue('pilot',$1,$2) AS id`, [uid, regenerate])).rows[0]
      .id;
  const id = await enqueue();
  assert.equal(await enqueue(), id, "duplicate enqueue must reuse version");
  const job = (await db.query("SELECT * FROM lesson_mp3_claim()")).rows[0];
  assert.ok(job);
  assert.equal(
    (await db.query("SELECT * FROM lesson_mp3_claim()")).rows.length,
    0,
    "global worker lease",
  );
  const reserve = async (provider, limit = 10) =>
    (
      await db.query(
        `SELECT lesson_mp3_reserve($1,$2,$3,'unchanged-model',30,$4,100,10000) AS result`,
        [job.id, job.token, provider, limit],
      )
    ).rows[0].result;
  assert.ok((await reserve("lovable_gateway")).id);
  assert.ok((await reserve("direct_gemini")).id, "fallback must have its own pacing slot");
  assert.equal(
    (
      await db.query("SELECT lesson_mp3_backoff($1,$2,'lovable_gateway',3600) AS ok", [
        job.id,
        job.token,
      ])
    ).rows[0].ok,
    true,
  );
  assert.ok(
    Number(
      (
        await db.query(
          "SELECT extract(epoch FROM (provider_next->>'lovable_gateway')::timestamptz-now()) AS wait FROM lesson_mp3_control WHERE id=1",
        )
      ).rows[0].wait,
    ) > 3500,
  );
  assert.ok((await reserve("direct_gemini")).wait > 0);
  assert.equal((await reserve("direct_gemini", 2)).reason, "configured_daily_budget");
  const checkpoint = async (token, patch) =>
    (
      await db.query("SELECT lesson_mp3_checkpoint($1,$2,$3::jsonb) AS ok", [
        job.id,
        token,
        JSON.stringify(patch),
      ])
    ).rows[0].ok;
  assert.equal(await checkpoint(uid, { status: "pending" }), false, "wrong fencing token");
  assert.equal(
    await checkpoint(job.token, {
      status: "pending",
      storage_path: "pilot.mp3",
      raw_path: "pilot.wav",
      bytes: 1000,
      raw_bytes: 2000,
      duration: 1,
    }),
    true,
  );
  await db.query(`SELECT lesson_mp3_approve_selection(ARRAY[$1]::uuid[],$2)`, [id, uid]);
  assert.equal(
    (await db.query(`SELECT approved_version FROM lesson_mp3_catalog WHERE id='pilot'`)).rows[0]
      .approved_version,
    id,
  );
  assert.equal(await enqueue(), id, "ordinary enqueue must not regenerate approved audio");
  await db.exec(
    "UPDATE lesson_mp3_catalog SET script_draft='Updated teaching draft' WHERE id='pilot'",
  );
  const edited = (
    await db.query("SELECT lesson_mp3_enqueue_draft('pilot',$1,'Updated teaching draft') AS id", [
      uid,
    ])
  ).rows[0].id;
  assert.equal(
    (await db.query("SELECT script_text FROM lesson_mp3_versions WHERE id=$1", [edited])).rows[0]
      .script_text,
    "Updated teaching draft",
  );
  assert.equal(
    (await db.query("SELECT approved_version FROM lesson_mp3_catalog WHERE id='pilot'")).rows[0]
      .approved_version,
    id,
  );
  assert.equal(
    (await db.query("SELECT * FROM lesson_mp3_claim_selection(ARRAY['other'])")).rows.length,
    0,
  );
  await db.query("DELETE FROM lesson_mp3_jobs WHERE version_id=$1", [edited]);
  await db.query("DELETE FROM lesson_mp3_versions WHERE id=$1", [edited]);
  const replacement = await enqueue(true);
  assert.notEqual(replacement, id);
  assert.equal(
    (await db.query(`SELECT approved_version FROM lesson_mp3_catalog WHERE id='pilot'`)).rows[0]
      .approved_version,
    id,
    "old approved audio remains published",
  );
  await db.exec(
    `UPDATE lesson_mp3_control SET next_request_at=now()-interval '1 hour',provider_next='{}';`,
  );
  const second = (await db.query("SELECT * FROM lesson_mp3_claim()")).rows[0];
  assert.ok(second);
  await db.exec(
    `UPDATE lesson_mp3_jobs SET lease_until=now()-interval '1 minute' WHERE state='running';UPDATE lesson_mp3_control SET lease_until=now()-interval '1 minute';`,
  );
  await db.query("SELECT * FROM lesson_mp3_claim()");
  assert.equal(
    (await db.query(`SELECT state FROM lesson_mp3_jobs WHERE id=$1`, [second.id])).rows[0].state,
    "interrupted",
    "expired work must not issue another paid request",
  );
  assert.equal(
    (await db.query("SELECT lesson_mp3_stats() AS stats")).rows[0].stats.storageBytes,
    3000,
  );
  await db.exec(
    `RESET ROLE;INSERT INTO storage.objects(bucket_id,name) VALUES('saya-owl-lesson-audio','private.mp3'),('other','existing.png');SET ROLE authenticated;`,
  );
  assert.equal(
    (await db.query("SELECT * FROM storage.objects")).rows.length,
    1,
    "restrictive private bucket policy survives broad existing policy",
  );
  await assert.rejects(() => db.query("SELECT * FROM lesson_mp3_versions"));
  await assert.rejects(() => db.query("SELECT lesson_mp3_claim()"));
  await db.exec("RESET ROLE");
  assert.equal(
    (await db.query(`SELECT public FROM storage.buckets WHERE id='saya-owl-lesson-audio'`)).rows[0]
      .public,
    false,
  );
  console.log(
    "PASS: migration, private storage, RLS grants, idempotency, leases, pacing/fallback, quota, fencing, approval, version preservation, interrupted work, stats. Disposable PGlite only.",
  );
} finally {
  await db.close();
}
