# Remix migration repair

Target: `remix-of-project-launchpad-94`, configured backend `eexwzxppdqutuntdorbr`.

## What changed

- Added the custom Drizzle migration `0002_restore_speaking_practice`, generated with `drizzle-kit generate --custom`. Earlier migration history is unchanged.
- Restored the exact original `g-11` speaking schema/RPC contracts: `speaking_sessions`, `speaking_unit_status`, `start_speaking_session`, and `speaking_turn`. The original five sessions per unit/day, 20 turns/session, 30-minute expiry, privileged access, owner isolation and Myanmar-day calculations remain unchanged.
- Synchronized the generated TypeScript declarations with those restored contracts. No UI, provider, login, payment, tutor quota or Grade 10 source files were changed.
- Replaced all 42 platform-only page-image pointers in `src/assets/grade11-pages.json` with committed files in `public/grade11/pages/`.

## Original textbook provenance

Images are rendered from the user's uploaded **13575. Grade (11) English New Syllabus-1-48.pdf**, PDF pages 7–48, without changing content. Reference numbers remain PDF page numbers, not printed page numbers. The PDF SHA-256 is:

`4ed3ca84b0c0ff96e4a3f8fe12e229252433bc72337d85ab0d18d4adba7aef50`

Rendered with PyMuPDF at 1400 px width, JPEG quality 86. This removes reliance on `/__l5e/assets-v1/...` for these Grade 11 page images. The existing MP3 files are unchanged.

## Verification

`npx tsc --noEmit` and `npx vitest run --maxWorkers=2` check application regressions. All 42 image references are checked for a corresponding JPEG file. Chromium loaded pages 7, 24 and 48 at 1400 px width and rendered Unit 3 Grammar without page errors.

The final full test run passed 414 tests with one existing Unit 1 UI test exceeding its 5-second timeout. Its complete four-test file passed separately with `--maxWorkers=1 --testTimeout=15000`. No test or permanent timeout configuration was changed. TypeScript passed.

A disposable local PostgreSQL test runs both new-repo baseline migrations followed by the restoration. It exercises actual SQL, student limits, per-unit and per-user isolation, expiry, teacher privileges, RLS, execution/write grants and reapplication without losing existing sessions. No hosted database or paid AI provider is used.

Reproduce without changing project dependencies:

```sh
npm install --prefix /tmp/speaking-sql-check --cache /tmp/speaking-npm-cache --no-audit --no-fund --save-exact @electric-sql/pglite@0.3.14
node scripts/verify-speaking-migration.mjs /tmp/speaking-sql-check/package.json
```

PGlite supplies PostgreSQL; the test bootstraps small stand-ins for Supabase Auth/Storage. It does not prove the production schema, real authentication or Lovable credits are configured correctly.

## Live migration still required

The new hosted backend was not accessible from this session: public health/schema requests returned HTTP 403 / error 1010; the configured Lovable backend is not in the connected Supabase tool's project list; no target migration database credential is available. Do not apply this to a different connected project.

**A Git push is not evidence that the database migration was applied.** In the new project's Lovable environment, inspect the target backend and apply the committed `0002_restore_speaking_practice.sql` through its migration mechanism. Preserve existing data; do not reset or replay the initial schema over an existing database. Check applied migration history first. If the migration is already applied, verify rather than applying duplicates.

Suggested Lovable request:

> For this new project only, verify the backend is eexwzxppdqutuntdorbr. Apply the committed Drizzle migration 0002_restore_speaking_practice if not already applied, preserving data. Verify speaking_sessions and speaking_unit_status(integer), start_speaking_session(integer), speaking_turn(uuid), owner RLS and authenticated-only RPC access. Regenerate database types after applying. Do not change Grade 10 UI, AI workflow, provider, login or quota rules. Report results and any runtime setup still missing.

Read-only verification SQL for the actual backend:

```sql
select to_regclass('public.speaking_sessions') as sessions,
       to_regprocedure('public.speaking_unit_status(integer)') as status_rpc,
       to_regprocedure('public.start_speaking_session(integer)') as start_rpc,
       to_regprocedure('public.speaking_turn(uuid)') as turn_rpc;
select relrowsecurity
from pg_class
where oid = to_regclass('public.speaking_sessions');
```

Then test Grade 11 AI Speaking while signed in. Check the new workspace's runtime `LOVABLE_API_KEY` and AI balance, OAuth settings, Storage buckets/files and payment configuration independently. This migration does not copy old users/progress/wallets/uploads or replenish credits. Never paste secret keys in chat.
