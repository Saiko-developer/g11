export const CLASSROOM_STEPS = ["english", "translation", "explanation", "reasoning"] as const;
export type ClassroomStep = (typeof CLASSROOM_STEPS)[number];
export type ReadingSegment = {
  id: string;
  paragraph: number;
  source: string;
  english: string;
  translation: string;
  explanation: string;
  reasoning: string;
};
export type ReadingLesson = {
  id: string;
  grade: 10 | 11;
  unit: 1;
  version: string;
  title: string;
  review: "draft";
  segments: ReadingSegment[];
  questions: { id: string; question: string; answer: string }[];
};
export type ClassroomProgress = {
  cursor: number;
  offset: number;
  completed: number[];
  revision: number;
};
export const emptyProgress = (): ClassroomProgress => ({
  cursor: 0,
  offset: 0,
  completed: [],
  revision: 0,
});
export function stepAt(lesson: ReadingLesson, cursor: number) {
  const index = Math.max(0, Math.min(lesson.segments.length * 4 - 1, cursor));
  const segment = lesson.segments[Math.floor(index / 4)];
  const step = CLASSROOM_STEPS[index % 4];
  return { segment, step, text: segment[step] };
}
export function readingFinished(lesson: ReadingLesson, completed: number[]) {
  const done = new Set(completed);
  return Array.from({ length: lesson.segments.length * 4 }, (_, i) => i).every((i) => done.has(i));
}
