# Grade 10 / 11: all-unit classroom preparation

## Scope and current status

The preparation workspace covers 24 units and 144 grade/unit/skill entries. It reuses the existing application and preserves the working Grade 10 Unit 1 Reading classroom. This is a source inventory and teaching blueprint, **not publication of 144 finished AI classes**.

- 99 entries have structured text records; this does not certify complete teaching content.
- 7 entries combine text and scan markers.
- 38 entries require scan-based source review/transcription. Exercise prompts are not treated as reading-passage transcription.
- 24 existing textbook audio files are referenced by 48 Listening/Speaking entries. Presence was checked; audio quality and task alignment are not certified by this inventory.
- Existing answer fields are labelled provided/source-derived or suggested, not automatically verified.
- Only the existing Grade 10 Unit 1 Reading pilot can be approved/started from this workspace. Other entries link to their existing textbook/practice pages and remain in preparation.

## Coverage matrix

T = structured text records; M = mixed text/scan; S = scan-based. All entries still require the appropriate teaching and source review.

### Grade 10

| Unit | Reading | Vocabulary | Grammar | Listening | Speaking | Writing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | T | T | T | T | T | T |
| 2 | T | T | T | T | T | T |
| 3 | T | T | T | T | T | T |
| 4 | T | T | T | T | T | T |
| 5 | T | T | T | T | T | T |
| 6 | T | T | T | T | T | T |
| 7 | T | T | T | T | T | T |
| 8 | T | T | T | T | T | T |
| 9 | T | T | T | T | T | T |
| 10 | T | T | T | T | T | T |
| 11 | T | T | T | T | T | T |
| 12 | T | T | T | T | T | T |

### Grade 11

| Unit | Reading | Vocabulary | Grammar | Listening | Speaking | Writing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | T | T | T | T | T | M |
| 2 | T | T | T | S | S | T |
| 3 | M | M | T | T | T | T |
| 4 | M | T | T | M | M | T |
| 5 | M | T | T | T | T | T |
| 6 | T | T | T | T | T | T |
| 7 | S | S | S | S | S | S |
| 8 | S | S | S | S | S | S |
| 9 | S | S | S | S | S | S |
| 10 | S | S | S | S | S | S |
| 11 | S | S | S | S | S | S |
| 12 | S | S | S | S | S | S |

## How to use the workspace

Open `/teaching-setup` with an existing admin account. Select Grade → Unit → Skill. The source summary, existing lesson link, skill-specific teaching sequence and review checklist follow the selection. Source-file links identify the repository material used. Browsing pending entries does not call a model, generate audio, approve a lesson, change enrollment or write learning progress.

The existing Reading approval/audio controls remain isolated to Grade 10 Unit 1. Other sections do not inherit those controls or reuse a Reading publication hash. Missing/unreviewed teacher scripts are never silently substituted with live AI.

## Source maintenance

Run `node scripts/prepare-classroom-curriculum.mjs` after textbook changes. Run the same command with `--check` to detect drift. Primary JSON files and answer-key files are fingerprinted with SHA-256. The script reads source files and writes only `src/data/classroom/curriculum-inventory.json`; it never rewrites textbook data. Supporting TypeScript modules are identified as reuse candidates, not certified complete teaching packages.

## Shared teaching contract

The six skill blueprints live in `src/lib/classroom/curriculum-catalog.ts`:

- Reading: sentence English → Burmese translation → contextual explanation → vocabulary/grammar reasoning → next sentence; full-passage comprehension last.
- Vocabulary: passage meaning, collocations, usage, word families, grammar and natural examples.
- Grammar: meaning before rule, textbook examples, reasons, transformation, contrasts and guided practice.
- Writing: audience/purpose, brainstorming, outline, sentences, paragraphs, draft feedback and revision.
- Listening: preparation, original textbook recording, main idea, details, source-based checking and transcript review.
- Speaking: situation, models, useful expressions, student turns, role play and evidence-based feedback.

Spoken teaching must remain distinct from concise board notes. Approved narration is shared and cached, prepared before teaching with a bounded worker count and a rolling browser buffer. There is no daily narration clip-count quota. Live questions retain existing user credit/account checks. Formal homework requires completion of the entire unit, not only its Reading section.

## Implementation sequence

Default order: finish Grade 10 Unit 1 remaining skills, then the remaining Grade 10 units, then Grade 11. The catalog supports either grade while authoring; it does not change the student assignment order.

1. **Complete each section’s source packet.** Check transcription, exercise prompts, answer provenance and original audio. For scan/mixed entries, compare the transcription to the image before using it as teaching text. Acceptance: no invented textbook facts or scan placeholders in a published lesson.
2. **Author and review teacher scripts and board cues.** Reuse existing `src/data/grammar/unitN.ts`, supplements, Grade 11 grammar coaching and source-linked activities. Split narration into bounded clips, and keep English/source examples exact. Acceptance: the agreed Myanmar-teacher style is reviewed for the entire section, not only its introduction.
3. **Generalize the current delivery contract.** Extend `src/lib/classroom/types.ts`, `lessons.ts`, `pilot.ts`, `study-plan.ts` and the classroom route to resolve grade/unit/skill manifests. Preserve `g10-u1-reading`/`teacher-v2` and Grade 11 legacy history. Acceptance: any selection resolves one canonical reviewed manifest; clients cannot submit payable teaching text.
4. **Apply additive storage migrations before enabling new delivery.** The current reading publication/progress RPCs allow only the two Unit 1 Reading lesson IDs. New manifests need a server-owned catalog/publication contract, generic versioned section progress, unit-completion gates and homework assignment records. Keep owner-scoped reads and service-only writes; keep grants explicit. Do not blindly remove the existing ID validation or mark a unit complete from client assertions.
5. **Connect assessment and learning memory.** Reuse existing exercise checking and speaking/writing services, but distinguish practice feedback, suggested answers and trusted assessed results. Gate comprehension/homework correctly. Acceptance: questions resume the same lesson position and warming never counts as listening completion.
6. **Verify each release before publication.** Check provider failures, cancellation, cache reuse, cold preparation, Pause/Resume/Repeat, cross-account isolation, narration quality and source fidelity. Browser previews and tests with fake audio do not replace listening to the actual approved narration.

## Validation for this preparation milestone

Tests cover all 144 distinct entries, all 24 unit metadata records, source fingerprints/files, existing Grade 11 route resolution, scan-transcription limitations, admin access, selection changes and isolation of the existing Reading approval path. No hosted schema changes or paid AI generation were performed for this milestone.
