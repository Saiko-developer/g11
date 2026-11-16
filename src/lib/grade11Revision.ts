import review1 from "@/data/grade11/textbook/review1.json";
import review2 from "@/data/grade11/textbook/review2.json";
import review3 from "@/data/grade11/textbook/review3.json";
import review4 from "@/data/grade11/textbook/review4.json";
import poem1 from "@/data/grade11/textbook/poem1.json";
import poem2 from "@/data/grade11/textbook/poem2.json";
import poem3 from "@/data/grade11/textbook/poem3.json";
import poem4 from "@/data/grade11/textbook/poem4.json";
import r1 from "@/data/grade11/textbook/review1-answer.json";
import r2 from "@/data/grade11/textbook/review2-answer.json";
import r3 from "@/data/grade11/textbook/review3-answer.json";
import r4 from "@/data/grade11/textbook/review4-answer.json";
import p1 from "@/data/grade11/textbook/poem1-answer.json";
import p2 from "@/data/grade11/textbook/poem2-answer.json";
import p3 from "@/data/grade11/textbook/poem3-answer.json";
import p4 from "@/data/grade11/textbook/poem4-answer.json";
import { grade11AnswerKeys } from "./grade11Answers";
import type { G11Unit } from "@/data/grade11/part1";

export type RevisionItem = {
  id: string;
  number: number;
  question: string;
  translationMy: string;
  sourcePage?: number;
  highlights?: string[];
  sourceNote?: string;
  writing?: boolean;
  lineTarget?: number;
  clues?: string[];
  example?: { english: string; myanmar: string };
};
export type RevisionGroup = {
  code: string;
  instruction: string;
  instructionMy: string;
  items: RevisionItem[];
  wordBox?: string[];
  wordBoxMy?: string[];
  example?: { english: string; myanmar: string };
  sourceNote?: string;
};
export type Review = {
  title: string;
  subtitle: string;
  sourcePage: number;
  textbookPage: number;
  groups: RevisionGroup[];
};
export type Poem = {
  title: string;
  author: string;
  sourcePage: number;
  textbookPage: number;
  stanzas: { english: string; myanmar: string }[][];
  glossary: { word: string; meaning: string; meaningMy: string }[];
  groups: RevisionGroup[];
  sourceNote?: string;
};
export const G11_REVIEWS = [review1, review2, review3, review4] as Review[];
export const G11_POEMS = [poem1, poem2, poem3, poem4] as Poem[];
export const G11_REVIEW_KEYS = [r1, r2, r3, r4].map(grade11AnswerKeys);
export const G11_POEM_KEYS = [p1, p2, p3, p4].map(grade11AnswerKeys);
export const G11_REVISION_PAGES: Record<string, G11Unit> = Object.fromEntries(
  G11_REVIEWS.flatMap((review, i) => [
    [
      `review-${i + 1}`,
      {
        id: `review-${i + 1}`,
        kind: "review",
        no: `Review ${i + 1}`,
        title: review.title,
        mmTitle: `ပြန်လည်လေ့ကျင့်ခန်း ${i + 1}`,
        ready: true,
        sections: [],
      },
    ],
    [
      `poem-${i + 1}`,
      {
        id: `poem-${i + 1}`,
        kind: "poem",
        no: `Poem ${i + 1}`,
        title: G11_POEMS[i].title,
        mmTitle: `ကဗျာ ${i + 1}`,
        ready: true,
        sections: [],
      },
    ],
  ]),
);
/** Original English tasks and passages only. Suggested answers never enter the popup context. */
export function grade11RevisionContext(id: string) {
  const match = id.match(/^(review|poem)-([1-4])$/);
  if (!match) return "";
  const n = Number(match[2]) - 1;
  const poem = match[1] === "poem" ? G11_POEMS[n] : null;
  const data = poem ?? G11_REVIEWS[n];
  return (
    `Grade 11 · ${match[1]} ${n + 1} · ${data.title}\n` +
    (poem
      ? `${poem.author}\n${poem.stanzas.map((s) => s.map((l) => l.english).join("\n")).join("\n\n")}\nGlossary:\n${poem.glossary.map((g) => `${g.word}: ${g.meaning}`).join("\n")}\n`
      : "") +
    data.groups
      .map(
        (g) =>
          `${g.code}. ${g.instruction}\n${g.wordBox?.join(" | ") ?? ""}\n${g.example?.english ?? ""}\n${g.sourceNote ? "Source note: some text is cropped; do not invent missing words." : ""}\n${g.items.map((q) => `[Exercise ${g.code} · Question ${q.number} | source ${q.id}] ${g.instruction}\n${q.question}${q.example ? `\n${q.example.english}` : ""}${q.clues ? `\nClues: ${q.clues.join(" | ")}` : ""}`).join("\n\n")}`,
      )
      .join("\n\n")
  );
}
