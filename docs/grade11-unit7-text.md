# Grade 11 Unit 7: text-first self-study

## Source and coverage

Visually reviewed the retained local original images `public/grade11/upper/page-76.jpg` through `page-84.jpg`, printed textbook pages 71–79. `unit7-text.json` holds the transcription, Burmese teaching translations and per-block source-page references. `unit7.json` retains its existing shape, source URLs and stable task IDs. The scans remain committed as evidence, but Unit 7 no longer renders a textbook scan pane.

Coverage matches the original response counts: Reading 18 (3 pre-reading, 5 organ functions after the printed eye example, 10 comprehension); Vocabulary 14 contextual two-choice questions; Grammar 22 (12 passive, 10 impersonal passive); Listening 10; Speaking 5 (4 notes, 1 presentation); Writing 1 composition. The passage includes all 16 paragraphs plus the heart, kidneys and liver headings. The homonym definition, six introductory word meanings, all 28 exercise options, passive rules/examples, impersonal explanation/formula/examples, the worked Exercise B example, the four-category speaking language table, and Thuta's writing notes are included.

Two source details matter:

- Grammar B9 says **1,000 people** in the scan. The old 4,000 transcription and its answer/translation are corrected to 1,000.
- The middle phrase of Vocabulary question 1 is faded in the source. The sentence uses a normalized reading and displays a Burmese transcription note. The target word `organ` and both answer options are clear. No claim is made that this faded phrase is an exact verified transcription.

The textbook's original figures and health notes are preserved as educational source material. No new medical facts or fixed composition word limit are invented.

## Components and checking

`Grade11UpperLesson` routes Unit 7 to `Grade11Unit7Lesson`; Units 8–12 retain the existing scan workspaces. The new view reuses the existing grammar text/oral explanation, grammar videos, per-question answer controls, semantic AI checker, source-answer matcher, study-note cards and original audio player.

- Pre-reading: per-question AI checks.
- Reading A/B: independent semantic Check Answer and source-derived suggested Reveal answers. Opinion question B10 has guidance rather than one supposedly correct opinion. The printed eye → to see example is retained.
- Vocabulary: full bilingual context/definitions, highlighted target, single-choice radios and local Check/Reveal.
- Grammar: all 22 existing controls and translations, plus the complete original lesson text. Existing natural Burmese text/oral coaching already covers the two textbook topics and is reused; its scripts/cache identity are unchanged. The corrected B9 response comes from `grammarExerciseSupport.json`.
- Listening: local Check/Reveal uses recording-derived suggestions with audio SHA-256 and transcript cue references. Question 7 paraphrases the recording and accepts mentioned/recommended/suggested; these are not presented as an official published answer key.
- Speaking: original questions, four groups of useful language, direct Burmese and checks on the learner's own responses.
- Writing: the original task and Thuta's six note groups, direct Burmese, a word counter without a made-up target, a retained draft and the existing AI writing review.

Full-sentence/personal/writing checks still use the existing authenticated AI-credit flow. Local vocabulary/listening checking and source reveals do not call a paid model. Stable sessionStorage keys `grade11:unit7:<skill>:drafts:v1` and original task IDs preserve saved drafts.

`grade11LessonContext` now uses the new Unit 7 source transcription, including actual vocabulary sentences/options and writing notes, instead of relying on damaged OCR. It supplies source text only, not hidden answers. The curriculum generator indexes the new transcription and its hashes; Unit 7 reports text coverage while the remaining scan-only units remain distinguished.

## Verification

Source/coverage tests verify all original task counts, the 16 passage paragraphs, translations, source files, recording identity/evidence and the corrected grammar question. Component tests exercise per-question checks/reveals, the real AI-check request payload with a mocked provider, radio checking, the 22 grammar controls, writing/speaking notes and draft restoration. Existing upper-unit/grammar/audio-cache regression checks preserve other units.

`scripts/verify-grade11-unit7-browser.mjs` checks all six real Unit 7 routes on desktop/mobile, no textbook scan UI, local checks/reveals, grammar text/oral controls and the original recording link. It does not generate paid narration, make a live AI conversation or write hosted student data. No database migration or authentication change is required.

Final validation passed: 664 tests across 86 files, TypeScript, focused ESLint, Prettier, production build and all six Unit 7 browser views. The desktop passage uses a header-safe sticky offset. The existing grammar narration was not regenerated, and no paid live AI check, database operation or deployment was performed during this work.
