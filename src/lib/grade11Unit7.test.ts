import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { expect, it } from "vitest";
import { UNIT7_TEXT, unit7Reference } from "./grade11Unit7";
import { UPPER_UNITS } from "./grade11Upper";
import captions from "@/data/grade11/listeningCaptions.json";
import support from "@/data/grade11/grammarExerciseSupport.json";
import { grade11LessonContext } from "./grade11LessonContext";
it("retains every original Unit 7 response and all nine local source pages", () => {
  expect(UNIT7_TEXT.source.pdfPages).toEqual([76, 77, 78, 79, 80, 81, 82, 83, 84]);
  for (const n of UNIT7_TEXT.source.pdfPages)
    expect(existsSync(`public/grade11/upper/page-${n}.jpg`)).toBe(true);
  expect(
    Object.values(UPPER_UNITS[7].skills).map((s) =>
      s.groups.reduce((n, g) => n + g.items.length, 0),
    ),
  ).toEqual([18, 14, 22, 10, 5, 1]);
  expect(UNIT7_TEXT.reading.filter((b) => b.t === "para")).toHaveLength(16);
  for (const section of [
    UNIT7_TEXT.reading,
    UNIT7_TEXT.grammar,
    UNIT7_TEXT.vocabularyNotes,
    UNIT7_TEXT.speaking,
    UNIT7_TEXT.writing,
  ])
    for (const b of section) {
      expect(b.x.length).toBeGreaterThan(0);
      expect(b.my.length).toBeGreaterThan(0);
      expect(b.sourcePage).toBeGreaterThanOrEqual(76);
      expect(b.sourcePage).toBeLessThanOrEqual(84);
    }
});
it("binds each of the ten listening answers to the supplied recording and transcript evidence", () => {
  const hash = createHash("sha256")
    .update(readFileSync("public/grade11/audio/unit7.mp3"))
    .digest("hex");
  for (const key of Object.values(UNIT7_TEXT.listeningAnswers)) {
    expect(key.audioSha256).toBe(hash);
    expect(key.audioSha256).toBe(captions["7"].audioSha256);
    for (const id of key.evidenceCueIds)
      expect(captions["7"].cues.some((c) => c.id === id)).toBe(true);
  }
});
it("grounds AI context in the complete new text and corrects the original 1,000 in both prompt and answer", () => {
  expect(grade11LessonContext(7, "reading").context).toContain("[Paragraph 16 | source");
  expect(unit7Reference("writing")).toContain("extra fat in liver");
  expect(unit7Reference("writing")).toContain("cut back on sugar and salt");
  expect(grade11LessonContext(7, "vocabulary").questions[0].question).toContain(
    "A piano and an organ",
  );
  expect(grade11LessonContext(7, "vocabulary").context).toContain("a musical instrument");
  expect(unit7Reference("grammar")).toContain("about 1,000 people");
  expect(unit7Reference("grammar")).not.toContain("4,000");
  expect(support.items["7-impersonal-9"].answer).toContain("1,000");
});
