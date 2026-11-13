# Teacher-led daily classes

## Learner experience

The primary Home action is **အတန်းစမယ်**. An enrolled student goes directly to
`/class?start=true`, the server-selected class loads, and cached narration starts
when the account and approved audio are ready. Students do not select units,
skills, paragraphs or the next teaching step. The Grade 11 home has the same entry.

On the first visit, the student chooses Grade 10 or 11 once. The server retains
that enrollment and ignores attempts to silently change it. `/class` without
`start` shows the daily study plan before entering the room.

The room uses the existing Saya Owl mascot and a whiteboard. English remains on
the board while Burmese translation, explanation, and vocabulary/grammar notes
appear as the teacher reaches them. Cached speech drives progression; timers do
not pretend audio is playing. Pause, repeat and Ask Teacher are student controls.
Next/Previous are not part of the normal daily class. An optional text preview
remains clearly labelled for inspecting unprepared draft content.

## Daily sequencing

The current prepared reading material is grouped into four-sentence classes:
Grade 10 has four classes; Grade 11 has ten. Sentence boundaries, source text,
existing teacher scripts and the English → Burmese → explanation → reasoning
order are preserved. The short final Grade 11 class contains two sentences.

The teacher stops at the assigned daily boundary. Finishing is server checked
against saved reading progress; an incomplete class cannot advance the plan.
Completions are idempotent. One class can be completed per student per Myanmar
calendar day. The same class remains available for review that day, and the next
unfinished class is assigned on the next day the student returns. Absence never
skips a class. A failed completion save is shown and can be retried.

Reading comprehension is available only after the whole passage, not after each
four-sentence class. Reading practice completion is self-reported; this does not
claim to establish mastery. No formal unit homework is assigned by this pilot.

Vocabulary, Grammar, Writing, Listening and Speaking daily instruction remain
content-expansion work. The plan does not pretend they are ready or advance to
missing lessons once reading finishes. Independent textbook pages are preserved.

## Storage and authorization

The additive migration `0003_teacher_led_daily_plan.sql` is generated through the
existing Drizzle migration workflow. It depends on the existing reading progress
migration `0002_reading_classroom_progress.sql`, auth users, profiles and
`mm_today()`. It was tested in disposable local PostgreSQL, not applied to a
hosted database by this change.

- `study_enrollments`: one grade selection per account.
- `daily_class_completions`: owner/grade/plan-version/session identity and Myanmar
  completion day.
- RLS allows only owner reads. Clients cannot insert/update completion records.
- `/api/study-plan` validates active authentication and resolves lesson/day ranges
  on the server. Arbitrary client lesson ranges/user IDs are never accepted.
- The service-only completion RPC locks per user, checks enrollment, account
  status, previous classes, today's completion and saved required steps.

Account grade/day progress requires this migration to be applied by the authorized
migration runner. Do not manually replay the old Step 2 review schema: it overlaps
with the already-added progress tables.

## Narration readiness and costs

Existing publication, private audio cache, provider configuration and live-AI
controls remain in force. **This UI change does not claim to make unprepared audio
or unconfigured AI operational.** Unpublished scripts or missing clips stop audio
with a visible message; the player does not silently generate costly narration.
The greeting and closing summaries displayed in the room are text, not additional
pre-recorded speech clips.

A SQL-verified admin can open the room's preparation panel and prepare the day's
clips in sequence, after script approval in the existing review panel. Already
ready clips are skipped without another generation. The existing global 20-clip
preparation cap remains; errors stop the batch and are shown. Each clip needs
listening review. The classroom audio schema/bucket and AI credit schema from the
Step 2 backend rollout still require separate reconciliation if not yet installed.
No paid provider calls or hosted schema operations were performed during this work.

## Verification

- Unit tests: both-grade coverage, no gaps/repeats, absence handling, Myanmar day
  rollover, same-day review and prepared-plan completion.
- React/audio tests: account plan selection, direct Home entry, automatic 16-step
  playback, stopping before tomorrow, and exactly one completion request.
- SQL harness: RLS/ownership, incomplete and out-of-order classes, same-day limits,
  replay, and following-day advancement.
- Mobile Chromium: Home → daily landing → whiteboard, optional preview, no Next
  button in normal controls, layout and unauthenticated API rejection.
- Existing textbook/classroom/credit regression tests remain applicable.

Live provider/storage/auth integration still requires the confirmed backend,
reviewed content and configured credentials; mock tests are not live evidence.
