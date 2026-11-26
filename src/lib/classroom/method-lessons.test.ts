import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import oldRemainingScripts from "@/data/classroom/grade10-unit1-skills.json";
import profiles from "@/data/classroom/writing-teaching-profiles.json";
import originalScripts from "./fixtures/grade10-grammar-unsplit-sha256.json";
import { getMethodLesson, methodLessons } from "./method-lessons";
import { getUnitLesson, resolveClassroomLesson } from "./unit-course";
import { onDemandReadingPilot } from "./pilot";
import { spokenStepAt } from "./types";
import { lessonHash } from "./manifest.server";
import { classroomAudioIdentity } from "./audio.server";
import { splitGrade10GrammarClips } from "./grammar-clip-split";
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
  expect(writing.version).toBe("point-first-v2");
  expect(grammar.segments).toHaveLength(4);
  expect(writing.segments).toHaveLength(4);
  const text = grammar.segments.map((s) => s.translation + s.explanation + s.reasoning).join(" ");
  expect(text).toContain("identifying");
  expect(text).toContain("agreement");
  expect(text).toContain("comma");
  expect(text.indexOf("noun phrase")).toBeLessThan(text.indexOf("ဝါကျနှစ်ကြောင်း ပေါင်းခိုင်း"));
});
it("keeps the original Grade 10 grammar narration word for word across the split clips", () => {
  const encoder = new TextEncoder();
  for (const [unit, originalHash] of Object.entries(originalScripts)) {
    const lesson = getMethodLesson(10, Number(unit), "grammar")!;
    const clips = Array.from(
      { length: lesson.segments.length * 4 },
      (_, cursor) => spokenStepAt(lesson, cursor).narration,
    );
    expect(createHash("sha256").update(clips.join("")).digest("hex")).toBe(originalHash);
    expect(clips.every((clip) => clip.trim() && encoder.encode(clip).length <= 650)).toBe(true);
  }
});
it("reuses an unchanged clip's audio identity even when a long earlier step moves its cursor", async () => {
  const lesson = getMethodLesson(10, 1, "grammar")!;
  const segment = {
    ...lesson.segments[0],
    translation: "စာကြောင်းကို အရင်ဖတ်ကြည့်ပါ။ ".repeat(22),
    reasoning: "ဒီအချက်ကို ပြန်စဉ်းစားပါ။",
  };
  const before = { ...lesson, segments: [segment] };
  const after = {
    ...before,
    version: "rule-first-split-v2",
    segments: splitGrade10GrammarClips(before.segments, before.version),
  };
  const moved = await classroomAudioIdentity(after, after.segments.length * 4 - 1);
  expect(moved).toEqual(await classroomAudioIdentity(before, 3));
});
it("keeps Writing about thinking, point grouping and grammatical choices rather than ready-written answers", () => {
  for (const lesson of methodLessons.filter((l) => l.section === "writing")) {
    const text = lesson.segments.map((s) => s.translation + s.explanation + s.reasoning).join(" ");
    expect(lesson.segments).toHaveLength(4);
    expect(text).toMatch(/subject|clause|tense|present|past/);
    expect(text).toMatch(/ဖြစ်လို့|အတွက်|ကြောင့်/);
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
