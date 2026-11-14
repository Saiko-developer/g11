# AI classroom: rule-first grammar and point-first writing

## Scope

This update changes **AI Teaching Classroom only**, following the owner's approved full teaching samples. Self-study pages, their explanation/audio players, textbook files, exercise keys, grammar source files, video lessons and tutor popups remain unchanged.

There are 48 canonical classroom lessons: Grade 10 and Grade 11, Units 1–12, Grammar and Writing. Open `/class`, choose the grade and unit, and choose Grammar or Writing. Grade 10 Unit 1 remains part of its six-section course and homework flow; the other lessons save section teaching progress without pretending that the entire unit or other skills are complete.

## Teaching content

Grammar starts with the topic's meaning, purpose and foundations. Rule structure, conditions, exceptions, punctuation/agreement and common confusion precede application. Existing reference rules are copied into `grammar-rule-foundations.json`, without old oral narration, model-answer transformations or quiz answers. `prepare-classroom-method-foundations.mjs --check` checks these 24 reference sets against unchanged source files. Unit 1 apposition has an independently authored four-part full lesson covering noun phrases, shared referents, purpose/position, identifying vs extra information, comma boundaries, agreement and recognition.

Writing uses 24 task-specific profiles. Each teaches title/task/genre/reader/length → interpreting and grouping points → planning → grammatical choices and reasons → independent draft/revision. It does not supply complete answer sentences or a finished paragraph and then explain them. Profiles distinguish paragraph, story, description, expository/argumentative/cause-effect/problem-solution essay, travelogue, review, complaint letter, email, reply and summary. They preserve the source task's actual length where available rather than applying Unit 1's 7–10 sentences everywhere.

Some Grade 11 tasks depend on original scan-only notes, letters or prompts. The classroom explicitly directs the learner to read those notes; it does not fabricate their contents or claim a verified transcription. In particular Grade 11 Units 7 and 12 retain this boundary. Existing self-study source pages stay available.

## Retiring scripts safely

The superseded **classroom** `grammar` and `writing` entries have been deleted from `grade10-unit1-skills.json`; Vocabulary, Listening and Speaking entries are unchanged. New lessons use versions `rule-first-v1` and `point-first-v1`, revision `teacher-method-v2`. Superseded private audio/progress/publication records are historical data and are not deleted. The current API resolves only the new classroom scripts, and the new identities prevent stale narration or completion from being reused. Reading's `teacher-v2` script/cache identity is unchanged.

## Playback, review and cost

All 48 lessons reuse the existing authenticated classroom endpoint, private narration cache, unique generation claims, buffered audio playback, pause/repeat/previous/next/manual controls and account bookmarks. Text/provider limits are checked for every clip; long rule explanations split without truncation. Boards show short notes rather than full spoken paragraphs. Full scripts are available in collapsed details.

Admin → Teaching Setup → grade → unit → Grammar/Writing exposes the complete new script and exact-hash approval. Old approvals do not publish new scripts. No bulk paid generation or automatic publication occurs during development; approved narration is prepared on first use and shared. Live questions keep account credit limits and now receive the approved grammar/writing teaching policy. Classroom homework feedback remains draft-based and must not write the assignment for the learner.

Migration `0010_classroom_grammar_writing_methods` expands the explicit supported lesson-ID boundary to both grades' Grammar/Writing Units 1–12. It keeps progress writes and section completion RPCs service-only, preserves RLS and adjusts Unit 1 completion's expected new script versions. It adds no tables, changes no authentication and deletes no learner records. The 20-clip narration quota is not reintroduced.

## Verification

- Content tests cover all 48 identities, valid routing, clip bounds, version/cache changes, deletion of superseded classroom entries, task-specific writing and scan limitations.
- API tests retain authenticated owner/canonical content/publication/credit gates; unsupported grades/units remain rejected.
- PostgreSQL checks exercise actual migrations, all-six-section homework gating, same-day continuation, role/RLS isolation, new versions and supported/unsupported lesson IDs.
- Component/browser checks exercise classroom selection and progressive teaching on desktop/mobile and confirm original self-study routes remain available.
- Full test suite, TypeScript, focused ESLint, source-reference drift check and production build.

Development verification does not claim that every new narration has been generated or listened to. Owner review and an authenticated preview voice test remain necessary before publishing each new lesson.

Writing narration and supporting boards were subsequently revised to `point-first-v2` / `writing-teacher-v3`; see [writing-classroom-teaching.md](./writing-classroom-teaching.md) for the current Writing behavior and migration. Grammar remains on the version described above.
