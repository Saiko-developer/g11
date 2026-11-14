import { getMethodLesson, methodLessons } from "./method-lessons";
import { isAnswerMatch } from "@/lib/answerMatch";
import scripts from "@/data/classroom/grade10-unit1-skills.json";
import textbook from "@/data/textbookUnit1.json";
import { getReadingLesson } from "./lessons";
import type { ReadingLesson } from "./types";

export const UNIT_SKILLS = [
  "reading",
  "vocabulary",
  "grammar",
  "listening",
  "speaking",
  "writing",
] as const;
export type UnitSkill = (typeof UNIT_SKILLS)[number];
export const UNIT_COURSE_VERSION = "g10-u1-course-v1";
export const skillLabels: Record<UnitSkill, string> = {
  reading: "Reading",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
};
export function isUnitSkill(value: unknown): value is UnitSkill {
  return UNIT_SKILLS.includes(value as UnitSkill);
}
export function getUnitLesson(grade: number, unit: number, skill: UnitSkill): ReadingLesson | null {
  if (skill === "grammar" || skill === "writing") return getMethodLesson(grade, unit, skill);
  if (grade !== 10 || unit !== 1) return null;
  if (skill === "reading") return getReadingLesson(10);
  const script = scripts[skill];
  return (skillLessons[skill] ??= {
    id: `g10-u1-${skill}`,
    grade: 10,
    unit: 1,
    version: "unit-teacher-v1",
    teachingRevision: "unit-teacher-v1",
    review: "draft",
    section: skill,
    title: script.title,
    segments: script.cards,
    questions: [],
  });
}
const skillLessons: Partial<Record<UnitSkill, ReadingLesson>> = {};
export function resolveClassroomLesson(grade: unknown, lessonId?: string): ReadingLesson | null {
  const reading = getReadingLesson(grade);
  if (!lessonId || reading?.id === lessonId) return reading;
  const method = methodLessons.find((l) => l.grade === Number(grade) && l.id === lessonId);
  if (method) return method;
  if (Number(grade) !== 10) return null;
  return (
    UNIT_SKILLS.map((skill) => getUnitLesson(10, 1, skill)).find((l) => l?.id === lessonId) ?? null
  );
}
export type CourseActivity = { id: string; question: string; minLength: number; model?: string };
export const unitActivities: Record<UnitSkill, CourseActivity[]> = {
  reading: getReadingLesson(10)!.questions.map((q) => ({ ...q, model: q.answer, minLength: 2 })),
  vocabulary: [
    {
      id: "v1",
      question:
        "Write three sentences about someone from Japan: country, nationality and language.",
      minLength: 25,
      model: "She is from Japan. She is Japanese. She speaks Japanese.",
    },
    {
      id: "v2",
      question: "Because I speak _____ fluently, I did not have much trouble in France.",
      minLength: 2,
      model: "French",
    },
  ],
  grammar: [
    {
      id: "g1",
      question:
        "My son, a musician, earns little and lives with me. Identify the noun phrase in apposition.",
      minLength: 2,
      model: "a musician",
    },
    {
      id: "g2",
      question: "Combine: U Tun Tun is our English teacher. He is a very strict person.",
      minLength: 20,
      model: "U Tun Tun, our English teacher, is a very strict person.",
    },
  ],
  listening: [
    {
      id: "l1",
      question: "Listen to the original Unit 1 recording. Write the language names you heard.",
      minLength: 5,
    },
    {
      id: "l2",
      question:
        "Write your most-to-least spoken language order from the recording. Note anything you could not hear clearly.",
      minLength: 10,
    },
  ],
  speaking: [
    {
      id: "s1",
      question:
        "Say your answers aloud, then write notes: What language are you learning? When did you start? What difficulties do you have? How do you practise outside school?",
      minLength: 40,
    },
    {
      id: "s2",
      question:
        "Give a short spoken report about your partner (or clearly labelled imaginary partner). Save the main points here.",
      minLength: 30,
    },
  ],
  writing: [
    {
      id: "w1",
      question: "Save your outline: opening, location, language, industry/exports, closing.",
      minLength: 30,
    },
    {
      id: "w2",
      question:
        "Write and revise a paragraph of 7–10 sentences about Japan using the textbook points.",
      minLength: 100,
    },
  ],
};
export function validUnitActivity(
  skill: UnitSkill,
  answers: Record<string, string>,
  practised: boolean,
) {
  if (!unitActivities[skill].every((a) => (answers[a.id]?.trim().length ?? 0) >= a.minLength))
    return false;
  if ((skill === "listening" || skill === "speaking") && !practised) return false;
  if (skill === "writing") {
    const sentences = (answers.w2 ?? "").split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim());
    if (sentences.length < 7 || sentences.length > 10) return false;
  }
  return true;
}
// Repository-provided answers, not newly AI-generated answer keys.
const readingSource = textbook.sections[0].comprehension!.part_A.exercises;
export const unitHomework = [
  { id: "h1", skill: "reading", question: readingSource[0].text, answer: readingSource[0].answer },
  { id: "h2", skill: "reading", question: readingSource[5].text, answer: readingSource[5].answer },
  {
    id: "h3",
    skill: "vocabulary",
    question: "What is the nationality of someone from France?",
    answer: "French",
  },
  {
    id: "h4",
    skill: "grammar",
    question:
      "Find the noun phrase in apposition: My son, a musician, earns little and lives with me.",
    answer: "a musician",
  },
  {
    id: "h5",
    skill: "grammar",
    question: "Combine: U Tun Tun is our English teacher. He is a very strict person.",
    answer: "U Tun Tun, our English teacher, is a very strict person.",
  },
  {
    id: "h6",
    skill: "writing",
    question:
      "Write a revised paragraph of 7–10 sentences about Japan. Use your outline, check subject–verb agreement and punctuation.",
    answer: null,
  },
] as const;
export function gradeUnitHomework(answers: Record<string, string>) {
  const items = unitHomework.map((q) => ({
    id: q.id,
    status: !q.answer
      ? "review_required"
      : isAnswerMatch(answers[q.id] ?? "", q.answer) ||
          (q.id === "h1" &&
            isAnswerMatch(
              (answers[q.id] ?? "").replace(/\band\b/gi, ""),
              q.answer.replace(/\band\b/gi, ""),
            ))
        ? "matched"
        : "review_required",
  }));
  return {
    items,
    matched: items.filter((q) => q.status === "matched").length,
    objectiveTotal: 5,
    note: "အဖြေတူညီမှုစစ်ထားခြင်းသာဖြစ်သည်။ မတူသောအဖြေနှင့် Writing ကို ထပ်မံသုံးသပ်ရန်လိုသည်။ Final exam grade မဟုတ်ပါ။",
  };
}
