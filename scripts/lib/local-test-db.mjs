import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
/** Disposable PostgreSQL only. No hosted connection or production credentials. */
export async function localTestDb(packagePath) {
  const require = createRequire(resolve(packagePath || "package.json"));
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
    const journal = JSON.parse(await readFile("drizzle/migrations/meta/_journal.json", "utf8"));
    for (const entry of journal.entries)
      await db.exec(await readFile(`drizzle/migrations/${entry.tag}.sql`, "utf8"));
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
