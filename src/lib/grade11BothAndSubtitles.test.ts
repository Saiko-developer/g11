import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import track from "@/data/grade11/videoSubtitles/mOlFrmsOpzU.json";
import {
  activeVideoSubtitle,
  clipVideoSubtitles,
  GRADE11_VIDEO_SUBTITLES,
} from "./grade11VideoSubtitles";
it("preserves every user-supplied marker and derives cue ends only from the next supplied marker", () => {
  const source = readFileSync("src/data/grade11/videoSubtitles/mOlFrmsOpzU.source.txt", "utf8");
  expect(createHash("sha256").update(source).digest("hex")).toBe(track.sourceSha256);
  const rows = [
    ...source.matchAll(/^(\d+):(\d{2})(\d+ (?:minutes?(?:, \d+ seconds?)?|seconds?))(.*)$/gm),
  ];
  expect(rows).toHaveLength(159);
  expect(track.cues).toHaveLength(158);
  rows.slice(0, -1).forEach((row, i) => {
    expect(track.cues[i].start).toBe(Number(row[1]) * 60 + Number(row[2]));
    expect(track.cues[i].end).toBe(Number(rows[i + 1][1]) * 60 + Number(rows[i + 1][2]));
    expect(track.cues[i].en).toBe(row[4].replaceAll("gerand", "gerund"));
    expect(track.cues[i].my.trim().length).toBeGreaterThan(0);
  });
  expect(track.untimedTail.start).toBe(1199);
  expect(track.untimedTail.en).toBe(rows.at(-1)?.[4]);
  expect(track.untimedTail.my).toBeTruthy();
  expect(track.untimedTail).not.toHaveProperty("end");
});
it("switches exactly at the parallel-structure and Both…and chapter markers without a global delay", () => {
  const cues = GRADE11_VIDEO_SUBTITLES.mOlFrmsOpzU;
  expect(() => clipVideoSubtitles(cues, 0)).not.toThrow();
  expect(cues[activeVideoSubtitle(cues, 111)].en).toContain("swimming and to run");
  expect(cues[activeVideoSubtitle(cues, 120)].my).toContain("မမှန်ပါဘူး");
  expect(cues[activeVideoSubtitle(cues, 137)].en).toBe("She likes both swimming and running.");
  expect(cues[activeVideoSubtitle(cues, 190)].en).toBe("starting with both and.");
  expect(cues[activeVideoSubtitle(cues, 299)].my).toContain(
    "She plays both the drums and the piano.",
  );
  expect(cues[activeVideoSubtitle(cues, 306)].en).toContain("Not only but also");
  expect(activeVideoSubtitle(cues, 1199)).toBe(-1);
});
