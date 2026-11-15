# Grade 11 Units 2–6 requested self-study changes

## Scope

These changes apply to the requested Grade 11 self-study views. Grade 10, AI classroom teaching scripts, original source scans, Google authentication, payment/credit rules and existing student draft storage keys are preserved.

- Unit 2 Reading: Comprehension translation is direct. Exercise B has independent Check Answer and Reveal Answer controls for all ten questions; no aggregate AI checker. Speaking C groups internet uses and suggested questions in two columns with direct Burmese. Speaking D opens its own AI dialogue practice.
- Unit 3 Reading C: independent Check/Reveal. Vocabulary A: eight bilingual phrasal-verb cards; no scan in the rendered lesson. Vocabulary B questions 6–8 restored from the user's transcription, with source-derived `depends on`, `linked up`, `go through` keys. Original source extraction and scans remain unchanged. Question 6's wording is retained as supplied; `labortary` in question 8 is normalized to `laboratory`. Speaking D practises the original Lin Lin/Thiri dialogue. Writing gets grouped bilingual source notes and prompts.
- Unit 4 Reading A: independent Check/Reveal including guidance for personal responses. Vocabulary uses the shared exercise-card controls and grouped bilingual linking-word notes. Writing planning points use grouped cards with direct translations.
- Unit 5 Reading F: independent Check/Reveal; no aggregate AI check for this exercise.
- Unit 6 Reading A/B: clear capital-city and three-column destination tables, original Shwedagon example, separate country/reason inputs and retained drafts. Vocabulary A directly translates all ten Column B meanings. Listening A has ten independent local Check/Reveal controls backed by the supplied recording. Speaking and Writing notes use direct bilingual groups, removing repeated whole-section/per-line translation buttons.

## Checking behavior

Closed blanks keep local matching through `Grade11SourceAnswer`, so no AI credits are needed for those checks. Full-sentence answers retain the existing authenticated semantic checking API through `Grade11AIReview`, now scoped to a single question and labelled **Check Answer**. This avoids incorrectly rejecting a valid paraphrase by exact string matching; the existing AI usage rules still apply. Reveals show source-derived suggested answers. Personal-response questions show guidance explicitly stating there is no single fixed answer, not a fabricated model answer.

Unit 6 Listening answers come from `listeningCaptions.json`, tied to the SHA-256 of `/grade11/audio/unit6.mp3`. Each answer records its evidence cue. These are recording-derived answers, not an official published answer key.

## AI dialogue integration

`grade11RoleplayExercises.ts` holds the frontend/server exercise allowlist. Unit 2 `2D-18` asks for the learner's actual internet habits and reasons using Exercise C. Unit 3 `3D-33` fills the original Exercise C blanks from verified keys and practises alternate Lin Lin/Thiri turns. Neither returns a finished student dialogue as the exercise answer.

Migration `0013_grade11_unit2_unit3_roleplay.sql` extends only the existing `grade11_speaking_prepare` allowlist. It preserves authentication, active-account checks, ownership, unique pending requests, rate/usage rules, expiry, revisions and private tables. Anonymous callers cannot execute it. No new storage tables or permissions are introduced.

## Verification

- Component tests cover independent controls, local audio checking, translation visibility, preserved writing drafts and exercise-specific AI launchers.
- Server tests verify canonical dialogue context and reject wrong-unit IDs before reserving a session or calling a provider.
- `scripts/verify-grade11-roleplay-exercises.mjs` applies the actual existing speaking SQL and the new migration to a disposable PostgreSQL fixture, checking old/new IDs, caller ownership, private claims and anonymous denial.
- `scripts/verify-grade11-units2to6-browser.mjs` covers 15 requested views, reveal interactions, listening checks, AI launcher presence, mobile page fit and browser errors. It does not generate paid AI, start a speaking call, record a microphone or write student data to the hosted database.

Final validation: TypeScript, focused ESLint, production build, the 15-view browser run, the final Unit 6 Speaking mobile/headings check, and the disposable roleplay migration checks pass. The full regression run passed 651 of 652 tests; the unchanged Unit 1 workspace test exceeded its 5-second timeout under concurrent build load, then its entire four-test file passed in isolation. The final changed exercise/workspace subset passed all 28 tests. Live paid AI conversations and microphone capture were not exercised.
