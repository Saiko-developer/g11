# Activate actual classroom narration

The production preflight on 2026-11-13 found reading progress, publication and
study-plan records, but no classroom audio cache/bucket or shared AI reservation
schema. Publication count was zero. This explains why the earlier UI could not
teach with audio.

`0005_activate_classroom_narration.sql` installs the missing private audio cache,
generation claims, atomic credit requests/ledger and live settings through the
existing migration runner. It preserves existing balances, authentication,
textbooks and progress. Apply once after schema reconciliation; do not replay the
old Step 2 draft schema.

`/teaching-setup` is restricted to existing SQL-verified admins. It:

1. Reports missing runtime configuration and tables without exposing values.
2. Prepares at most one selected class using canonical scripts, one clip per
   request, with the existing global 20-new-clips/day ceiling.
3. Allows admin-only listening to private draft audio before publication.
4. Requires explicit script/audio acknowledgement and all class clips ready
   before publishing to students.
5. Activates bounded live questions through a server-only setting, avoiding an
   invisible environment-flag prerequisite. An explicit environment value `false`
   remains an emergency stop; `true` retains backward compatibility.

A successful preparation proves generation/storage, not pedagogical accuracy.
Listen before approving. A configured key is not proof of provider credit or
availability. Real publication/AI tests must report their actual results.

Student playback still never generates narration on a cache miss. Cached clips
are shared; private questions are never put in the shared audio cache. Existing
legacy AI charging remains unchanged unless its separate rollout flag is enabled.
The new classroom's live questions always reserve quota and fail closed.

Verification:

- `node scripts/verify-activation.mjs /tmp/saya-sql/package.json` validates actual
  migrations 0002–0005 in disposable PostgreSQL, including private-table/function
  denial to students, idempotent requests/refunds and generation claims.
- Activation endpoint tests verify admin authorization, acknowledgement, canonical
  day bounds and refusing publication when clips are missing.
- After application, inspect real cache rows/bucket and test actual audio, repeat
  cache hits, live question allowance and progress resume in the Lovable preview.
