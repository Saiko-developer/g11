import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import canonicalHashes from "./fixtures/canonical-lessons-before-grammar-board.json";
import { grammarBoardCue, grammarFormulaParts } from "./grammar-board";
import { methodLessons, getMethodLesson } from "./method-lessons";
import { readingLessons } from "./lessons";
import { lessonClipCount, stepAt } from "./types";
it("preserves Unit 1 and unrelated canonical lessons while versioning only the new Grade 10 Grammar", () => {
  for (const lesson of [...methodLessons, ...readingLessons].filter(
    (l) => l.section !== "writing",
  )) {
    const hash = createHash("sha256").update(JSON.stringify(lesson)).digest("hex");
    const original = canonicalHashes[lesson.id as keyof typeof canonicalHashes];
    if (lesson.grade === 10 && lesson.unit > 1 && lesson.section === "grammar") {
      expect(hash).not.toBe(original);
      expect(lesson.version).toBe("rule-first-split-v3");
    } else {
      expect(hash).toBe(original);
    }
  }
});
it("provides contextual board cues for every clip in all 24 grammar lessons", () => {
  for (const lesson of methodLessons.filter((l) => l.section === "grammar"))
    for (let cursor = 0; cursor < lessonClipCount(lesson); cursor++) {
      const cue = grammarBoardCue(lesson, cursor);
      expect(cue.title.length).toBeGreaterThan(0);
      expect(cue.check.length).toBeGreaterThan(0);
      if (lesson.grade === 10 && lesson.unit === 1) continue;
      const { text } = stepAt(lesson, cursor);
      for (const formula of cue.formulas ?? []) expect(text).toContain(formula);
    }
});
it("changes apposition support to match the actual meaning, example, position, commas and agreement clips", () => {
  const lesson = getMethodLesson(10, 1, "grammar")!;
  expect(grammarBoardCue(lesson, 1).title).toContain("Noun phrase");
  const example = grammarBoardCue(lesson, 5);
  expect(example.example).toBe(true);
  expect(stepAt(lesson, 5).text).toContain(example.parts!.map((p) => p.text).join(""));
  expect(grammarBoardCue(lesson, 6).formulas).toContain("Finland ↔ the land of a thousand lakes");
  expect(grammarBoardCue(lesson, 10).comparison).toHaveLength(2);
  expect(grammarBoardCue(lesson, 11).title).toContain("အစနဲ့အဆုံး");
  expect(grammarBoardCue(lesson, 13).title).toContain("Main subject");
});
it("keeps optional suffixes and bracketed grammatical phrases intact when displaying formula slots", () => {
  expect(grammarFormulaParts("[Subject] + [Verb (+s/es)] + [Rest]")).toEqual([
    "[Subject]",
    "+",
    "[Verb (+s/es)]",
    "+",
    "[Rest]",
  ]);
  expect(grammarFormulaParts("Noun A ↔ Noun phrase B")).toEqual(["Noun A", "↔", "Noun phrase B"]);
});
