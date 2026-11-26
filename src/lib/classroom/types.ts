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
  leadIn?: string;
  openingNarration?: string;
  closing?: string;
  notes?: string[];
  focus?: string[];
};
export type ReadingLesson = {
  id: string;
  grade: 10 | 11;
  unit: number;
  section?: "vocabulary" | "grammar" | "listening" | "speaking" | "writing";
  version: string;
  title: string;
  review: "draft";
  teachingRevision?: string;
  teachingMethod?: "rule-first" | "point-first";
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

/** Exact narration submitted to TTS. Source English remains unchanged on the board. */
export function spokenStepAt(lesson: ReadingLesson, cursor: number) {
  const result = stepAt(lesson, cursor);
  const { segment, step, text } = result;
  const narration = [
    step === "english" ? segment.leadIn : undefined,
    step === "english" ? (segment.openingNarration ?? text) : text,
    step === "reasoning" ? segment.closing : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { ...result, narration };
}
