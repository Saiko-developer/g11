# Shared AI provider recovery

## Scope

Lovable remains the primary provider. Server-side Google Gemini is the backup when the gateway fails or is not configured. This applies to shared text generation and streaming (chat, tutoring, checking, role-play, classroom scripts, Responses and uploaded-paper marking), speech generation, and transcription. Admin diagnostics deliberately test providers separately.

Speech preserves successful OpenAI voices, including Speaking Practice's explicit `echo` selection. An explicit OpenAI request can now recover through direct Gemini. Classroom Gemini narration keeps its existing voice mapping and PCM-to-WAV handling. Default speech avoids retrying another model on the same gateway after a billing/quota denial.

Text streams recover only before generated content is delivered. Once content has started, a failure ends the stream rather than replaying another answer. Requests cancelled by the user do not trigger another paid provider request.

## Configuration and failure handling

- `LOVABLE_API_KEY`: primary gateway credentials.
- `GEMINI_API_KEY`: independent server-side Google credentials, required for direct recovery.
- `GEMINI_FALLBACK_MODEL`: existing direct text/transcription model override.
- `GEMINI_TTS_MODEL`: existing direct speech model override.

The backup needs its own Google model access, quota and billing configuration. Gateway credits do not transfer to Google. No keys are sent to the browser.

Unavailable speech providers return service-unavailable (503), rather than falsely instructing a student to top up their account. Existing student authentication, account status, credit reservations and session ownership checks still execute before generation. Recovery happens inside the existing operation; it cannot bypass student credit/quota decisions.

Live speech/transcription gateway attempts have a 15-second deadline and direct audio calls a 25-second deadline. Classroom Gemini generation keeps a 60-second gateway allowance before direct recovery, within the existing 100-second classroom operation signal. Caller cancellation is combined with these deadlines.

## Existing data and behavior

No migrations, database operations, textbook edits, script resets or audio regeneration are included. Approved classroom scripts, cache hashes, cached audio and per-hash generation claims remain in place. Shared narration still has no daily clip-count limit. Other account and study-plan policies remain independent.

## Verification

Automated coverage includes provider billing failures, direct-only configuration, early stream error frames, no replay after partial output, cancellation, unavailable providers, successful primary voice preservation, cached audio reuse, and authentication/credit/session denials. Existing Grade 10 and Grade 11 regression tests remain part of the full suite.

Admin AI status includes a separate **Gemini အသံ fallback စမ်းမည်** action. It makes one short direct Google speech request only when an authenticated active admin clicks it; automatic text diagnostics do not generate audio. It reports status without exposing keys or returning the generated audio.

Live Google credentials and speech quota cannot be established by mocked tests or a build. The admin speech test and a signed-in Speaking Practice turn are the live acceptance checks after the connected preview receives the commit.

Local validation: 716 tests passed across 92 files; production build passed. Build retains the existing large-chunk advisory.

## Voice failure diagnostics follow-up

The admin speech test now reports the HTTP code, Google status, normalized model ID and a bounded Google error message with credentials and URLs redacted. It distinguishes missing configuration, unavailable models, permissions/billing, exhausted or zero quota, timeout, blocked/no audio and invalid audio. The error text wraps on narrow screens. Students continue to receive a generic service error; provider detail is returned only by the authenticated admin test.

Direct speech normalizes `models/` and `google/` model prefixes and catches failures while reading the response body, including timeout/cancellation. It does not retry quota failures or make additional diagnostic requests automatically. Existing voices, script content, caches and provider order are retained.

This change does not establish which error the live Google project is returning: runtime credentials/logs and a signed-in admin session are unavailable in this workspace. Run the explicit admin speech test after preview sync to obtain that evidence; Google billing, access or quota changes require the Google project owner.

Follow-up validation: all 727 tests in 92 files passed, along with TypeScript, focused ESLint and the production build. Added coverage checks model path normalization, quota/billing/permission classification, credential redaction, body-read timeouts, missing audio, invalid configuration, cancellation and visible admin error details.

## Confirmed audio-only prompt failure

A live admin test returned HTTP 400 `INVALID_ARGUMENT`: “Model tried to generate text, but it should only be used for TTS.” The request had `responseModalities: ["AUDIO"]` but sent a bare greeting/transcript without an explicit speech instruction. Both direct Google and gateway Gemini speech requests now use the same explicit read-aloud, audio-only instruction, preserving the original transcript and preventing lesson questions from being treated as questions to answer. OpenAI speech input, voices and caches are unchanged. No automatic retry was added.

Targeted validation: 46 tests passed, including Burmese greetings, mixed Burmese/English questions, both Gemini request paths, successful OpenAI input preservation, classroom audio and authenticated TTS routes. Live voice success still requires repeating the admin speech test after preview sync.
