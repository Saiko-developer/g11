import grade10 from "@/data/classroom/grade10-unit1-reading.json";
import grade11 from "@/data/classroom/grade11-unit1-reading.json";
import type { ReadingLesson } from "./types";

const lessons: Record<string, ReadingLesson> = {
  "10": {
    id: "g10-u1-reading",
    grade: 10,
    unit: 1,
    version: "pilot-v1",
    review: "draft",
    title: "Language: Skill, Tool, Form, and Function",
    segments: grade10,
    // Only source exercises answerable from this repository's passage are included.
    questions: [
      {
        id: "1A-A1",
        question: "The four language skills are: ___________.",
        answer: "listening, speaking, reading, and writing",
      },
      {
        id: "1A-A6",
        question: "Speaking and writing are ___________ skills.",
        answer: "productive",
      },
      {
        id: "1A-B3",
        question: "What are the receptive skills of language?",
        answer: "Listening and reading.",
      },
    ],
  },
  "11": {
    id: "g11-u1-reading",
    grade: 11,
    unit: 1,
    version: "pilot-v1",
    review: "draft",
    title: "The Ayeyarwady Dolphins",
    segments: grade11,
    questions: [
      {
        id: "pilot-1",
        question: "What is the scientific name of the Ayeyarwady dolphin?",
        answer: "Orcaella brevirostris",
      },
      {
        id: "pilot-2",
        question: "Which two Myanmar towns mark the habitat described in the passage?",
        answer: "Mandalay and Bamaw",
      },
      {
        id: "pilot-3",
        question: "What does sanctuary mean in this passage?",
        answer: "A protected area for dolphins.",
      },
    ],
  },
};
export function getReadingLesson(grade: unknown): ReadingLesson | null {
  return lessons[String(grade)] ?? null;
}
export const readingLessons = Object.values(lessons);
