# Grade 11 textbook completeness review

## Source and scope

Compared the existing Grade 11 curriculum with the three user-supplied scanned PDFs (pages 1–48, 49–96 and 97–144). The source manifest is `src/data/grade11/textbook/source-coverage.json`: it records all 144 PDF pages, source-file hashes, page-image hashes, original printed page numbers and retained evidence URLs. All pages were rendered/OCRed; new supplements and flagged differences were inspected visually. OCR is supporting evidence, not an authoritative transcription or a publisher answer key. This review does not certify every faded character as legible.

The 12 units retain all six existing skill destinations. Four Reviews and four Poems are now accessible from the Grade 11 explorer and direct routes. No Grade 10 content, authentication, database records, approved teaching scripts or audio caches were replaced. Full-page source evidence images are retained separately; supplements display readable text rather than scans. New source JPGs are not included in the PWA's precache glob.

## Confirmed gaps and corrections

| Area | Source page (PDF / printed) | Change |
| --- | --- | --- |
| Review 2 | 73 / 68 | Added both exercises, 20 questions, complete word bank and source-derived suggested answers. |
| Poem 2, Cloud Zoo | 74 / 69 | Added 18 lines, glossary, all 10 response tasks, original worked example and four-line writing activity. |
| Review 3 | 108 / 103 | Added three exercises, 20 questions, emphasis targets and suggested transformations. Ambiguous future-tense responses allow alternatives. |
| Poem 3, Leisure | 109 / 104 | Added 14 lines, glossary, all 15 response tasks and five writing situations; cropped task wording carries an explicit source note. |
| Review 4 | 143 / 138 | Added both exercises, 20 questions, two-answer item A6 and emphasized rewrite targets. |
| Poem 4, Stopping by Woods on a Snowy Evening | 144 / 139 | Added all 16 lines (including the repeated final line), glossary, all 14 response tasks and four-line creative task/clues. |
| Unit 1 Grammar D7 | 13 / 8 | Replaced a duplicated speech example with the original assignment/submission question and matching answer. |
| Unit 1 Writing | 15 / 10 | Recovered legible threat and conservation/release facts; marked unreadable middle text rather than inventing it. |
| Unit 3 Vocabulary B6 | 32 / 27 | Restored “the job he is doing”. |
| Unit 8 Writing | 98 / 93 | Restored the full summary introduction and missing steps heading. |
| Unit 12 Grammar | 136 / 131 | Restored the “so little time” example. |
| Exam passage retrieval | Units 7–12 | Fixed the array-only reader to also read these units' existing structured text; all 12 units now supply seen-passage text. |

Existing Review 1 and Bridges content is reused. Revision context now includes full poem text, examples and question labels, which also lets the existing popup question resolver identify the intended exercise without exposing hidden answer keys.

## UI and answer behavior

- Reusable text layouts for all reviews/poems, responsive poem/glossary columns, word-bank chips, highlighted transformation targets, bilingual directions and short source notes.
- Individual Check/Reveal controls. Closed known answers are checked locally. Suggested/open answers reuse the existing semantic checker; paraphrases are not rejected solely because they differ from a suggested answer.
- Creative/personal work has no invented fixed answer. Creative verse shows the requested line count and offers explicit AI review rather than an automatic generation call.
- Drafts survive navigation within the same browser session. This is not a new cloud learning-record system or a mastery score.
- No automatic paid AI calls when opening supplements or checking a recognized local answer. Authenticated semantic review retains the existing server authorization/credit rules.

## Source limitations requiring a clearer original for exact wording

1. PDF page 15: middle words in the tortoise threat/conservation facts are faded. Visible text is retained with `[source text unclear]`.
2. PDF page 32: Vocabulary B8 wording is faded. Retained the previously supplied “laboratory” wording; did not claim a newly verified transcription.
3. PDF page 79: Unit 7 Vocabulary item 1 has a faded phrase; retained its existing uncertainty note.
4. PDF page 109: the right edge of some Leisure B instructions/examples is cropped. Legible content is retained; explanatory restatements are identified as study support, not verbatim source text.

Burmese translations and new suggested answer keys are authored study support. They are not claimed to be publisher-provided translations/official answer keys. Audio was not regenerated or compared against a newly supplied recording in this task.

## Verification

Coverage tests check 144 source references, all 72 core destinations, all eight supplement routes, question/line/glossary counts, known corrections and all 12 exam passage readers. Component tests check per-question controls, local matching, semantic-check request context, draft restoration, emphasis, source notes and creative line counts. Local browser verification uses placeholder Supabase configuration and blocks paid API calls; it does not certify live authenticated AI/provider availability.

Verification results: all 95 test files / 760 tests pass; TypeScript, lint on changed TS/TSX files, curriculum inventory consistency and production build pass. Browser checks opened all 72 core skill routes and all eight direct supplement routes, checked mobile overflow and runtime exceptions, and exercised local checking/draft restoration. All eight explorer buttons open their supplements. Desktop Review 2 and mobile Poem 4 screenshots were visually inspected. No paid generation calls were made. The first browser supplement attempt tried to edit an answer after revealing it (the existing reveal mode intentionally locks input); the corrected check hid the answer first and passed. Live authenticated semantic AI/provider calls were not exercised.
