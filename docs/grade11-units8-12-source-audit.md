# Grade 11 Units 8–12: complete text lesson conversion

## Scope and source evidence

All six skills in Units 8–12 now render textbook text, bilingual study translations and interactive exercises, like Unit 7. **No textbook scan is rendered or linked as the lesson UI.** Original scans and audio remain in the repository as evidence; they were not deleted.

Compared content with `public/grade11/upper/page-N.jpg` and existing cropped skill sources. This is the source edition supplied in this repository, not a separately authenticated edition or official answer key.

| Unit | Title | PDF pages inspected | Printed pages | Response fields |
|---|---|---|---|---|
| 8 | The Last Leaf | 86–98 | 81–93 | 102 |
| 9 | Stress, and How to Beat It | 100–107 | 95–102 | 60 |
| 10 | Sleep Deprivation | 111–118 | 106–113 | 80 |
| 11 | Dreams | 120–129 | 115–124 | 101 |
| 12 | Natural Disasters | 131–142 | 126–137 | 144 |

487 response fields across 30 skill routes. Source text lives in `upper-lesson-text.json`; word banks, matching labels and supplementary notes in `upper-study-support.json`; original exercise IDs remain in `unitN.json`. Burmese is an authored study translation. No raw OCR was substituted for reviewed visible lesson text.

## Text coverage

- **Reading:** full adapted Last Leaf story with all three parts, O. Henry attribution and glossary; the complete stress passage and seven methods; the entire sleep passage with original six cloze blanks and text equivalents of illustration labels; full Dreams passage and all eight quotations/attributions; complete Natural Disasters passage. Original reference words `He`/`so`, relevant source-line references, paragraph-four sleep-effects reference, and disaster vocabulary highlights remain readable.
- **Vocabulary:** original make/do explanations/examples; confused-word definitions and breath/breathe examples; compound adjective definitions/examples and both matching columns; all reporting-verb definitions/examples, ten degree-adverb definitions and their original examples; disaster words, phrasal-verb explanation/examples and the complete a–l meaning bank. Existing exercises remain interactive.
- **Grammar:** original reported-speech rules, tense/modal/time/place charts, question/command rules and worked transformations; will/going-to/future-continuous rules and printed examples; by + V-ing and participle functions/examples; emphasis and So/Neither rules/examples; can/could possibility/ability charts and so/such result rules/examples. Existing approved teacher text/oral explanations and individual grammar checks remain. Underlined emphasis targets in 11C stay highlighted.
- **Listening:** original instructions/questions/choices, complete printed 8D dialogue retaining blanks, original MP3s and caption player. No replacement audio or invented listening lesson.
- **Speaking:** full 8D model dialogue/character notes; full 9D advice dialogue, language table D and four problem choices; 10D interview/reporting expressions; 11D dream-job/comparison language; 12D experience/response language. Original activities and existing shadowing/unit-level AI roleplay remain available.
- **Writing:** complete 8E summary definition/six-step guidance/transitions; full Hsu Latt letter in 9E; 10E/11E original tasks and all planning questions; complete numbered 12E sample problem-solution essay, functions bank, language guidance, original teenage-parent topic and supplied starter. The sample is identified as textbook material, not generated student work. Original word targets remain: about 100 (8E), no invented target (9E/10E), about 200 (11E), 200–250 (12E).

## Recovered and corrected exercise data

- **10A Exercise B:** restored three printed columns—Irregular sleep patterns, Medical problems, Others. Previously there were only two response fields, with the first/third ideas merged. Preserved IDs `10-causes-1`/`-2`, added `-3`.
- **11B Exercise A:** restored all eight questions. The old five-row data replaced original questions 4/5 with content from 7/8. Corrected Ko Ko/scientists rows 4/5 and their keys, then added 6–8. No duplicate/substituted questions remain.
- **9A Exercise B #10:** restored final `it` after the blank.
- **10B Exercise B #4:** restored `often`.
- Full a–f phrases (10A), a–h quotation meanings (11A), a–l phrasal-verb meanings (12B), a–j writing functions and nine numbered statements (12E) are available as text. Stored letter values remain stable.
- Printed worked examples are retained without incorrectly counting them as extra student responses.

Existing `grade11:unitN:skill:drafts:v1` keys and task IDs are preserved. Drafts for corrected 11B 4/5 are retained, but should be reviewed because the earlier prompts were wrong.

## Checking, UI and AI context

- Closed keyed work checks locally with Check/Reveal. Full-sentence reading, open speaking/planning responses and writing drafts use the existing authenticated semantic checker per question. Paraphrases are not compared only against literal sentences. Source-derived suggestions are labeled; personal/opinion work has no fabricated fixed key.
- Listening suggestions remain separate in `upper-listening-answers.json`, tied to original MP3 SHA-256 and existing caption cue IDs. Reveal shows evidence/time and labels machine-transcript-derived study suggestions, not official publisher answers.
- One translation toggle per textbook article, direct bilingual notes, exercise jump links, larger writing areas, word counts, responsive cards and a sticky reading passage replace the scan pane/repeated translation controls.
- AI reference uses manually transcribed English plus the actual banks/notes, not damaged OCR. Hidden answer keys are excluded. No paid checker request occurs on loading a lesson, selecting a choice or revealing a local answer.
- Curriculum inventory identifies all 30 converted skills as text and hashes both new source files. This is preparation metadata, not approval/publication of new AI classroom scripts.

## Source quirks and verification limits

- Preserve printed quirks rather than silently rewriting textbook material: `a progress` (8B), `railroad tract` (9B), the hoping example’s `(d)` label (10C), and the sample essay’s reference to the environment (12E).
- 12B forms #11 has a mismatch between `to see him again` and the supplied phrasal-verb bank. It remains unkeyed with a visible note. #1 permits different tense interpretations and retains contextual review. Ten unambiguous forms check locally.
- 10D #3 asks about weekdays, whereas the recording explicitly mentions weekends; it remains unkeyed with a visible note. 12D #3’s “only Bogalay” restriction is not established by the recording; the suggestion is NOT MENTIONED, without substituting general geography knowledge.
- Listening captions are machine transcriptions and can misrecognize words. Suggestions carry evidence and are not claimed as official answers. Live paid AI and microphone/provider responses require a signed-in account and are not verified by offline tests.
- No authentication, database, credit/quota, deployment or approved oral-script changes. Existing Grade 10 and Grade 11 Units 1–7 remain on their established renderers.

## Validation

Content tests verify source files/page coverage, every skill’s bilingual text, story ending/source examples/sample essay anchors, recovered tasks/IDs, matching labels, context size, recording hashes/cue references and draft restoration. UI tests enforce no textbook images in every section and test reading highlights/translation visibility. Browser script checks all 30 routes at desktop/mobile widths, source articles, no textbook images, checking/reveals, MP3 source, writing draft restoration, mobile overflow, page errors and no automatic paid checker requests.

Browser runner: `scripts/verify-grade11-units8-12-browser.mjs <path-to-playwright-package.json> [origin]`.

Verified final state: 686 tests passed across 87 files; TypeScript and focused ESLint passed; production build passed. All 30 desktop/mobile browser routes passed, including no rendered textbook images, no page errors, no mobile overflow and no automatic paid checker calls. Live paid AI/microphone checks were not run.
