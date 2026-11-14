import profiles from "@/data/classroom/writing-teaching-profiles.json";
import narration from "@/data/classroom/writing-teacher-narration.json";
import type { ReadingSegment } from "./types";

export const WRITING_VERSION = "point-first-v2";
export const WRITING_REVISION = "writing-teacher-v3";

/** Two consecutive audio clips, split only at a Burmese sentence boundary. */
function pair(text: string): [string, string] {
  const sentences =
    text
      .match(/[^။]+။?/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [];
  let split = 1;
  let distance = Infinity;
  for (let i = 1; i < sentences.length; i++) {
    const candidate = Math.abs(sentences.slice(0, i).join(" ").length - text.length / 2);
    if (candidate < distance) {
      split = i;
      distance = candidate;
    }
  }
  if (sentences.length < 2) throw new Error("Writing teaching needs connected sentences");
  return [sentences.slice(0, split).join(" "), sentences.slice(split).join(" ")];
}

export function writingSegments(grade: 10 | 11, unit: number): ReadingSegment[] {
  const p = profiles.find((p) => p.grade === grade && p.unit === unit)!;
  const t = narration.find((p) => p.grade === grade && p.unit === unit)!;
  const cards = [
    [
      ...pair(t.opening),
      ...pair(`${t.interpretation} စာအုပ်ရဲ့ ရေးသားခိုင်းတဲ့ပုံစံက ${p.task} ပါ။`),
    ],
    [...pair(t.grouping), ...pair(`${t.development} ${t.question}`)],
    [...pair(t.grammarApplication), ...pair(p.grammar.join(" "))],
    [
      ...pair(t.drafting),
      ...pair(
        `${t.review} အခု ကိုယ့်မူကြမ်းကို ပြန်ဖတ်ပြီး မရှင်းသေးတဲ့နေရာကို ကိုယ်တိုင်ပြင်ကြည့်ပါ။`,
      ),
    ],
  ];
  return cards.map(([english, translation, explanation, reasoning], index) => ({
    id: `g${grade}-u${unit}-writing-method-${index}-0`,
    paragraph: index + 1,
    source: `${grade === 10 ? `src/data/textbookUnit${unit}.json` : `src/data/grade11/textbook/unit${unit}.json`}; authored writing teaching, ${WRITING_REVISION}`,
    // These legacy field names represent consecutive teaching clips for Writing.
    // Display headings live on the board; none is submitted to speech synthesis.
    english,
    translation,
    explanation,
    reasoning,
    notes:
      index === 0 ? p.points : index === 1 ? p.outline : index === 2 ? p.grammar : [t.question],
    focus: [],
  }));
}
