import bothAnd from "@/data/grade11/videoSubtitles/mOlFrmsOpzU.json";
import beforeAfter from "@/data/grade11/videoSubtitles/TTez4kyqjYU.json";
import mustHaveTo from "@/data/grade11/videoSubtitles/POFfLs0Uaio.json";
import gerunds from "@/data/grade11/videoSubtitles/PhwGtNzdDmc.json";
import infinitives from "@/data/grade11/videoSubtitles/szb4FJHakIk.json";
import tooEnough from "@/data/grade11/videoSubtitles/ethbBja46v4.json";
import inversion from "@/data/grade11/videoSubtitles/aIklwvL605c.json";
import relativePronouns from "@/data/grade11/videoSubtitles/a1oOYN4H5zo.json";
import asIf from "@/data/grade11/videoSubtitles/TItI5ucoZnA.json";
import impersonalPassive from "@/data/grade11/videoSubtitles/MpsrdpUKOTA.json";
import reportedSpeech from "@/data/grade11/videoSubtitles/eplQBhE0-Hg.json";
import future from "@/data/grade11/videoSubtitles/1zWuafmkCJ8.json";
import byMethod from "@/data/grade11/videoSubtitles/HivYxhaER3o.json";
import participles from "@/data/grade11/videoSubtitles/H8E5EF0IEN0.json";
import ability from "@/data/grade11/videoSubtitles/TqES1mwxjpI.json";
import soSuch from "@/data/grade11/videoSubtitles/JUQZxGkRW04.json";
import type { SubtitleLine } from "@/data/unit1VideoSubtitles";
import { UNIT2_GRAMMAR_SUBTITLES } from "@/data/unit2GrammarSubtitles";
import { UNIT7_ACTIVE_PASSIVE_SUBTITLES } from "@/data/unit7ActivePassiveSubtitles";

export const SUPPLIED_GRADE11_SUBTITLE_TRACKS = [
  bothAnd,
  beforeAfter,
  mustHaveTo,
  gerunds,
  infinitives,
  tooEnough,
  inversion,
  relativePronouns,
  asIf,
  impersonalPassive,
  reportedSpeech,
  future,
  byMethod,
  participles,
  ability,
  soSuch,
];

/** Exact video IDs only: never attach a similar topic's translation to another recording. */
export const GRADE11_VIDEO_SUBTITLES: Record<string, readonly SubtitleLine[]> = {
  ...Object.fromEntries(
    SUPPLIED_GRADE11_SUBTITLE_TRACKS.map((track) => [track.videoId, track.cues]),
  ),
  // Source has a backwards 80s marker after 115s, corrupting both adjacent intervals.
  // Leave 115–124s blank until source audio can be checked; do not guess a replacement.
  W3HdjN3cLiM: UNIT2_GRAMMAR_SUBTITLES.filter(
    (cue) => cue.end > cue.start && !(cue.start === 80 && cue.end === 124),
  ),
  fDnXWxXZekw: UNIT7_ACTIVE_PASSIVE_SUBTITLES,
};

export type UntimedVideoSubtitle = Pick<SubtitleLine, "start" | "en" | "my">;
export const GRADE11_VIDEO_SUBTITLE_TAILS: Record<string, UntimedVideoSubtitle> =
  Object.fromEntries(
    SUPPLIED_GRADE11_SUBTITLE_TRACKS.map((track) => [track.videoId, track.untimedTail]),
  );

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
