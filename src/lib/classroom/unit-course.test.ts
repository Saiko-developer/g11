import { expect, it } from "vitest";
import {
  UNIT_SKILLS,
  getUnitLesson,
  resolveClassroomLesson,
  validUnitActivity,
  gradeUnitHomework,
} from "./unit-course";
import { getReadingLesson } from "./lessons";
import { spokenStepAt } from "./types";
import { onDemandReadingPilot } from "./pilot";
it("preserves the exact Reading identity, scripts and cache namespace", () => {
  expect(getUnitLesson(10, 1, "reading")).toBe(getReadingLesson(10));
  expect(resolveClassroomLesson(11, "g10-u1-grammar")).toBeNull();
  expect(resolveClassroomLesson(10, "g10-u2-grammar")?.unit).toBe(2);
  expect(getUnitLesson(10, 2, "grammar")?.section).toBe("grammar");
  expect(getUnitLesson(11, 1, "reading")).toBeNull();
});
it("bounds rollout and narration to canonical, non-empty, TTS-sized Unit 1 scripts", () => {
  const lengths = [64, 12, 16, 8, 12, 16];
  UNIT_SKILLS.forEach((skill, index) => {
    const lesson = getUnitLesson(10, 1, skill)!;
    expect(lesson.segments.length * 4).toBe(lengths[index]);
    expect(onDemandReadingPilot(lesson)).toBeTruthy();
    for (let cursor = 0; cursor < lengths[index]; cursor++) {
      const text = spokenStepAt(lesson, cursor).narration;
      expect(text.trim().length).toBeGreaterThan(10);
      expect(text.length).toBeLessThanOrEqual(3500);
    }
  });
  expect(
    onDemandReadingPilot({ ...getUnitLesson(10, 1, "grammar")!, id: "g10-u2-grammar" }),
  ).toBeFalsy();
});
it("requires activities, audio/speaking practice acknowledgement and a 7–10 sentence writing draft", () => {
  expect(validUnitActivity("grammar", {}, false)).toBe(false);
  expect(
    validUnitActivity(
      "listening",
      { l1: "English, French", l2: "English, French, Chinese" },
      false,
    ),
  ).toBe(false);
  expect(
    validUnitActivity("listening", { l1: "English, French", l2: "English, French, Chinese" }, true),
  ).toBe(true);
  const w1 = "Opening, location, language, exports, conclusion";
  const sentence = "Japan is an island nation in the north Pacific Ocean.";
  expect(validUnitActivity("writing", { w1, w2: Array(6).fill(sentence).join(" ") }, false)).toBe(
    false,
  );
  expect(validUnitActivity("writing", { w1, w2: Array(7).fill(sentence).join(" ") }, false)).toBe(
    true,
  );
  expect(validUnitActivity("writing", { w1, w2: Array(11).fill(sentence).join(" ") }, false)).toBe(
    false,
  );
});
it("marks unmatched and open-ended homework for review instead of inventing a final grade", () => {
  const result = gradeUnitHomework({
    h1: "Listening, speaking, reading and writing.",
    h2: "productive",
    h3: "French",
    h4: "a musician",
    h5: "different but potentially valid",
    h6: "A paragraph",
  });
  expect(result.matched).toBe(4);
  expect(result.items.find((x) => x.id === "h5")?.status).toBe("review_required");
  expect(result.items.find((x) => x.id === "h6")?.status).toBe("review_required");
});
