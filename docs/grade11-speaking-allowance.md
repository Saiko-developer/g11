# Grade 11 speaking allowance

Grade 11 role-play now has its own server-enforced allowance: two distinct units per Myanmar calendar day, two successful sessions per unit, five minutes per session. All account roles use these Grade 11 limits. Grade 10 tables, quotas and lesson components are unchanged.

A session starts counting only when its first validated AI reply is saved. Failed startup releases the reservation; providers may still bill attempted generation. Reloading or opening another tab resumes the original session and deadline. Ending early still uses one session. Only one session/request can run at a time per account. Revision checks prevent competing turns; server-private completion claims protect pending requests. Retries reuse saved replies without another model call. Requests are additionally limited to 30/minute and 200/Myanmar day.

Myanmar midnight resets the bucket for new successful starts. A session started before midnight retains its original five-minute deadline. The theoretical four-session allowance is 20 session minutes per start-date bucket, not provider audio minutes. Scoped speech transcription and playback require an active owned session. Unrelated tutor, popup, grammar and exam AI allowances are unchanged; this is not a global provider spending cap.

Students see remaining sessions, units and a countdown. Admin account details show today's Grade 11 session snapshot and active countdown. Older backends display unavailable usage rather than fabricated zero counts. Private session history retains at most 21 turns; request records contain reservation metadata. Both tables deny direct authenticated access and cascade on account deletion. No automatic retention cleanup is introduced.

## Deployment

Apply the existing Drizzle migration chain in order, including `0004_admin_account_integrity.sql` and `0005_grade11_speaking_allowance.sql`, in the **new** Lovable project's connected database. Use migration tracking; do not blindly rerun already-applied SQL. Deploy the matching application code. Do not apply to the old project.

Live database application was not performed in this session: the connected target project denied database access. Git push does not apply these migrations. Without migration 0005 the Grade 11 UI intentionally reports allowance setup unavailable and does not start a paid request.

## Verification

Run `npx tsc --noEmit`, `npx vitest run --maxWorkers=2 --testTimeout=15000`, and `node scripts/verify-grade11-speaking.mjs /path/to/pglite/package.json` with a temporary PGlite installation. The database script verifies reservations, failed starts, concurrency, ownership, deadlines, cached resume, quota boundaries, Myanmar-day reset and legacy Grade 10 isolation. Model calls are mocked; no paid provider requests are required. No production build is needed.
