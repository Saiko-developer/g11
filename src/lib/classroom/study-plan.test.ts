import { expect, it } from "vitest";
import { getReadingLesson } from "./lessons";
import { buildDailyClasses, dailyAssignment, myanmarDay } from "./study-plan";
it.each([10, 11])(
  "Grade %i plan covers every sentence in order, with no gaps or repeats",
  (grade) => {
    const lesson = getReadingLesson(grade)!;
    const classes = buildDailyClasses(lesson);
    expect(classes[0].start).toBe(0);
    expect(classes.at(-1)!.end).toBe(lesson.segments.length * 4);
    classes.forEach((s, i) => {
      expect(s.end - s.start).toBeLessThanOrEqual(16);
      expect(s.start % 4).toBe(0);
      if (i) expect(s.start).toBe(classes[i - 1].end);
    });
  },
);
it("does not skip classes after an absence", () => {
  const p = dailyAssignment(
    getReadingLesson(11)!,
    [{ session_index: 0, completed_on: "2026-01-01" }],
    "2026-11-13",
  );
  expect(p.session.index).toBe(1);
});
it("keeps today's completed class for review, and advances on the next Myanmar day", () => {
  const lesson = getReadingLesson(10)!;
  const history = [{ session_index: 0, completed_on: "2026-11-13" }];
  expect(dailyAssignment(lesson, history, "2026-11-13")).toMatchObject({
    todayDone: true,
    session: { index: 0 },
  });
  expect(dailyAssignment(lesson, history, "2026-11-14")).toMatchObject({
    todayDone: false,
    session: { index: 1 },
  });
});
it("does not fabricate future skill readiness when the prepared reading plan ends", () => {
  const lesson = getReadingLesson(10)!;
  const history = buildDailyClasses(lesson).map((s) => ({
    session_index: s.index,
    completed_on: "2026-11-01",
  }));
  expect(dailyAssignment(lesson, history, "2026-11-13").allDone).toBe(true);
});
it("uses Myanmar day boundaries", () => {
  expect(myanmarDay(new Date("2026-11-13T17:29:59Z"))).toBe("2026-11-13");
  expect(myanmarDay(new Date("2026-11-13T17:30:00Z"))).toBe("2026-11-14");
});
