import lessonText from "@/data/grade11/textbook/upper-lesson-text.json";
import support from "@/data/grade11/textbook/upper-study-support.json";
import listening from "@/data/grade11/textbook/upper-listening-answers.json";
import { GRADE11_TRANSCRIPTS, getGrade11Captions } from "./grade11Captions";
import { UPPER_UNITS, type UpperUnitNumber } from "./grade11Upper";
import type { G11SkillKind } from "@/data/grade11/syllabus";

export type UpperTextBlock = {
  pages?: number[];
  id: string;
  t: string;
  page: number;
  en: string;
  my: string;
  highlights?: string[];
  sourceLine?: number;
  paragraph?: number;
};
export const UPPER_LESSON_TEXT = lessonText.units as Record<
  number,
  Record<G11SkillKind, UpperTextBlock[]>
>;
export const UPPER_EMBEDDED_GROUPS = new Set(Object.values(lessonText.embeddedGroups).flat());

export type UpperStudyNote = {
  page: number;
  pages?: number[];
  title: string;
  rows: { en: string; my: string }[];
  choiceLabels?: Record<string, string>;
};
export const UPPER_STUDY_NOTES = support.groups as Record<string, UpperStudyNote>;
export const UPPER_ITEM_NOTES = support.itemNotes as Record<string, string>;
type RecordingAnswer = {
  answer: string;
  unit: number;
  audioSha256: string;
  cueIds: string[];
  origin: string;
};
const recordingAnswers = listening.items as Record<string, RecordingAnswer>;
/** Never use suggestions against a replaced recording or missing transcript evidence. */
export function upperRecordingAnswer(unit: number, id: string) {
  const key = recordingAnswers[id];
  const transcript = GRADE11_TRANSCRIPTS[unit];
  if (!key || key.unit !== unit || key.audioSha256 !== transcript?.audioSha256) return undefined;
  const cues = getGrade11Captions(unit).filter((cue) => key.cueIds.includes(cue.id));
  if (cues.length !== key.cueIds.length) return undefined;
  return { ...key, cues };
}

/** One exercise per request. Source reference only, with no hidden answer-key material. */
export function upperStudyContext(unit: UpperUnitNumber, kind: G11SkillKind) {
  const lesson = UPPER_UNITS[unit].skills[kind];
  const reference = (UPPER_LESSON_TEXT[unit]?.[kind] ?? [])
    .map((block) => `[${block.id} | textbook page ${block.page - 5}] ${block.en}`)
    .join("\n\n");
  const notes = lesson.groups
    .filter((group) => !UPPER_EMBEDDED_GROUPS.has(group.id))
    .map((group) => UPPER_STUDY_NOTES[group.id])
    .filter(Boolean)
    .map((note) => `${note.title}\n${note.rows.map((row) => row.en).join("\n")}`)
    .join("\n\n");
  const recording =
    kind === "listening" || kind === "speaking"
      ? `Supplied recording transcript:\n(machine transcription; do not invent unclear words)\n${getGrade11Captions(
          unit,
        )
          .map((cue) => cue.en)
          .join("\n")}`
      : "";
  return `Grade 11 Unit ${unit} · ${kind}\n${recording}\nManually reviewed study reference:\n${notes}\nManually transcribed textbook reference (if evidence is insufficient, say so):\n${reference}`;
}
