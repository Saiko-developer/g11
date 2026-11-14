import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  curriculumInventory,
  curriculumSection,
  teachingUnits,
  teachingBlueprints,
  TEACHING_SKILLS,
} from "./curriculum-catalog";
import { getGrade11Lesson } from "@/lib/grade11Navigation";
it("prepares exactly 24 units and all 144 distinct grade/unit/skill sections", () => {
  expect(curriculumInventory).toHaveLength(144);
  expect(new Set(curriculumInventory.map((s) => s.id)).size).toBe(144);
  for (const grade of [10, 11] as const) {
    expect(teachingUnits(grade)).toHaveLength(12);
    for (let unit = 1; unit <= 12; unit++)
      for (const skill of TEACHING_SKILLS) {
        const section = curriculumSection(grade, unit, skill)!;
        expect(section).not.toBeNull();
        expect(section.topic.length).toBeGreaterThan(0);
        expect(teachingBlueprints[skill].flow.length).toBeGreaterThan(0);
        if (grade === 11) expect(getGrade11Lesson(String(unit), skill)).not.toBeNull();
      }
  }
  expect(curriculumSection(10, 13, "reading")).toBeNull();
});
it("binds inventory to real unchanged files and preserves scan/transcription limitations", () => {
  for (const section of curriculumInventory) {
    for (const source of section.sourceFiles) {
      expect(existsSync(source.path)).toBe(true);
      expect(createHash("sha256").update(readFileSync(source.path)).digest("hex")).toBe(
        source.sha256,
      );
    }
    section.supportFiles.forEach((file) => expect(existsSync(file)).toBe(true));
    if (section.audio) expect(existsSync(section.audio.path)).toBe(true);
  }
  expect(curriculumSection(11, 7, "reading")!.sourceFormat).toBe("scan");
  expect(curriculumSection(11, 7, "reading")!.lessonTextBlocks).toBe(0);
  expect(curriculumSection(11, 7, "reading")!.scanPages.length).toBeGreaterThan(0);
  expect(
    curriculumInventory.filter((s) => s.classroomDelivery === "current-pilot").map((s) => s.id),
  ).toEqual(["g10-u1-reading"]);
});
