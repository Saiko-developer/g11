import type { ReadingLesson } from "./types";
/** Explicit rollout boundary: future lessons must not acquire paid generation implicitly. */
export function onDemandReadingPilot(lesson: ReadingLesson) {
  return (
    lesson.grade === 10 &&
    lesson.unit === 1 &&
    ((lesson.section &&
      ["vocabulary", "grammar", "listening", "speaking", "writing"].includes(lesson.section) &&
      lesson.id === `g10-u1-${lesson.section}` &&
      lesson.version === "unit-teacher-v1" &&
      lesson.teachingRevision === "unit-teacher-v1") ||
      (lesson.id === "g10-u1-reading" &&
        lesson.version === "teacher-v2" &&
        lesson.teachingRevision === "myanmar-teacher-v2"))
  );
}
