# Permanent MP3 Audio Library — Grade 11 Unit 1 pilot

## Audit and scope

Branch: `feature/permanent-mp3-audio`. Built separately from main and the unfinished exam-output worktree. No production database, storage, deployment, TTS call or bulk generation was performed while implementing this branch.

Repository evidence:

- `ttsGenerate.server.ts`: existing Gemini gateway → direct Gemini fallback, voice alias `sarah` → Puck, sanitization, PCM24kHz → WAV. Existing model selection, prompt, fallback order, speed and voice mappings are unchanged. An optional injected fetcher supplies worker pacing and request observations; normal callers still use the global fetch.
- `grade11GrammarAudioCache.server.ts`: 249 deduplicated authored walkthrough chunks across 12 units, 44 in Unit 1; private `grade11-grammar-audio` WAV bucket and ready/claim state.
- `classroom/method-lessons.ts`: Grade 10 grammar has 33 **segments**, Grade 11 has 37. Each has four audio steps: 132 and 148 audio clips, not 33 and 37 clips. Thus the old 319 total mixed two different units of measurement. Those three groups contain 529 audio steps/chunks before any cross-group deduplication.
- `classroom/audio.server.ts`: canonical script hashes, per-step WAV cache in `classroom-narration`, publication check in callers, lease recovery.
- The new registry also inventories existing authored writing and reading classroom steps. It does not invent missing textbook teaching scripts. Actual registered catalog and version counts come from the database, not these audit figures.
- `admin.tsx` / `AdminDashboard`: existing Google authentication and admin dashboard. API authorization reuses active-account checks and SQL-backed `my_access`; a client-side admin flag alone never authorizes storage or generation.
- Existing WAV caches are never deleted, overwritten or migrated in place. Live tutor/speaking audio is not part of the fixed-script library.

The pilot enables generation only for **Grade 11 Unit 1 Grammar**: 44 walkthrough chunks plus 12 classroom audio steps. Classroom generation additionally requires the existing script publication/review workflow. Other grades/units are inventory only until the pilot is accepted. Exact scripts can be reviewed in the Audio Manager; queue confirmation is approval to narrate that fixed script, not permission to edit it.

We did not inspect hosted database contents. The old ready indexes are reported as “ready (validated on reuse)”; a file is not declared usable until the worker actually reads and validates it. Actual existing/missing files, voice quality and historical provider/model cannot be verified offline.

## Architecture and guarantees

Admin Dashboard → Audio Manager → authenticated server API → private catalog/version/job tables → leased one-job worker → legacy WAV reuse or unchanged TTS pipeline → PCM16 WAV validation → pure JavaScript LAME MP3 encoding (64 kbps mono) → immutable version paths → pending review → admin listening/approval → opt-in student playback.

The encoder is pinned `@breezystack/lamejs@1.2.7`; it does not require an installed FFmpeg executable, a second TTS provider, or browser encoding. The inspection code validates complete MP3 frame boundaries and duration. Audio quality still requires human listening; binary validation does not prove pronunciation or factual teaching accuracy.

New tables (all RLS enabled; no client read/write grants):

- `lesson_mp3_catalog`: grade/unit/lesson/section/segment order, existing canonical script identity hash/version, approved-version pointer.
- `lesson_mp3_versions`: immutable version ID, script identity, Puck voice, observed provider/model for newly generated audio, format/path, bytes, recovery-WAV bytes, duration, generation/review status, audit identities/timestamps/errors.
- `lesson_mp3_jobs`: durable queue, generation permission, fencing token and ten-minute lease.
- `lesson_mp3_control`: global sequential worker lease, provider-specific pacing slots and pause deadline.
- `lesson_mp3_events`: request reservations, observed HTTP results, cache reuse/conversion events. No API keys, raw provider request payloads or private student recordings are recorded.

`script_hash` is the existing canonical speech/cache identity, including script/version/voice/model settings, rather than a separately computed text-only hash. This intentionally preserves old WAV keys. Versions retain this identity and script version; scripts remain repository-owned.

Private bucket `saya-owl-lesson-audio`:

`grade-11/unit-01/grammar/<version-uuid>/source.wav`

`grade-11/unit-01/grammar/<version-uuid>/audio.mp3`

Writes never use storage upsert. Repeated uploads are accepted only if stored bytes are identical. The recovery WAV is retained separately; old WAV buckets are untouched. A restrictive storage policy blocks direct anon/authenticated access even if an unrelated permissive policy exists. Server admin/auth checks guard all preview/download operations. No public URLs or client service-role keys are introduced.

Approval swaps the catalog pointer; generating or rejecting a replacement leaves the old approved pointer intact. Previously approved versions remain available for preview, download and explicit restore. Rejecting the currently published version removes its pointer. Downloads accept approved versions only; admin preview also accepts pending/rejected versions.

A single worker claims one job per request. Claims are globally serialized in SQL. Duplicate queue requests reuse an active version. Upload paths are deterministic per version so interrupted work can recover a file saved before checkpointing. Expired jobs become interrupted, not automatically retried with another paid request. “Resume stored audio” cannot generate new speech. “Retry failed audio” explicitly authorizes a new request if no stored audio can be recovered. No infinite retries exist.

Provider pacing is independent for gateway/direct calls so a fallback does not wait out the direct provider's existing request timeout. The next job waits for pacing slots. Request reservations and estimated input tokens are database-backed; a reservation with no HTTP result remains “unconfirmed.” A worker crash between reservation and response can overcount an attempt conservatively. Existing live AI traffic is outside this new worker budget and can still exhaust a shared provider quota.

Quota/timeouts/invalid media stop the job. Retry-After seconds or dates are respected when present; otherwise 429 pauses conservatively for one hour and 503 for one minute. Provider quota and configurable generation budgets are distinct from student classroom quotas; the old 20-clip classroom limit is not reintroduced.

## Setup — review and approve before touching a hosted project

1. Review this feature branch and `drizzle/migrations/0014_permanent_mp3_audio.sql`. The existing Drizzle custom migration generator created its journal/snapshot entries. Supabase CLI could not initialize its home configuration in this sandbox; no hosted CLI migration was attempted.
2. Apply the migration through the application's existing **approved Drizzle migration workflow**. Do not run a schema push or execute the SQL against production merely to preview this feature. Back up/review permissions first as part of your normal deployment process.
3. Deploy the reviewed feature branch only after explicit owner approval. No deployment is done by this work.
4. Verify existing server-only Supabase URL/publishable/service-role credentials and existing Lovable/Gemini TTS credentials. Do not put secrets in `VITE_*` variables. Do not change working voice/model/provider configuration.
5. Keep `AUDIO_MP3_PILOT_PLAYBACK` absent/false until the first MP3 has been previewed and approved.
6. Log in as the existing admin, open `/admin`, select **Audio Manager**, and click **Register / update catalog**. This writes catalog metadata only and never generates audio.
7. Filter Grade 11 / Unit 1 / Grammar, select the desired lesson and inspect the exact scripts. Queue **one** clip first. Existing cached WAV is preferred; “Generate missing” caps one queue action at three clips, selected actions at five. These are admin batch sizes, not classroom playback limits.
8. Click **Process one queued clip** to test one job. Generation is a server request with durable checkpoints, not a browser loop. Closing the tab does not grant permission for another paid request. If the host terminates a request, recovery/explicit retry rules apply.
9. Listen to the entire pending MP3; verify Burmese/English pronunciation, Puck voice, completeness and timing. Approve it explicitly. Download the individual MP3, then the unit ZIP part(s), and verify the manifest and playable files on target devices.
10. Enable `AUDIO_MP3_PILOT_PLAYBACK=true` only after approval. Test the walkthrough and classroom pause/resume/replay/automatic flow. Check that replay does not increment TTS request events. A missing/corrupt approved asset returns 503 instead of silently paying for regeneration. Missing/unapproved library entries retain the existing WAV/fallback workflow. Classroom prepare requests acknowledge approved MP3 metadata without issuing speech generation.
11. For unattended batches, configure an authenticated external scheduler to POST `/api/audio-worker` about once per minute. Set a random server-only `AUDIO_MP3_WORKER_SECRET` of at least 32 characters and send it as a Bearer token. Do not expose it to the admin browser. Scheduler configuration is intentionally manual; no scheduled bulk job is installed by the migration/build.
12. Confirm the hosting plan permits the existing TTS timeout plus CPU time/memory for MP3 encoding (allow roughly 180 seconds request wall time; lease is ten minutes). Pure JavaScript is portable, but does not remove Cloudflare/Lovable CPU/request limits. Hosted runtime capacity was not verified. Do not enable unattended generation on a runtime that terminates these jobs too early.

Server worker configuration (defaults are conservative operator budgets, not universal Google limits):

| Variable                             | Default | Purpose                                                                  |
| ------------------------------------ | ------: | ------------------------------------------------------------------------ |
| `AUDIO_MP3_PILOT_PLAYBACK`           |   false | Opt-in Grade 11 Unit 1 Grammar playback                                  |
| `AUDIO_MP3_WORKER_SECRET`            |   unset | External scheduler authorization; endpoint disabled if too short/missing |
| `AUDIO_MP3_INTERVAL_SECONDS`         |      30 | Per-provider spacing, minimum 20 seconds                                 |
| `AUDIO_MP3_DAILY_REQUESTS`           |      10 | Worker request reservations per Myanmar day using `mm_today()`           |
| `AUDIO_MP3_INPUT_TOKENS_PER_MINUTE`  |   10000 | Conservative estimate budget; estimated as 3 tokens/input character      |
| `AUDIO_MP3_ESTIMATED_USD_PER_MINUTE` |   unset | Optional owner-supplied estimate per generated audio minute              |

The observed free-tier 3 RPM / 10 requests/day / 10,000 tokens/minute is not guaranteed for another project or plan. Change operator budgets to match verified provider limits. No exact remaining Gemini/Lovable balance is claimed. Cost estimates exclude unknown input charges/provider discounts and are not billing data.

## Downloads and rollback

Unit and grade ZIPs are split by both 20-file and 32-MB caps. Each part has its own button, filename and `manifest.json` containing grade/unit/lesson/section/order, script version/hash, voice, duration, size and version ID. The server streams ZIP STORE entries one file at a time. The browser buffers at most one bounded archive blob rather than hundreds of files. iPhone/Android saving depends on the browser's download/Files support and requires real-device verification. Downloads never delete storage objects or generate TTS.

Turn off `AUDIO_MP3_PILOT_PLAYBACK` to immediately retain the old WAV playback path. Stop the external scheduler to stop unattended work. Restore an old approved version in the Audio Manager after listening. No automatic WAV deletion, script rewrite, rollback migration or published-history rewrite is performed.

## Verification and remaining live checks

Automated backend tests cover real MP3 encoding/frame validation, WAV corruption, ZIP CRC extraction, one-file-at-a-time archive reads, authorization, confirmation, batch sizes, cached reuse, interrupted recovery permissions, and repeated playback without TTS. Existing TTS/cache/classroom tests are run to protect the previous behavior.

`node scripts/verify-audio-migration.mjs /path/to/test-tools/package.json` runs disposable PGlite only (install `@electric-sql/pglite@0.3.14` in a local test-tools directory). It checks SQL execution, RLS/grants, a restrictive storage policy against an existing broad permissive policy, duplicate enqueues, global leases, separate fallback pacing, daily budgets, fencing, review pointer changes, preservation of prior audio, interrupted jobs and storage statistics. It never reads a hosted connection string.

A synthetic PCM test file was encoded locally and independently inspected with FFprobe as MP3 / 24kHz / mono / 64kbps. FFprobe is a development verification tool only, not a production dependency. No actual pilot narration was generated or converted during development.

Still requiring an approved hosted pilot: actual legacy WAV availability, hosted service-role/RLS/storage behavior, provider credits/quota and voice quality, conversion CPU budget, cron execution after browser close, real Google-admin/student flows, and Mac/Windows/Android/iPhone downloads. Generation outside Grade 11 Unit 1 Grammar remains disabled until the pilot is accepted. Do not claim public-launch readiness before those checks.

## Development verification results

- Full suite: **853 tests passed in 111 files** on the serial run. An earlier parallel run hit the existing Grade11Unit1Workspace five-second timeout; its isolated retry passed all four tests and the serial full run passed. No timeout was increased and no unrelated reading implementation was changed.
- Audio/UI plus existing TTS/cache/classroom regression selection: **54 tests passed**.
- TypeScript, changed-file ESLint and production build passed.
- Disposable SQL checks passed, including persisted per-provider Retry-After and protection against a broad pre-existing storage policy.
- Real Chromium mobile guest/auth-boundary checks passed. Admin component interactions used local fixtures; no hosted admin session was used.
- Pilot narration generated: **0**. Pilot cache conversions/reuse against hosted storage: **0**. Only synthetic PCM was encoded locally for codec/archive verification.
- No hosted migration, deployment, scheduler installation or bulk generation was performed.
