import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import narration from "@/data/classroom/writing-teacher-narration.json";
import profiles from "@/data/classroom/writing-teaching-profiles.json";
import canonicalHashes from "./fixtures/canonical-lessons-before-grammar-board.json";
import { getMethodLesson, methodLessons } from "./method-lessons";
import { spokenStepAt } from "./types";
import { writingBoardCue } from "./writing-board";

it("teaches all 24 tasks with their authored contextual openings, never spoken UI stage headings", () => {
  for (const lesson of methodLessons.filter((l) => l.section === "writing")) {
    const t = narration.find((t) => t.grade === lesson.grade && t.unit === lesson.unit)!;
    const clips = Array.from({ length: 16 }, (_, cursor) => spokenStepAt(lesson, cursor).narration);
    const text = clips.join(" ");
    expect(clips.slice(0, 2).join(" ")).toBe(t.opening);
    for (const heading of ["Writing ·", "Thinking from points", "Choose grammar", "Your draft →"])
      expect(text).not.toContain(heading);
    // Splitting never drops an authored sentence or a task's grammar explanation.
    for (const paragraph of Object.values(t).filter(
      (value): value is string => typeof value === "string",
    ))
      expect(text).toContain(paragraph);
    const profile = profiles.find((p) => p.grade === lesson.grade && p.unit === lesson.unit)!;
    for (const rule of profile.grammar) expect(text).toContain(rule);
    expect(text).toContain(profile.task);
    expect(lesson.version).toBe("point-first-v2");
    expect(lesson.teachingRevision).toBe("writing-teacher-v3");
    expect(createHash("sha256").update(JSON.stringify(lesson)).digest("hex")).not.toBe(
      canonicalHashes[lesson.id as keyof typeof canonicalHashes],
    );
    for (let cursor = 0; cursor < 16; cursor++) {
      const cue = writingBoardCue(lesson, cursor);
      expect(cue.items.length).toBeGreaterThan(0);
      for (const term of cue.terms) expect(clips[cursor]).toContain(term);
      for (const item of cue.items) expect(item.note.length).toBeLessThan(230);
    }
  }
});
it("keeps paragraph, essay, letter and unavailable-source constraints specific to the task", () => {
  const full = (unit: number, grade = 10) => {
    const lesson = getMethodLesson(grade, unit, "writing")!;
    return Array.from({ length: 16 }, (_, i) => spokenStepAt(lesson, i).narration).join(" ");
  };
  expect(full(1)).toContain("7–10 sentence paragraph");
  expect(full(1)).toContain("essay အပိုဒ်များစွာ ခွဲရေးဖို့ မလိုဘူး");
  expect(full(10)).toContain("formal complaint letter");
  expect(full(8, 11)).toContain("about 100 words");
  expect(full(7, 11)).toContain("notes စာသားအပြည့် အတည်ပြုထားတာ မရှိ");
  expect(full(9, 11)).toContain("original letter");
  expect(full(12, 11)).toContain("မူရင်း scan");
  expect(full(1)).not.toContain("Japan is an island nation.");
});
