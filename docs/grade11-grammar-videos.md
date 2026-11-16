# Grade 11 grammar videos

The separate Grade 11 catalog (`src/data/grade11/grammarVideos.json`) now configures supplementary English-language lessons for all twelve units. It uses the existing Grade 10 topic-tab/responsive-player pattern. Existing textbook material, exercises, approved classroom narration, Grade 10 video configuration and subtitles are unchanged. New videos do not claim synchronized Burmese transcripts that have not been authored/reviewed.

Unit 1 Both…and uses the user-selected `mOlFrmsOpzU`. Its title was checked on YouTube. Channel attribution now follows the user's supplied transcript introduction, “English with M”.

## Short present-tense lessons

- Present Simple / Present Continuous: existing Grade 10 Arnel lesson `W3HdjN3cLiM`, 00:34–10:06 (9:32). Boundaries follow the existing Grade 10 subtitle source: structures at 34 seconds, summary at 576/590 seconds, future-time material begins at 606 seconds.
- Present Perfect Simple / Continuous: Lucy course `IaslvsYxFVU`, 11:00–20:29 (9:29). These are the publisher's chapter boundaries. The earlier proposed 01:45 entry is the general perfect-tenses chapter, not all four present tenses.

Player URLs use YouTube's native `start` and absolute `end` parameters. No video is downloaded, edited or re-uploaded. The short duration is displayed; an external YouTube link remains available. Switching chapters remounts the player even for the same video ID, and changing units resets the selected topic. YouTube controls can still seek elsewhere; this is a bounded embed rather than a newly created standalone clip.

## Topic coverage notes

The lessons are grammar support, not Myanmar textbook answer videos. Unit 6's gerund video is explicitly marked as preposition/gerund foundations rather than claiming a dedicated Without+V-ing lesson. Unit 5's inversion excerpt is 10:03–11:58; its source description explicitly identifies Here/There/place expressions, avoiding a mismatch with negative-adverb inversion. Unit 11's So/Neither excerpt is 03:01–05:22 in the same Jennifer lesson. No unsupported channel label was added to the user-selected video.

Sources include the YouTube descriptions linked in the catalog, the official Oxford Online English emphasis lesson (`https://www.oxfordonlineenglish.com/adding-emphasis-in-english`), and Arnel's official So/Such lesson (`https://arnelseverydayenglish.com/so-such/`). Catalog links were researched before implementation. Actual playback/embedding permission can vary by YouTube availability and region; local browser checks verify rendering, navigation and bounded iframe URLs, not streamed playback.

## Myanmar subtitle integration

Grade 11 now has a source-clock subtitle player for the exact existing Grade 10 recordings `W3HdjN3cLiM` (Unit 2 Simple/Continuous) and `fDnXWxXZekw` (Unit 7 Passive), plus sixteen user-supplied translated recordings listed below. Grade 10 translations, timestamps and video selection are unchanged. Both grades load without autoplay. The shared Grade 10 player explicitly pauses on ready; Grade 11 uses a native paused embed as described below. Tracks are bundled and reused without per-student translation/API calls.

Timing behavior:
- Native YouTube clock sampled every 100ms; no simulated playback timer and no blanket 0.5-second delay.
- Each cue is shown only in its half-open `[start,end)` interval. It disappears during source gaps and at its end.
- Start/end clipping retains absolute source timestamps. A 34-second video start does not rebase captions to zero.
- Pause/buffering retain the source clock. Backward seeks recompute the active cue; transcript clicks seek to the clipped source time and wait for actual playback time before showing the target cue.
- Native clip-end parameter plus a pause guard prevents playing past the configured end. Player/timers are destroyed on topic changes/unmount.
- Network/API/player failures have a retry state and the existing direct YouTube link. Old callbacks cannot restart a failed or unmounted player.

### Source timing issue

The existing Simple/Continuous source has a backwards marker at 80 seconds after the 115-second entry. This makes the 115→80 interval invalid and the following 80→124 interval overlap earlier material. Grade 11 omits both damaged cues and leaves 115–124 seconds blank, instead of guessing a replacement timestamp. Grade 10 source files are retained byte-for-byte. Remaining retained cues are reused with their existing timings; they have not been independently re-audited against live audio in this task.

### Remaining content work

There are 22 topic entries / 20 unique YouTube recordings in the catalog. Eighteen recordings now have timed Myanmar tracks. The remaining two recordings (Lucy's Unit 2 Present Perfect excerpt and Unit 11's cleft-sentence video) still require source timed English captions and a checked Myanmar translation. They show an explicit subtitle-unavailable note rather than unrelated or fabricated captions. Source `.srt` / `.vtt` files are needed to complete those tracks reliably.

Verification covers cue boundaries/gaps, absolute-time clipping, backwards seeks, pause behavior, transcript seeking, clip end, stale callback cleanup, loader timeout/retry and exact-video matching. Browser checks use a controlled YouTube clock; live media playback and word-level listening verification remain unverified.


### Unit 1 Both…and: user-supplied transcript

The exact original upload is preserved as `src/data/grade11/videoSubtitles/mOlFrmsOpzU.source.txt`, SHA-256 `9ca1486bf6039cdddb23e7504a3029761b107c71b86d347a614c47068c51024a`. Its 159 markers are strictly increasing from 00:00 to 19:59. Redundant copy/paste formatting such as `0:099 seconds` is parsed as 00:09; numeric timestamps are not shifted or interpolated.

The corresponding JSON contains 158 bounded English/Myanmar cues and a translated final tail starting at 19:59. Each bounded end is exactly the next supplied start. The tail has no invented end: the player appends it only after YouTube's actual `getDuration()` returns a duration beyond 19:59. If metadata is unavailable, the tail is not presented as a timed caption. Full-video mode remains available; the transcript includes all correlative-conjunction sections, not just Both…and.

The original ASR spelling `gerand` is normalized to `gerund` in displayed English. The original file is untouched. At 16:13 the source's example says `consultant`, then its explanation says `consultants`; the original example is retained without guessing an unheard correction. Myanmar translation preserves the grammar meaning; timestamps remain source-based, not independently corrected through live audio listening.

Source-integrity tests compare every bounded timestamp and English cue with the original upload, check Myanmar coverage and chapter transitions, and exercise tail metadata arriving late. Existing subtitle/player tests continue to cover pause, backwards seek, gaps and cleanup.


### Seven additional user-supplied transcripts

All seven uploads are preserved byte-for-byte in `src/data/grade11/videoSubtitles/<videoId>.source.txt`. Each corresponding JSON records its SHA-256, every original English marker, Myanmar translation, and an open-ended final cue resolved from actual YouTube duration. Source-integrity tests compare every start/end and English string with the uploaded source. No global subtitle delay, rebasing, interpolation or word-level precision is invented.

| Topic | Video ID | Supplied markers | Reused views |
| --- | --- | ---: | --- |
| Before / After / While | TTez4kyqjYU | 86 | Unit 1 |
| Must / Have to / Should | POFfLs0Uaio | 90 | Unit 2 |
| Gerund functions | PhwGtNzdDmc | 58 | Units 3 and 6 |
| To-infinitives (user's second gerund file) | szb4FJHakIk | 47 | Unit 3 |
| Too / Enough | ethbBja46v4 | 42 | Unit 4 |
| Subject–verb inversion | aIklwvL605c | 108 | Units 5 and 11 |
| Relative pronouns / omission | a1oOYN4H5zo | 55 | Unit 5 |

There are 486 new source markers: 479 cues ending at the next source marker and seven final cues whose ends remain runtime metadata. Nonspoken chapter headings and copied `Sync to video time` UI footers are retained in source evidence but not spoken captions. English is preserved as supplied, including ASR artifacts. Myanmar renders obvious spoken punctuation naturally. On-screen examples not spoken in the transcript are not invented.

Two excerpt boundaries now follow supplied markers rather than earlier approximate chapter metadata:
- Unit 5 full-verb inversion: 10:03–11:57 (603–717 seconds). The `Here goes nothing` transition begins at 717 and is excluded.
- Unit 11 So/Neither: 2:55–5:22 (175–322 seconds), retaining the complete supplied introduction to `so`.

The gerund video's classification of some -ing constructions is its own terminology. The translation preserves its lesson meaning; it does not replace textbook rules or existing exercises. Existing Grade 10 subtitles and classroom audio/scripts are unchanged.

Seven-topic browser checks also exercise the two reused topic views, absolute source-clock captions, mobile width, transcript visibility, source video IDs and Unit 5 clip boundaries. The clock is controlled for verification; live video/audio alignment remains unverified.


### Eight further transcripts and manual playback

Six further uploaded files and two inline user-message transcripts add eight tracks, with 503 supplied start markers in total. Uploaded originals are copied unchanged; inline excerpts are normalized to human-readable timestamp/text pairs and identified by `sourceFormat: inline-human-time`. Their English wording and timestamps follow the message. Every JSON records the hash of its corresponding retained evidence file.

| Topic | Video ID | Markers | View |
| --- | --- | ---: | --- |
| As if / As though | TItI5ucoZnA | 9 | Unit 6 |
| Impersonal passive | MpsrdpUKOTA | 57 | Unit 7 |
| Reported speech | eplQBhE0-Hg | 60 | Unit 8 |
| Future simple / continuous | 1zWuafmkCJ8 | 154 | Unit 9 |
| By | HivYxhaER3o | 72 | Unit 10 |
| Participle clauses | H8E5EF0IEN0 | 25 | Unit 10 |
| Can / Could | TqES1mwxjpI | 69 | Unit 12 |
| So / Such … that | JUQZxGkRW04 | 57 | Unit 12 |

The By upload begins at 00:16: its opening 16 seconds remain uncaptained rather than inventing missing text or shifting the source time. Participle clauses begin at the supplied 1-second marker. Nonspoken headings/`Sync to video time` footers are excluded from cues. The eight final cues use actual YouTube duration, with no guessed end. Translations retain the lesson meaning and source timing; English ASR artifacts remain in evidence. These examples support textbook learning and do not replace textbook rules or exercises.

Manual playback is explicit for both grades: `autoplay=0` for plain iframe embeds and API players. Grade 10 additionally pauses on ready. Grade 11's initial clip position is encoded in the native iframe URL; its ready callback no longer pauses or seeks, so it cannot interrupt a student who has already pressed native Play. Page load and topic switching do not call `playVideo()`. Clicking Play or selecting a transcript cue is intentional student interaction; transcript navigation can start playback. All existing Grade 10 caption timing rules remain unchanged.

Regression checks cover both Grade 10 embed paths, Grade 11 initial pause, user-triggered transcript playback, every supplied source marker/translation and all eight new topic views on desktop/mobile. Provider media is mocked during browser checks; live listening verification is still not claimed.


### Playback availability correction

The previous Grade 11 player depended on the caption API to create a video at all and hid the video when that connection failed. It also offered no app-level Play control. The corrected player creates a native YouTube iframe immediately, enables native controls, and attaches subtitle synchronization to that existing iframe when the API is ready. Caption failure leaves the iframe visible and provides a caption retry independently of the direct YouTube link.

Both subtitled and plain Grade 11 videos now have a prominent Play button. For a ready caption player it calls `playVideo()`; before readiness or after caption failure it requests native playback with `autoplay=1` only in the explicit click handler. Initial load and topic changes retain `autoplay=0`. A ready player offers Pause and replays from the selected clip start after its end. Source start/end limits remain intact. The iframe carries the page origin, a standard origin-sending referrer policy and native controls. Its host fills a positioned container with at least 200px height so controls cannot collapse behind percentage-height wrappers.

Regression tests deliberately block the caption API and verify that the native iframe, Play action and direct YouTube action remain present. Browser checks also measure the mobile frame height, test user-triggered Play/Pause, preserve clipped plain-video start/end values and verify source-clock captions. The media itself is a fixture in these checks; actual YouTube network availability is not certified.
