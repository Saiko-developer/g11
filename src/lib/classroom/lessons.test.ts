import { describe, expect, it } from "vitest";
import grade10 from "@/data/textbookUnit1.json";
import grade11 from "@/data/grade11/textbook/unit1.json";
import { getReadingLesson, readingLessons } from "./lessons";
import { CLASSROOM_STEPS, readingFinished, stepAt } from "./types";

describe("both-grade reading contract", () => {
  it("preserves every original passage sentence, including decimals and embedded questions", () => {
    const g10 = getReadingLesson(10)!;
    const originals10 = grade10.sections[0].reading_passage!.paragraphs.map((p) => p.english_text);
    const originals11 = grade11[0].blocks
      .filter((b) => b.t === "para" && b.area === "lesson")
      .map((b) => b.x.replace(/^\d+\. _+\s*/, ""));
    for (const [lesson, originals] of [
      [g10, originals10],
      [getReadingLesson(11)!, originals11],
    ] as const) {
      originals.forEach((text, i) =>
        expect(
          lesson.segments
            .filter((s) => s.paragraph === i + 1)
            .map((s) => s.english)
            .join(" "),
        ).toBe(text),
      );
      expect(new Set(lesson.segments.map((s) => s.id)).size).toBe(lesson.segments.length);
      lesson.segments.forEach((s) => {
        expect(s.translation).toMatch(/[\u1000-\u109f]/);
        expect(s.explanation).toMatch(/[\u1000-\u109f]/);
        expect(s.reasoning).toMatch(/[\u1000-\u109f]/);
      });
    }
    expect(g10.segments[0].english).toContain('"What is language?" can');
    expect(getReadingLesson(11)!.segments.some((s) => s.english.includes("2.3 metres"))).toBe(true);
  });
  it.each(readingLessons)(
    "teaches $id in sentence order and gates comprehension on all steps",
    (lesson) => {
      expect(CLASSROOM_STEPS.map((_, i) => stepAt(lesson, i).step)).toEqual([
        "english",
        "translation",
        "explanation",
        "reasoning",
      ]);
      expect(stepAt(lesson, 4).segment.id).toBe(lesson.segments[1].id);
      const all = Array.from({ length: lesson.segments.length * 4 }, (_, i) => i);
      expect(readingFinished(lesson, all)).toBe(true);
      expect(readingFinished(lesson, all.slice(1))).toBe(false);
      expect(
        readingFinished(
          lesson,
          all.map(() => 0),
        ),
      ).toBe(false);
    },
  );
  it("rejects unsupported grade values", () => {
    expect(getReadingLesson(12)).toBeNull();
    expect(getReadingLesson("10x")).toBeNull();
  });
});
