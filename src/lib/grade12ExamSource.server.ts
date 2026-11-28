import core from "@/data/grade12/unit1-core.json";
import { textbookPoems } from "@/data/grade12/poems";
import { grade12Reviews, grade12SkillTopics, grade12Units } from "@/data/grade12/syllabus";
import { textbookUnits, type TextbookUnitNumber } from "@/data/grade12/textbookUnits";
import type { ExamTextbookSource } from "./grade11ExamFormat";

export function grade12ExamTopics(units: number[]) {
  return grade12Units
    .filter(({ number }) => units.includes(number))
    .map(({ number, title }) => {
      const { vocabulary, grammar, speaking, writing } = grade12SkillTopics[number];
      return `Unit ${number} (${title}) — Vocabulary: ${vocabulary}; Grammar: ${grammar}; Speaking: ${speaking}; Writing: ${writing}`;
    })
    .join("\n");
}

export function grade12ExamSource(units: number[]): ExamTextbookSource {
  const poems = textbookPoems.flatMap(({ stanzas }, index) =>
    stanzas
      ? [
          {
            title: grade12Reviews[index].poem,
            lines: stanzas.flatMap(([text]) => text.split("\n")),
          },
        ]
      : [],
  );
  const readings = units.map((unit) => {
    const paragraphs =
      unit === 1 ? core.paragraphs : textbookUnits[unit as TextbookUnitNumber].reading;
    return { unit, passage: paragraphs.join("\n\n") };
  });
  return { readings, poems };
}
