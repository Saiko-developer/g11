# Teacher dialogue milestone

This change is built with Codex and ordinary Git commits/pushes. No Lovable AI build or paid generation is required to build or test it.

## Implemented

- The daily classroom keeps the existing sentence sequence: English, Burmese translation, explanation, vocabulary/grammar reasoning.
- Automatic playback is the default. When optional guided checks are enabled, after each sentence's reasoning audio the teacher waits for the learner's acknowledgement. The last step is not recorded as complete until acknowledgement.
- Learners can request a supplementary explanation without a live model call. All sixteen Grade 10 Unit 1 sentences have authored contextual examples; Grade 11 currently reuses its canonical explanations explicitly as text.
- A learner can still interrupt with Ask Teacher. Returning from a question does not bypass an outstanding acknowledgement.
- Same-day review starts at the first step instead of replaying only the last clip. Review preserves existing completed-step records.
- Existing private narration assets, publication hashes, authentication, credits, daily assignments and storage schema are preserved.

## Important limits

This is an incremental classroom interaction improvement, not the completed six-skill classroom. The existing four-sentence daily assignment is unchanged to preserve published lessons and recorded completion IDs. New examples are text only and are not silently narrated using an English browser voice. No new audio was generated, no hosted migrations were applied, and no production deployment was performed.

The next milestone needs a teacher-reviewed complete Unit 1 teaching script, semantic daily objectives, spoken introduction/transitions/recap, cached supplementary narration, and a versioned curriculum plan that keeps old learner history readable. Reading comprehension remains after the full passage; these acknowledgements are self-reported understanding, not comprehension tests or verified grades. Formal homework must remain gated until all unit skills are completed.

## Validation

Component tests exercise automatic playback with four acknowledgement stops, optional guided checks, a free authored explanation, no unsolicited live AI request, completion once, and completed-day replay from cursor zero. Existing classroom tests cover the legacy player. Build/type checks do not establish live audio readiness or validate a teacher's pedagogical approval.
