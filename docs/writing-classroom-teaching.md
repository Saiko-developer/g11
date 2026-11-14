# Writing classroom: contextual teaching

Scope: Grade 10 and 11, Units 1–12, AI classroom Writing only. Self-study files, exercises and answers are unchanged. Grammar and Reading canonical hashes remain covered by the existing regression fixture.

## Teaching

`writing-teacher-narration.json` contains individually authored topic openings, point interpretation, grouping reasons, development, thinking questions, grammar application, drafting and revision. `writing-teaching-profiles.json` retains the textbook task, genre, length, given-point groups and grammar foundations.

The teacher starts inside the subject (for example, explaining Japan to somebody unfamiliar with it), rather than announcing a UI heading. Explanations teach how to arrive at the student's own writing; they do not supply completed English answer sentences or model essays. Letters, summaries, descriptive paragraphs and argumentative essays retain their own requirements. Where the exact source remains scan-only, the teacher explicitly requires the original notes/letter/topic rather than inventing content.

`writing-lessons.ts` splits connected prose only at Burmese sentence boundaries into four cards and 16 consecutive clips. The legacy `english/translation/explanation/reasoning` fields are four consecutive narration slots for this teaching method. Writing headings are presentation only. No additional AI text-generation call is needed to create these scripts.

## Supporting board

`WritingWhiteboard.tsx` displays the actual task, point groups, an outline, concise grammar choices with reasons, and revision checks. The four-part path and local clip counter follow the player's cursor. Highlight anchors are extracted only from the current spoken clip; this is clip synchronization, not word timestamps. The full spoken transcript is collapsed and resets when the clip changes. `writing-board-notes.json` is presentation only and does not change cached speech.

## Version and approval

Writing now uses `point-first-v2` and `writing-teacher-v3`. The publication hash and per-clip audio identity change, so older approved scripts/audio cannot be served as the new teaching. Existing progress and cached audio remain intact; the revised lesson gets separate progress. Other skill identities remain unchanged.

Migration `0012_writing_teacher_style.sql` updates the existing service-only Grade 10 Unit 1 completion guard for the new Writing version, still requiring all 16 steps and exact publication hash. Its six-section homework count checks current skill versions; an old Writing completion cannot prematurely satisfy the new course. Already assigned homework remains intact. No new tables or broader permissions.

After the code syncs, an administrator reviews each revised Writing script under `/admin?panel=teaching`, selects grade → unit → Writing and approves the exact version. This change does not bulk-publish scripts or generate paid narration. Approved audio is prepared on demand using the existing shared cache, half-buffer start and bounded generation claims. There is no daily clip-count quota.

## Verification

- Writing content tests cover all 24 tasks, 16 clips, exact authored prose preservation, topic openings, no spoken UI headings, source constraints and provider text bounds.
- Existing canonical hash regression preserves every non-Writing method/Reading lesson.
- Board integration tests cover stage notes, current-clip highlighting, transcript expansion/reset and another grade's summary task.
- `node scripts/verify-unit-course.mjs /path/to/pglite/package.json` exercises actual migrations, old/new Writing isolation, homework gating, RLS and service-only writes in a disposable database.
- `PLAYWRIGHT_BROWSERS_PATH=... node scripts/verify-writing-board-browser.mjs /path/to/playwright/package.json` checks both classroom players and mobile layouts as a guest without paid TTS.
