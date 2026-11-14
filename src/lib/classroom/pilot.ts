import { getMethodLesson } from "./method-lessons";
import type { ReadingLesson } from "./types";
/** Explicit rollout boundary: future lessons must not acquire paid generation implicitly. */
export function onDemandReadingPilot(lesson: ReadingLesson) {
  const method = lesson.section ? getMethodLesson(lesson.grade, lesson.unit, lesson.section) : null;
  if (
    method &&
    method.id === lesson.id &&
    method.version === lesson.version &&
    method.teachingRevision === lesson.teachingRevision
  )
    return true;
  return (
    lesson.grade === 10 &&
    lesson.unit === 1 &&
    ((lesson.section &&
      ["vocabulary", "listening", "speaking"].includes(lesson.section) &&
      lesson.id === `g10-u1-${lesson.section}` &&
      lesson.version === "unit-teacher-v1" &&
      lesson.teachingRevision === "unit-teacher-v1") ||
      (lesson.id === "g10-u1-reading" &&
        lesson.version === "teacher-v2" &&
        lesson.teachingRevision === "myanmar-teacher-v2"))
  );
}
