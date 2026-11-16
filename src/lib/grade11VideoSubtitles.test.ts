import { expect, it } from "vitest";
import {
  activeVideoSubtitle,
  clipVideoSubtitles,
  GRADE11_VIDEO_SUBTITLES,
} from "./grade11VideoSubtitles";
it("only reuses exact video-ID tracks with valid, ordered, non-overlapping timestamps", () => {
  expect(Object.keys(GRADE11_VIDEO_SUBTITLES)).toHaveLength(10);
  for (const track of Object.values(GRADE11_VIDEO_SUBTITLES)) {
    expect(() => clipVideoSubtitles(track, 0)).not.toThrow();
    expect(track.length).toBeGreaterThan(0);
  }
  expect(GRADE11_VIDEO_SUBTITLES.mOlFrmsOpzU).toHaveLength(158);
});
it("clips against absolute source times without rebasing captions to zero", () => {
  const cues = clipVideoSubtitles(GRADE11_VIDEO_SUBTITLES.W3HdjN3cLiM, 34, 606);
  expect(cues[0].start).toBe(34);
  expect(cues.at(-1)?.end).toBe(606);
  expect(cues.every((c) => c.start >= 34 && c.end <= 606)).toBe(true);
  expect(activeVideoSubtitle(cues, 0)).toBe(-1);
  expect(activeVideoSubtitle(cues, 34)).toBe(0);
  expect(activeVideoSubtitle(cues, 606)).toBe(-1);
  expect(activeVideoSubtitle(cues, 115)).toBe(-1);
  expect(activeVideoSubtitle(cues, 123)).toBe(-1);
  expect(cues.some((cue) => cue.start === 80 && cue.end === 124)).toBe(false);
});
it("clears captions in gaps, at exact end boundaries and when seeking backwards", () => {
  const cues = [
    { start: 10, end: 12, en: "", my: "က" },
    { start: 14, end: 16, en: "", my: "ခ" },
  ];
  expect(activeVideoSubtitle(cues, 11.999)).toBe(0);
  expect(activeVideoSubtitle(cues, 12)).toBe(-1);
  expect(activeVideoSubtitle(cues, 13)).toBe(-1);
  expect(activeVideoSubtitle(cues, 14)).toBe(1);
  expect(activeVideoSubtitle(cues, 10)).toBe(0);
  expect(activeVideoSubtitle(cues, 16)).toBe(-1);
});
it("rejects guessed invalid or overlapping timing instead of presenting it as synchronized", () => {
  expect(() => clipVideoSubtitles([{ start: 10, end: 8, en: "", my: "က" }], 0)).toThrow();
  expect(() =>
    clipVideoSubtitles(
      [
        { start: 0, end: 2, en: "", my: "က" },
        { start: 1, end: 3, en: "", my: "ခ" },
      ],
      0,
    ),
  ).toThrow();
});
