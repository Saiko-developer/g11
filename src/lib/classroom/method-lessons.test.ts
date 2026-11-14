import { expect, it } from "vitest";
import oldRemainingScripts from "@/data/classroom/grade10-unit1-skills.json";
import profiles from "@/data/classroom/writing-teaching-profiles.json";
import { getMethodLesson, methodLessons } from "./method-lessons";
import { getUnitLesson, resolveClassroomLesson } from "./unit-course";
import { onDemandReadingPilot } from "./pilot";
import { spokenStepAt } from "./types";
import { lessonHash } from "./manifest.server";
it("provides 48 distinct canonical classroom lessons for both grades' 12 units", () => {
  expect(methodLessons).toHaveLength(48);
  expect(new Set(methodLessons.map((l) => l.id)).size).toBe(48);
  for (const lesson of methodLessons) {
    expect(resolveClassroomLesson(lesson.grade, lesson.id)).toBe(lesson);
    expect(getUnitLesson(lesson.grade, lesson.unit, lesson.section!)).toBe(lesson);
    expect(onDemandReadingPilot(lesson)).toBe(true);
    expect(resolveClassroomLesson(lesson.grade === 10 ? 11 : 10, lesson.id)).toBeNull();
    for (let cursor = 0; cursor < lesson.segments.length * 4; cursor++) {
      const text = spokenStepAt(lesson, cursor).narration;
      expect(text.trim().length).toBeGreaterThan(10);
      expect(text.length).toBeLessThanOrEqual(3500);
    }
  }
  expect(getMethodLesson(10, 13, "grammar")).toBeNull();
  expect(getMethodLesson(11, 0, "writing")).toBeNull();
  expect(getMethodLesson(10, 2, "reading")).toBeNull();
});
it("deletes the superseded classroom Grammar/Writing scripts and preserves the other four skills", () => {
  expect(Object.keys(oldRemainingScripts).sort()).toEqual(["listening", "speaking", "vocabulary"]);
  const grammar = getMethodLesson(10, 1, "grammar")!,
    writing = getMethodLesson(10, 1, "writing")!;
  expect(grammar.version).toBe("rule-first-v1");
  expect(writing.version).toBe("point-first-v1");
  expect(grammar.segments).toHaveLength(4);
  expect(writing.segments).toHaveLength(4);
  const text = grammar.segments.map((s) => s.translation + s.explanation + s.reasoning).join(" ");
  expect(text).toContain("identifying");
  expect(text).toContain("agreement");
  expect(text).toContain("comma");
  expect(text.indexOf("noun phrase")).toBeLessThan(text.indexOf("ဝါကျနှစ်ကြောင်း ပေါင်းခိုင်း"));
});
it("keeps Writing about thinking, point grouping and grammatical choices rather than ready-written answers", () => {
  for (const lesson of methodLessons.filter((l) => l.section === "writing")) {
    const text = lesson.segments.map((s) => s.translation + s.explanation + s.reasoning).join(" ");
    expect(text).toContain("outline");
    expect(text).toContain("subject");
    expect(text).toContain("ဘာကြောင့်");
    expect(text).toContain("မူကြမ်း");
    expect(text).not.toContain("Japan is an island nation.");
  }
  expect(profiles.find((p) => p.grade === 10 && p.unit === 10)!.task).toContain("letter");
  expect(profiles.find((p) => p.grade === 11 && p.unit === 8)!.task).toContain("100");
  expect(profiles.find((p) => p.grade === 11 && p.unit === 7)!.grammar.join(" ")).toContain("scan");
});
it("changes audio/publication identity when teacher content changes without touching Reading", async () => {
  const lesson = getMethodLesson(10, 1, "grammar")!;
  expect(await lessonHash(lesson)).not.toBe(
    await lessonHash({ ...lesson, version: "unit-teacher-v1" }),
  );
  expect(getUnitLesson(10, 1, "reading")!.version).toBe("teacher-v2");
});
