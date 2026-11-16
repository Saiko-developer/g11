import poem1 from "@/data/grade11/textbook/poem1.json";
import poem2 from "@/data/grade11/textbook/poem2.json";
import poem3 from "@/data/grade11/textbook/poem3.json";
import poem4 from "@/data/grade11/textbook/poem4.json";
import { grade11ReadingPassage } from "./grade11ExamPassage.server";
export async function grade11ExamSource(units: number[]) {
  const readings = await Promise.all(
    units.map(async (unit) => ({ unit, passage: await grade11ReadingPassage(unit, 16000) })),
  );
  if (readings.some((r) => !r.passage))
    throw new Error("Selected Grade 11 textbook reading is unavailable");
  return {
    readings,
    poems: [poem1, poem2, poem3, poem4].map((p) => ({
      title: p.title,
      lines: p.stanzas.flat().map((l) => l.english),
    })),
  };
}
export type Grade11ExamSource = Awaited<ReturnType<typeof grade11ExamSource>>;
