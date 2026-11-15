# Popup Saya Owl: response reliability and teaching

## Changes

Both `/api/chat-home` and `/api/chat` opt into an 8-second primary-provider first-content deadline when a Gemini backup is configured. A stalled connection or an opened stream with no generated content is cancelled and switches to the backup once. The timer stops when content begins; partial answers are never replayed. Other model callers keep their existing behavior. Voice replies have a 45-second generation deadline and typed replies 60 seconds, replacing the previous 90-second allowance. These are upper bounds, not promised response times.

Gemini 3 fallback calls request low thinking effort and suppress thought output using the installed Google provider's supported options; older configured models keep their defaults. Existing model IDs and provider order are retained. The old teacher-illness/credit-exhaustion stream messages are replaced with a service/retry message. Account authentication, suspension checks, credit reservation and quota enforcement are retained.

Grade 10 popup now uses the same bounded transcription/speech request helper and lifecycle cancellation already used for Grade 11. Both grades stop on chat errors, allow restart, show text when speech fails and discard cancelled turns. Three speculative Grade 10 filler-audio generations and its old three-attempt TTS retry chain were removed. Speech chunks use the existing Grade 11 sentence-group thresholds in both grades; no fixed filler audio must finish before teaching begins.

## Teaching behavior

A shared policy supplements the existing grade-specific source/reference and response-format policies:

- Start with the student's actual difficulty and a useful teaching point, without reading a title or repeating a greeting.
- Reading: English sentence, Burmese meaning, contextual explanation and relevant language reasoning before the next sentence.
- Grammar: rule, meaning, usage and reasons for choices before transformations; contrast a confusing alternative when useful.
- Writing: interpret the title, develop the supplied points into ideas/reasons, choose an outline, then explain grammar/connectors and how to develop paragraphs. Supply a full essay only when explicitly requested.
- Vocabulary: contextual meaning, collocation, word form and a meaningful example.
- Listening: use provided evidence without inventing unheard audio.
- Speaking: one conversational turn and learner response, followed by a specific correction.

The existing voice/UI envelope and note markers are retained. Textbook data, self-study exercises, approved classroom scripts, audio hashes and stored narration are untouched. No database operations or migrations are included.

## Verification and limits

Targeted tests cover stalled connections and stalled stream preludes, timer cleanup after first content, one fallback without replay, caller cancellation, both grade policies, Grade 10 visible error/restart without filler requests, existing Grade 11 voice recovery and suspended-account denial before paid calls. Type checking, lint, the full regression suite and a production build must pass before push.

Live Google/Lovable credentials and a signed-in preview session are unavailable in the workspace. The previous generic popup message alone does not establish which provider failed. Automated tests verify request handling and policy delivery, not generated teaching quality or live latency.

Manual acceptance: on Grade 10 and 11 ask why a grammar rule applies, ask how to develop an essay from textbook points, ask about a specific reading sentence, interrupt/close a voice reply, and retry after a service failure. Check that the answer addresses the selected source, explains reasons naturally in Burmese, starts with substance, preserves the student's own writing work and does not continue cancelled audio. Record real time to first text/audio and any remaining server error before claiming live resolution.

Validation completed: all 739 tests in 93 files passed; TypeScript, focused ESLint, `git diff --check` and the production build passed. The build retains its existing large-chunk advisory.
