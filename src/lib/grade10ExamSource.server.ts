/** Textbook-only context for Grade 10 exam questions; self-study data is unchanged. */
import { POEM1_STANZAS } from "@/data/poem1";
import { POEM2_STANZAS } from "@/data/poem2";
import { POEM3_STANZAS } from "@/data/poem3";
import { POEM4_STANZAS } from "@/data/poem4";
import type { QaItem } from "./mockExam";
const loaders = import.meta.glob<{ default: unknown }>("/src/data/textbookUnit*.json");
type Node = Record<string, unknown>;
export function readingQuestions(value: unknown): Omit<QaItem, "number">[] {
  if (Array.isArray(value)) return value.flatMap(readingQuestions);
  if (!value || typeof value !== "object") return [];
  const node = value as Node;
  if (
    typeof node.question === "string" &&
    typeof node.answer === "string" &&
    !/^sample answer/i.test(node.answer)
  )
    return [{ question: node.question, answer: node.answer }];
  return Object.values(node).flatMap(readingQuestions);
}
export async function grade10ExamSource(units: number[]) {
  const sources = await Promise.all(
    units.map(async (unit) => {
      const load = loaders[`/src/data/textbookUnit${unit}.json`];
      if (!load) throw new Error(`Grade 10 Unit ${unit} textbook source unavailable`);
      const data = (await load()).default as { sections?: Node[] };
      const reading = data.sections?.find((s) => /reading/i.test(String(s.lesson ?? "")));
      const passage = reading?.reading_passage as
        { paragraphs?: { english_text?: string }[] } | undefined;
      return {
        unit,
        passage:
          passage?.paragraphs
            ?.map((p) => p.english_text ?? "")
            .filter(Boolean)
            .join("\n\n") ?? "",
        questions: readingQuestions(reading?.comprehension),
      };
    }),
  );
  const pool = sources.flatMap((s) => s.questions.map((q) => ({ ...q, unit: s.unit })));
  // Shuffle within each unit and interleave units, so a combined paper samples broadly.
  const shuffle = <T>(items: T[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const groups = shuffle(sources).map((s) => shuffle(pool.filter((q) => q.unit === s.unit)));
  const selected: QaItem[] = [];
  const used = new Set<string>();
  while (groups.some((g) => g.length) && selected.length < 4) {
    for (const group of groups) {
      const q = group.pop();
      if (q && !used.has(q.question) && selected.length < 4) {
        used.add(q.question);
        selected.push({ number: selected.length + 6, question: q.question, answer: q.answer });
      }
    }
  }
  return {
    readingQuestions: selected,
    passage: sources[0]?.passage ?? "",
    poems: [POEM1_STANZAS, POEM2_STANZAS, POEM3_STANZAS, POEM4_STANZAS],
  };
}
