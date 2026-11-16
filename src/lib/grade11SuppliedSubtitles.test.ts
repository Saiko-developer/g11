import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  SUPPLIED_GRADE11_SUBTITLE_TRACKS,
  GRADE11_VIDEO_SUBTITLES,
  GRADE11_VIDEO_SUBTITLE_TAILS,
  clipVideoSubtitles,
} from "./grade11VideoSubtitles";
import catalog from "@/data/grade11/grammarVideos.json";
const expected: Record<string, number> = {
  mOlFrmsOpzU: 159,
  TTez4kyqjYU: 86,
  POFfLs0Uaio: 90,
  PhwGtNzdDmc: 58,
  szb4FJHakIk: 47,
  ethbBja46v4: 42,
  aIklwvL605c: 108,
  a1oOYN4H5zo: 55,
  TItI5ucoZnA: 9,
  MpsrdpUKOTA: 57,
  "eplQBhE0-Hg": 60,
  "1zWuafmkCJ8": 154,
  HivYxhaER3o: 72,
  H8E5EF0IEN0: 25,
  TqES1mwxjpI: 69,
  JUQZxGkRW04: 57,
};
it.each(SUPPLIED_GRADE11_SUBTITLE_TRACKS)(
  "preserves exact user timestamps and complete translation for $videoId",
  (track) => {
    const source = readFileSync(
      `src/data/grade11/videoSubtitles/${track.videoId}.source.txt`,
      "utf8",
    );
    expect(createHash("sha256").update(source).digest("hex")).toBe(track.sourceSha256);
    const rows =
      "sourceFormat" in track && track.sourceFormat === "inline-human-time"
        ? [...source.matchAll(/^(?:(\d+) minutes?, )?(\d+) seconds\n([^\n]*)/gm)].map((row) => [
            row[0],
            row[1] ?? "0",
            String(Number(row[2])).padStart(2, "0"),
            "",
            row[3],
          ])
        : [
            ...source.matchAll(
              /^(\d+):(\d{2})(\d+ (?:minutes?(?:, \d+ seconds?)?|seconds?))(.*)$/gm,
            ),
          ];
    expect(rows).toHaveLength(expected[track.videoId]);
    expect(track.cues).toHaveLength(rows.length - 1);
    rows.slice(0, -1).forEach((row, i) => {
      const cue = track.cues[i];
      expect(cue.start).toBe(Number(row[1]) * 60 + Number(row[2]));
      expect(cue.end).toBe(Number(rows[i + 1][1]) * 60 + Number(rows[i + 1][2]));
      expect(cue.en).toBe(
        track.videoId === "mOlFrmsOpzU" ? row[4].replaceAll("gerand", "gerund") : row[4],
      );
      expect(cue.my.trim().length).toBeGreaterThan(0);
    });
    expect(track.untimedTail.start).toBe(Number(rows.at(-1)?.[1]) * 60 + Number(rows.at(-1)?.[2]));
    expect(track.untimedTail.en).toBe(rows.at(-1)?.[4]);
    expect(track.untimedTail.my).toBeTruthy();
    expect(track.untimedTail).not.toHaveProperty("end");
    expect(GRADE11_VIDEO_SUBTITLE_TAILS[track.videoId]).toBe(track.untimedTail);
    expect(() => clipVideoSubtitles(GRADE11_VIDEO_SUBTITLES[track.videoId], 0)).not.toThrow();
  },
);
it("keeps Unit 5's clip inside its supplied topic boundary and reuses the exact same inversion source for Unit 11", () => {
  expect(catalog[5][0]).toMatchObject({ start: 603, end: 717 });
  const inversion = clipVideoSubtitles(GRADE11_VIDEO_SUBTITLES.aIklwvL605c, 603, 717);
  expect(inversion[0].en).toContain('"Here," "there,"');
  expect(inversion.at(-1)?.en).toContain("There goes my bus");
  expect(inversion.some((cue) => cue.en.includes("Here goes nothing"))).toBe(false);
  expect(catalog[11][1]).toMatchObject({ start: 175, end: 322 });
  const additions = clipVideoSubtitles(GRADE11_VIDEO_SUBTITLES.aIklwvL605c, 175, 322);
  expect(additions[0].en).toContain('We can use "so"');
  expect(additions.at(-1)?.en).toContain("Anne Hathaway");
});
it("has tracks for all supplied topics including Unit 6's reused gerund lesson", () => {
  for (const n of [1, 3, 4, 5])
    for (const v of catalog[String(n) as keyof typeof catalog])
      expect(GRADE11_VIDEO_SUBTITLES[new URL(v.url).searchParams.get("v")!]).toBeDefined();
  expect(GRADE11_VIDEO_SUBTITLES[new URL(catalog[2][2].url).searchParams.get("v")!]).toBeDefined();
  expect(GRADE11_VIDEO_SUBTITLES[new URL(catalog[6][0].url).searchParams.get("v")!]).toBe(
    GRADE11_VIDEO_SUBTITLES.PhwGtNzdDmc,
  );
});
