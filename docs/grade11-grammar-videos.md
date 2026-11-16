# Grade 11 grammar videos

The separate Grade 11 catalog (`src/data/grade11/grammarVideos.json`) now configures supplementary English-language lessons for all twelve units. It uses the existing Grade 10 topic-tab/responsive-player pattern. Existing textbook material, exercises, approved classroom narration, Grade 10 video configuration and subtitles are unchanged. New videos do not claim synchronized Burmese transcripts that have not been authored/reviewed.

Unit 1 Both…and uses the user-selected `mOlFrmsOpzU`. Its title was checked on YouTube; channel attribution is deliberately omitted because the accessible page did not expose a reliable author field.

## Short present-tense lessons

- Present Simple / Present Continuous: existing Grade 10 Arnel lesson `W3HdjN3cLiM`, 00:34–10:06 (9:32). Boundaries follow the existing Grade 10 subtitle source: structures at 34 seconds, summary at 576/590 seconds, future-time material begins at 606 seconds.
- Present Perfect Simple / Continuous: Lucy course `IaslvsYxFVU`, 11:00–20:29 (9:29). These are the publisher's chapter boundaries. The earlier proposed 01:45 entry is the general perfect-tenses chapter, not all four present tenses.

Player URLs use YouTube's native `start` and absolute `end` parameters. No video is downloaded, edited or re-uploaded. The short duration is displayed; an external YouTube link remains available. Switching chapters remounts the player even for the same video ID, and changing units resets the selected topic. YouTube controls can still seek elsewhere; this is a bounded embed rather than a newly created standalone clip.

## Topic coverage notes

The lessons are grammar support, not Myanmar textbook answer videos. Unit 6's gerund video is explicitly marked as preposition/gerund foundations rather than claiming a dedicated Without+V-ing lesson. Unit 5's inversion excerpt is 10:03–11:58; its source description explicitly identifies Here/There/place expressions, avoiding a mismatch with negative-adverb inversion. Unit 11's So/Neither excerpt is 03:01–05:22 in the same Jennifer lesson. No unsupported channel label was added to the user-selected video.

Sources include the YouTube descriptions linked in the catalog, the official Oxford Online English emphasis lesson (`https://www.oxfordonlineenglish.com/adding-emphasis-in-english`), and Arnel's official So/Such lesson (`https://arnelseverydayenglish.com/so-such/`). Catalog links were researched before implementation. Actual playback/embedding permission can vary by YouTube availability and region; local browser checks verify rendering, navigation and bounded iframe URLs, not streamed playback.

## Myanmar subtitle integration

Grade 11 now has a source-clock subtitle player for the exact existing Grade 10 recordings `W3HdjN3cLiM` (Unit 2 Simple/Continuous) and `fDnXWxXZekw` (Unit 7 Passive). The Grade 10 player, translations, timestamps and configuration are unchanged. Tracks are bundled and reused without per-student translation/API calls.

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

There are 22 topic entries / 20 unique YouTube recordings in the catalog. Only two recordings have reusable timed Myanmar tracks in the repository. The remaining 18 recordings, including Both…and and Lucy's Present Perfect excerpt, still require source timed English captions and a checked Myanmar translation. They show an explicit subtitle-unavailable note rather than unrelated or fabricated captions. This change is the player and the two available tracks, not a claim that every Grade 11 video now has a new translated transcript. Source `.srt` / `.vtt` files are needed to complete those tracks reliably.

Verification covers cue boundaries/gaps, absolute-time clipping, backwards seeks, pause behavior, transcript seeking, clip end, stale callback cleanup, loader timeout/retry and exact-video matching. Browser checks use a controlled YouTube clock; live media playback and word-level listening verification remain unverified.
