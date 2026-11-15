import text from "@/data/grade11/textbook/unit7-text.json";
import unit from "@/data/grade11/textbook/unit7.json";
import type { G11SkillKind } from "@/data/grade11/syllabus";
import type { Unit1Block } from "./grade11Unit1";
export const UNIT7_TEXT = text;
export const UNIT7_NOTES = {
  reading: text.reading,
  vocabulary: text.vocabularyNotes,
  grammar: text.grammar,
  speaking: text.speaking,
  writing: text.writing,
} as Record<Exclude<G11SkillKind, "listening">, Unit1Block[]>;
/** Textbook source only, with no hidden keys or invented student answers. */
export function unit7Reference(kind: G11SkillKind): string {
  const notes = kind === "listening" ? [] : UNIT7_NOTES[kind];
  return [
    ...notes.map((block) => `[${block.id}] ${block.x}`),
    ...(kind === "vocabulary"
      ? text.vocabulary.map(
          (row) =>
            `[${row.id}] ${row.sentence}\n${row.options.map((o) => `(${o.value}) ${o.en}`).join("\n")}`,
        )
      : []),
    ...unit.skills[kind].groups.flatMap((g) => [
      g.instruction,
      ...g.items.map((item) => item.prompt),
    ]),
  ].join("\n\n");
}
