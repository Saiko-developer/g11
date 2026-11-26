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
  splitAudio?: { originalVersion: string; parts: Record<number, string[]> };
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
export function lessonClipCount(lesson: ReadingLesson) {
  return (
    lesson.segments.length * CLASSROOM_STEPS.length +
    Object.values(lesson.splitAudio?.parts ?? {}).reduce(
      (extra, parts) => extra + parts.length - 1,
      0,
    )
  );
}

export function stepAt(lesson: ReadingLesson, cursor: number) {
  let originalCursor = Math.max(0, Math.min(lessonClipCount(lesson) - 1, cursor));
  let partIndex = 0;
  for (const [original, parts] of Object.entries(lesson.splitAudio?.parts ?? {})) {
    const start = Number(original);
    if (originalCursor < start) break;
    if (originalCursor < start + parts.length) {
      partIndex = originalCursor - start;
      originalCursor = start;
      break;
    }
    originalCursor -= parts.length - 1;
  }
  const segmentIndex = Math.floor(originalCursor / CLASSROOM_STEPS.length);
  const segment = lesson.segments[segmentIndex];
  const stage = originalCursor % CLASSROOM_STEPS.length;
  const step = CLASSROOM_STEPS[stage];
  const parts = lesson.splitAudio?.parts[originalCursor];
  return {
    segment,
    segmentIndex,
    step,
    stage,
    text: segment[step],
    originalCursor,
    partIndex,
    parts,
  };
}

export function readingFinished(lesson: ReadingLesson, completed: number[]) {
  const done = new Set(completed);
  return Array.from({ length: lessonClipCount(lesson) }, (_, i) => i).every((i) => done.has(i));
}

export function segmentNarration(segment: ReadingSegment, step: ClassroomStep) {
  return [
    step === "english" ? segment.leadIn : undefined,
    segment[step],
    step === "reasoning" ? segment.closing : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function spokenStepAt(lesson: ReadingLesson, cursor: number) {
  const result = stepAt(lesson, cursor);
  const narration =
    result.parts?.[result.partIndex] ?? segmentNarration(result.segment, result.step);
  return { ...result, narration };
}
