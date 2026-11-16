import type { SubtitleLine } from "@/data/unit1VideoSubtitles";
import { UNIT2_GRAMMAR_SUBTITLES } from "@/data/unit2GrammarSubtitles";
import { UNIT7_ACTIVE_PASSIVE_SUBTITLES } from "@/data/unit7ActivePassiveSubtitles";

/** Exact video IDs only: never attach a similar topic's translation to another recording. */
export const GRADE11_VIDEO_SUBTITLES: Record<string, readonly SubtitleLine[]> = {
  // Source has a backwards 80s marker after 115s, corrupting both adjacent intervals.
  // Leave 115–124s blank until source audio can be checked; do not guess a replacement.
  W3HdjN3cLiM: UNIT2_GRAMMAR_SUBTITLES.filter(
    (cue) => cue.end > cue.start && !(cue.start === 80 && cue.end === 124),
  ),
  fDnXWxXZekw: UNIT7_ACTIVE_PASSIVE_SUBTITLES,
};

export function clipVideoSubtitles(
  subtitles: readonly SubtitleLine[],
  start: number,
  end = Infinity,
): SubtitleLine[] {
  let previousEnd = -Infinity;
  for (const cue of subtitles) {
    if (
      !Number.isFinite(cue.start) ||
      !Number.isFinite(cue.end) ||
      cue.start < 0 ||
      cue.end <= cue.start ||
      cue.start < previousEnd ||
      !cue.my.trim()
    )
      throw new Error("Invalid or overlapping subtitle timestamps");
    previousEnd = cue.end;
  }
  return subtitles
    .filter((cue) => cue.end > start && cue.start < end)
    .map((cue) => ({ ...cue, start: Math.max(start, cue.start), end: Math.min(end, cue.end) }));
}

/** Half-open intervals: a cue ends exactly at end; gaps never hold the preceding sentence. */
export function activeVideoSubtitle(cues: readonly SubtitleLine[], time: number): number {
  return cues.findIndex((cue) => time >= cue.start && time < cue.end);
}
