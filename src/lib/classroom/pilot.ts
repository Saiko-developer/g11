import type { ReadingLesson } from "./types";
/** Explicit rollout boundary: future lessons must not acquire paid generation implicitly. */
export function onDemandReadingPilot(lesson: ReadingLesson) {
  return (
    lesson.id === "g10-u1-reading" &&
    lesson.grade === 10 &&
    lesson.unit === 1 &&
    lesson.version === "teacher-v2" &&
    lesson.teachingRevision === "myanmar-teacher-v2"
  );
}
