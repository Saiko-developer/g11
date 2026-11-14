# Unit teaching and homework — Grade 10 Unit 1

## Learner flow

The Grade 10 curriculum's expanded Unit card offers **Saya Owl Teaching** above its existing six self-study cards. `/class?grade=10&unit=1&start=true` loads the next unfinished section, rather than a completed daily assignment. Both paths preserve the original textbooks and existing practice routes.

Teaching order is Reading → Vocabulary → Grammar → Listening → Speaking → Writing. Students can select a section or replay a completed one. Reading keeps its exact `teacher-v2` lesson and audio identities; the new course reads the existing account progress. Sixteen-step audio buffers advance within a section after a server progress read confirms the previous block saved. There is no one-class-per-day gate in this flow. The old daily-plan endpoint remains for compatibility but is no longer the `/class` entry point.

Reading comprehension appears only after all 64 Reading teaching steps. Other sections expose their guided activities after their own teaching steps. Learners explicitly save drafts or finish activities. Completion means teaching and practice participation, not exam mastery. Listening and Speaking practice acknowledgement is self-reported, not proctored or pronunciation-graded.

## Content and approval

`src/data/classroom/grade10-unit1-skills.json` adds teacher-authored explanations and examples grounded in the existing `textbookUnit1.json` sections. The original files are unchanged.

- Vocabulary: all twelve country/nationality/language rows, adjective roles and sentence use.
- Grammar: apposition, identification, noun/verb reasoning, transformations and punctuation.
- Listening: original `/audio/unit1.mp3`, names, numbers and ordering strategies. Unverified exact recording answers are explicitly not invented.
- Speaking: textbook language-learning interview, spoken rehearsal and a partner report. No recording/transcription or pronunciation scoring is claimed.
- Writing: Japan task, brainstorm → outline → sentence construction → 7–10 sentence draft → revision.

New scripts start unpublished. In **Admin → `/teaching-setup` → Grade 10 → Unit 1 → each section**, review the complete scripts and approve the exact hash. This does not bulk-generate audio. Students never see generation/approval controls. Existing Reading approval is reused unchanged. Audio is generated on first demand only for approved canonical scripts, and reused through the existing private shared cache and unique claims. Paid generation was not invoked during development tests.

Other units and Grade 11 keep their original self-study experiences. They do not acquire paid automatic teaching or false completion statuses through this change. Their source catalog and admin preparation remain available for the next rollout.

## Account data and security

Migration `0009_unit_teaching_and_homework` expands only the explicit lesson publication/progress allowlist, adds `unit_section_learning` and `unit_homework`, and adds `save_unit_section`. Existing progress/publications/audio/daily records are retained.

Both tables have RLS with authenticated own-row SELECT. Browsers cannot assign homework, write completion or execute the completion RPC. The authenticated API derives the caller, canonical lesson/version/hash and step count; it validates activity fields and the writing sentence count. The service-only RPC rechecks active account, published hash and full stored teaching progress under a per-account advisory transaction lock.

A unique homework row is assigned in the same transaction only when all six current published sections have completion records. Repeated completion cannot create duplicate homework. Submitted answers and feedback are private to that account. Draft changes clear previous submission feedback.

Homework initially uses existing `isAnswerMatch` behavior for repository-provided short answers; unmatched responses and writing require review rather than being declared wrong or given a fabricated final grade. An optional **Ask for teacher feedback** action reviews the _stored submitted homework_, never arbitrary client prompts, with the existing AI model/fallback and server credit reservation. It requires the classroom live-AI setting, costs one `check` credit, caps output at 1600 tokens and uses a 60-second deadline without generation retries. Feedback is saved only if the submission has not changed. AI review is advisory; students revise and resubmit. Shared teaching narration does not deduct personal live-AI credits.

`My Progress` links to the current unit and assigned homework. Auth identity keys isolate client state on sign-out/account changes.

## Verification

- Unit tests: source/cache identity, narration length, rollout boundaries, activity validation, homework matching.
- API tests: authentication, canonical owner/hash/version, draft vs completion, stored-progress rejection, no self-assignment, storage failure and paid-review gates.
- React tests: same-day continuation from existing Reading progress, full-passage comprehension gate, next-skill transition, replay, locked homework, account isolation, admin review controls.
- `node scripts/verify-unit-course.mjs /path/to/pglite/package.json`: disposable PostgreSQL against actual migrations; six same-day section completions, publication/progress/practice gates, idempotent homework, RLS and privilege assertions.
- TypeScript, focused ESLint, production build, and browser smoke for desktop/mobile self-study and class routes.

Live student sign-in and audible provider output still require the owner's authenticated preview session and script approval. Local/browser tests must not be described as a live paid audio/provider test.
