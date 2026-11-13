# Grade 10 Unit 1: teacher-led Reading script v2

## Scope

Grade 10 Unit 1 **Reading only**, all 16 source sentences. Other units, Grade 11, and the other skills are unchanged. The student's approved dolphin-style example is the teaching model: contextual explanation, grammatical reasons, contrasts, natural examples, and connected transitions, not a translated summary.

`src/data/classroom/grade10-unit1-reading.json` remains the unchanged source-aligned reading material. `grade10-unit1-teacher-script.json` adds the authored teaching script, keyed by the same sentence IDs. It is a review draft, not externally teacher-certified content.

## Normal classroom playback

The shared lesson loader overlays the expanded explanations and reasoning. Normal playback remains:

1. English sentence (with a spoken class introduction at the beginning of each assigned class).
2. Burmese translation.
3. Full contextual Burmese teacher explanation.
4. Vocabulary and grammar reasoning, contrasts and examples; spoken recap at the end of the assigned class.

`spokenStepAt` is the single narration source used by audio preparation, hashing, the daily-room transcript, the legacy player, and the admin review page. These explanations are part of automatic playback, not hidden behind the supplementary-help button. Opening and closing passages are joined into existing first/last clips to preserve the four-step playback coordinates. Publication still binds the complete manifest, but revised narration cache keys bind each clip independently: an edit to one sentence does not regenerate unchanged clips. Grade 11 retains its original hash scheme.

Each exact narration string is under the speech service's 3500-character limit; preparation rejects an oversized string before claiming a paid generation slot.

## Versions and existing data

Grade 10 uses lesson version `teacher-v2` and plan version `reading-myanmar-teacher-v2`. Existing `pilot-v1` progress, publications, old narration files and `reading-daily-v1` completion rows are left in place. No hosted writes or migrations are needed to install this source change. Existing enrollment and Google authentication are reused. Grade 11 retains its original version and plan.

A separate progress namespace is necessary: the previous audio offset must not be applied to a substantially longer new narration, and listening to the short old explanation does not establish completion of this new class. Learners start the revised course at class 1. Existing global daily completion limits still apply across versions.

The existing four daily ranges are retained in this milestone (16 steps each). A broader semantic curriculum and the other Unit 1 skills are separate future work. Full-passage comprehension is still gated on all 64 steps, and this Reading-only course does not assign formal whole-unit homework.

## Audio activation

Git push installs source; it does **not** produce new audio. Old audio hashes/publications cannot unlock the revised script. No paid generation or Lovable AI builder run was performed to prepare this change.

An existing SQL-verified admin uses `/teaching-setup`, Grade 10, class 1:

- Read the exact spoken text for that class.
- Explicitly acknowledge the existing speech-provider charge before preparing the missing clips.
- Listen to the prepared narration and approve its teaching delivery before publishing.

Repeat audio preparation/review for later classes before students reach them. The shared cap remains 20 new clips per Myanmar day; existing ready clips are reused. There are 64 clips for the complete Reading passage, 16 per assigned class. Preparation stops on failure/cap and keeps successful clips. A cache miss does not trigger paid generation by a student. Storage stays private. The legacy text-only approval endpoint cannot publish `teacher-v2` without the setup's audio-readiness check.

No additional secrets, public buckets, auth changes, migrations or production deployment are introduced. Live interruptions continue to use the existing authenticated, credit-limited Ask Teacher endpoint and currently return text.

## Verification and limits

Tests check source fidelity, the full teaching text passed into TTS, opening/recap inclusion, canonical sentence order, narration length, cache reuse, generation-cap denial, new cache identities after script edits, reuse of unchanged clips after unrelated edits, version-separated history and old-approval rejection. Component tests exercise automatic progression, interruptions and replay.

These checks do not certify actual pronunciation, pacing, provider uptime or classroom quality. Actual audio must still be generated and listened to through the existing authenticated setup; no live audio assets for this revision were produced from this workspace.
