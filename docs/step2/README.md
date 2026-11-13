# Step 2 — Unit 1 reading classroom pilot

## Delivery state

This adds a shared Grade 10/11 reading player, draft authored teaching scripts,
account progress APIs, reviewed-content publication, prepared narration, and
transactional AI credit safeguards. It extends the existing application.

**Not applied or deployed:** `schema.sql` is a review draft, deliberately outside
the migration runner. No hosted database was modified. No paid narration or live
AI request was made. Teacher approval is not fabricated. The only project
returned by the connected Supabase listing was inactive and was not established
as the app's active backend; its schema was not queried.

Before backend setup, `/classroom/10` and `/classroom/11` offer text previews and
Manual Mode. They clearly disclose unavailable account saving/audio rather than
pretending these services work. Existing textbook pages remain available.

## What is included

- One player for 16 Grade 10 and 38 Grade 11 sentences (64 and 152 teaching steps).
- English sentence → Burmese translation → natural teacher explanation →
  contextual vocabulary/grammar reasoning, before moving to the next sentence.
- Pause, resume, repeat, previous/next, Manual Mode and Ask Teacher.
- Server-owned, grade/version-specific progress; optimistic revisions stop stale
  devices overwriting newer cursors. Saves occur on controls and every 10 seconds
  during playback. Backgrounding pauses and saves. A tab crash can lose the last
  10 seconds; a failed save is shown and requires reloading server state.
- Questions pause the lesson; live answers do not move the lesson cursor.
- Comprehension opens only after all steps were played or explicitly acknowledged
  in Manual Mode. This is self-reported reading practice, not verified mastery.
- Account progress cards in the existing student dashboard.
- Script approval by an existing SQL-verified admin; approval binds the exact
  manifest hash and records reviewer/time. Editing any script invalidates approval.
- Private, pre-generated narration keyed by manifest/cursor/model/voice/version.
  Student playback **never** generates audio on a miss. One admin preparation
  action produces one clip; the database caps new attempts at 20/day globally.
- Manual KPay/WavePay checkout UI and server-side package/reference validation.
- AI reservations/debits/refunds, request and ledger records, in-flight/rate/day
  caps, provider output/time limits, and fail-closed cache claims.

The Grade 11 three-question comprehension set is newly authored practice, not
an official textbook answer key. Grade 10 reuses only existing questions that
are answerable from the actual checked-in passage. Source pages/textbooks and
original answer files are unchanged. Burmese scripts are drafts for teacher
review, not a claim of independent educational verification.

## Backend review and rollout order

1. Identify the correct existing backend through the deployment configuration.
   Do not create a replacement project or switch authentication.
2. Review the read-only catalog checklist in `preflight.sql` against that backend
   with authorized access. Reconcile the existing migration history first.
3. Review `schema.sql` against deployed function signatures and policies. It
   requires the existing profiles/wallet/quota/payment tables and functions listed
   at the top. Preserve existing balances, role rules, and Myanmar day boundaries.
4. After separate approval, incorporate the reviewed SQL into the project's
   authoritative migration workflow and apply it in staging first. This repository
   has incomplete historical migrations; do not replay the snapshot in production.
5. Configure existing server-only Supabase URL, publishable key and service-role
   key. The service role remains server-only. Configure the existing Lovable AI
   key; optional Gemini key uses the existing fallback routing.
6. Verify RLS/grants with two staging students and an admin, actual concurrency,
   payment reconciliation and failure/refund scenarios.
7. Open each classroom as an admin, read **all** draft segments in the review
   panel, correct any issues in the manifest, and approve the exact scripts.
8. Prepare and listen to every clip before enrolling students. There are 216
   clips total. The default 20/day preparation cap is intentionally conservative;
   a reviewed cap change and budget are needed for faster initial preparation.
   Failed/preparing claims are never automatically retried; an admin must inspect
   storage and the claim before an authorized retry, to avoid duplicate charges.
9. Set `CLASSROOM_LIVE_AI_ENABLED=true` only after publication, reservations and
   provider configuration pass staging checks.
10. Set `AI_CREDIT_GUARD_ENABLED=true` only after credit migrations and billing UX
    are reviewed. Until then, existing endpoints retain legacy quota behavior;
    new classroom Ask Teacher always requires a reservation and fails closed.
11. Do not deploy or run a hosted migration without the user's separate approval.

## Credit policy and boundaries

One guarded operation consumes one existing tutor allowance/bonus unit. Free
daily allowance is used first, then bonus credits. Existing scholarship/admin
allowance rules are retained, but the new guard still enforces hard limits:
100 requests/user/day, 10 requests/user/minute, 2 pending requests/user, and the
configured global daily cap (default 500). Denied and failed provider attempts
that obtained a reservation still count toward request-rate limits.

The rollout flag covers tutor chat, hints, exercise generation, grammar
questions, generic exam generation, Grade 11 checking, paper grading,
transcription, and generated TTS. Cached Grade 11 grammar playback has no new
debit; only its actual generation callback is guarded. Existing mock-exam
credits, Grade 10/11 role-play session limits, and teacher/cron grading controls
remain separate; this change does not claim to unify their pricing.

HTTP errors, thrown calls and AI-SDK SSE errors refund once. Cancellation before
answer delivery refunds; user cancellation after streamed answer text was
delivered consumes the unit. An idempotency key cannot reserve twice, and replay
returns 409 rather than generating again. A lost settlement leaves a conservative
pending reservation, logs its request ID, and can block further concurrent use.
Operators must reconcile abandoned requests, checking provider outcome, and use
the service-only idempotent settlement RPC; do not blindly auto-refund calls that
might have completed. Currency charges are **not** inferred from credit units.

`ai_credit_requests` records operation/outcome and `ai_credit_ledger` records
request debits/refunds and newly approved top-ups. Historical balances remain
unchanged; this is not a reconstruction of prior transactions or a complete
provider token/currency cost dashboard. Use provider billing alongside request
counts until measured token/audio pricing is integrated.

Package validation applies to new submissions only. Admins must still compare
actual payment evidence before approving. References are checked per method;
use full references, since six-digit suffixes can collide. Existing pending
requests need manual review before approval. WavePay is a manual payment channel,
not an automated WavePay API integration.

## Verification

```sh
npm test
npm run build
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint src/components/classroom src/lib/classroom \
  src/lib/ai-credit.server.ts src/lib/ai-credit.server.test.ts \
  'src/routes/classroom.$grade.tsx' src/routes/api/classroom.ts

# Install into a temporary workspace, without changing the app dependencies:
npm install --prefix /tmp/saya-sql --no-package-lock @electric-sql/pglite@0.3.14
node scripts/verify-step2.mjs /tmp/saya-sql/package.json

# With the local dev server already running:
npm install --prefix /tmp/saya-browser --no-package-lock @playwright/test@1.56.1
node scripts/verify-step2-browser.mjs /tmp/saya-browser/package.json http://localhost:8080
```

The SQL harness runs in disposable in-memory PostgreSQL, with minimal existing
schema contracts. It verifies schema execution, quotas, replay, single refunds,
RLS, revision conflicts, invalid completion indices, payment tampering/duplicates,
audio claims, and suspension. It does not establish production schema parity or
multi-connection PostgreSQL contention behavior.

Browser checks must cover both grades, mobile layout, manual completion gating,
auth rejection, audio ordering, exact pause/resume offsets, account switching and
provider failure. Account/audio/AI flows need staging credentials and reviewed
content to be verified against real services; mocked tests are not live evidence.

## Deferred by design

Whole-unit homework, all-skill automatic teaching, persistent conversational
learning memory, grade community/moderation, the first-30-students beta, automated
payment verification, provider-level currency monitoring, and deployment are not
part of this reading-only pilot. No formal homework is assigned prematurely.
