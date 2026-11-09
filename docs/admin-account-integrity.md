# Admin account integrity — phase 1

## Changes

- Tutor-only grants send a null scholarship argument, preserving the current status even on the older backend. Exam-only grants call only the exam-credit RPC. Every adjustment requires active SQL-verified admin access and exactly one validated intent; positive whole-number grants are capped at 100,000 per request.
- Migration `0004_admin_account_integrity` also makes the database tutor-update RPC preserve scholarship for both null and empty arguments, validates inputs, and denies suspended admins.
- Admin roles/protected accounts are derived from SQL (`my_access`, `is_admin`, `is_main_admin`). The duplicate JavaScript email whitelist is removed. Failed role/protection checks fail closed. Self/main-admin checks also apply to the teacher-role handler.
- Main-admin profile UPDATE protection is enforced by RLS, including direct authenticated REST requests. The `is_admin` SQL predicate denies suspended role holders; assigned role labels remain visible in the account summary. Expired temporary suspensions allow access again.
- The new admin-only `admin_account_summaries` RPC joins wallets, roles and Myanmar-day usage in SQL. Absent wallets mean zero, not a guessed five-credit bonus. Query failures/malformed summaries are errors, never fabricated balances.
- When the new snapshot function is not yet deployed (`PGRST202`/`42883` only), a strict compatibility path uses existing paginated queries and SQL protection checks. It uses bounded batches of protection checks, which is slower than the single snapshot RPC. Apply the migration for the preferred path. Other RPC errors do not silently fall back. There is no service-role client initialization before access checks; the preferred snapshot needs no service-role key.

## Account suspension at paid AI boundaries

The existing caller-owned `my_access` RPC checks account status before new user-triggered paid AI requests. The request's bearer token determines the user; no client-supplied account ID or grade flag grants access. This works with the existing backend while the migration is pending. Suspended users receive 403; unavailable/unknown account status fails closed with 503; genuinely rejected tokens retain 401. Invalid API keys do not invite repeated student sign-in.

Coverage includes tutor/popup chat, speaking roleplay, TTS (including cache lookup), transcription, hints, semantic/writing checking, question/exam generation and user-triggered marking. Public read-only question-bank GET and original lesson/audio assets remain available under their existing rules. Authorized service-role classroom cron jobs keep their existing behavior; this is not a global AI emergency-stop feature.

The migration additionally guards direct tutor consumption and speaking session/turn RPCs, rejecting suspended callers before consuming their quota or opening/advancing a session. It does not retroactively cancel provider calls already in flight. The check is repeated at new request/turn boundaries.

Shared API/SQL checks necessarily cover suspended Grade 10 users too: the existing admin suspension policy is enforced consistently. No Grade 10 lesson/UI files, active-user quotas, prompts, AI models, speaking limits, auth provider or lesson narration were changed. The proposed 2-units × 2-sessions × 5-minutes rule belongs to the next phase and is not implemented here.

## Verification

- TypeScript and targeted ESLint pass.
- Full regression suite: 55 files, 461 tests, run with `--maxWorkers=2 --testTimeout=15000`.
- New unit/integration tests: 32 cases for access verification, scholarship-safe grants, exam-only grants, invalid inputs, canonical admin/owner flags, missing-wallet zero balances, pagination, error handling, compatibility fallback, and stopping suspended speech/transcription/popup/roleplay before provider work.
- Disposable PostgreSQL (`PGlite`) runs all committed migrations and exercises scholarship preservation, empty/null compatibility, independent exam balance, denied invalid amounts/statuses, suspended tutor/speaking denial without consuming quota/session data, expiry recovery, active/suspended admin permissions, SQL owner privileges without a separate role row, direct main-profile RLS protection, zero missing-wallet values, Myanmar-midnight counts, restricted execution grants and repeat-safe migration. No live user/credit records are modified.
- Chromium: real signed-out `/admin` still shows Admin Login; public Grade 11 Grammar renders; anonymous TTS, popup chat, roleplay and mock-exam endpoints return 401; no page errors. No paid model calls or production build were run. Real signed-in production admin behavior remains to be verified.

Reproduce SQL checks using a temporary test-only dependency:

```sh
npm install --prefix /tmp/admin-sql-check --cache /tmp/admin-npm-cache --no-audit --no-fund --save-exact @electric-sql/pglite@0.3.14
node scripts/verify-admin-integrity.mjs /tmp/admin-sql-check/package.json
```

PGlite is not a production dependency. The test boots minimal Auth/Storage stand-ins and never connects to a hosted database.

## Live rollout still required

Target backend: `eexwzxppdqutuntdorbr`. The connected Supabase tool rejected even a read-only schema check with `You do not have permission to perform this action`. No target migration credential is available. The migration has therefore **not been applied or verified live by this session**. Git sync alone is not evidence of application.

In the new project's Lovable environment, verify the backend identity and applied migration history, then apply only the pending `0004_admin_account_integrity` through its migration mechanism. Preserve existing data and earlier migration history; do not reset the database or replay initial schema. Run security advisors and verify grants/RLS after applying.

Suggested request:

> For backend eexwzxppdqutuntdorbr only, apply the committed migration 0004_admin_account_integrity if pending, without resetting data. Verify admin_account_summaries, active-account guards, scholarship preservation, main-admin profile RLS and function privileges. Regenerate database types and run security advisors. Report results. Do not change lessons, AI providers or quota/speaking allowance policies.

Read-only signature check:

```sql
select to_regprocedure('public.admin_account_summaries()') as snapshot,
       to_regprocedure('public.is_active_ai_account()') as active_guard;
```

Already-lost scholarship state cannot be reconstructed from an empty value; review such accounts manually. The migration does not guess/restore historical approvals or alter existing balances. No subscriptions, usage ledger, pricing, refunds, provider top-up or spending controls are added in phase 1.
