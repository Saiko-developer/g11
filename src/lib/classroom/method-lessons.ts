import apposition from "@/data/classroom/apposition-rule-first.json";
import foundations from "@/data/classroom/grammar-rule-foundations.json";
import writingProfiles from "@/data/classroom/writing-teaching-profiles.json";
import { TEACHING_METHOD_REVISION } from "./teaching-method";
import type { ReadingLesson, ReadingSegment } from "./types";
import { writingSegments, WRITING_VERSION, WRITING_REVISION } from "./writing-lessons";

export type MethodSkill = "grammar" | "writing";
const rules = foundations as Record<
  string,
  {
    title: string;
    sections: {
      title: string;
      meaning: string[];
      why: string[];
      rules: string[];
      patterns: string[];
      cautions: string[];
    }[];
  }
>;
const sourcePath = (grade: number, unit: number) =>
  grade === 10 ? `src/data/textbookUnit${unit}.json` : `src/data/grade11/textbook/unit${unit}.json`;
const join = (parts: string[]) => parts.filter(Boolean).join("\n\n");
/** Split long rule explanations without truncating them; every narration stays within provider bounds. */
function chunks(text: string, limit = 2600): string[] {
  const out: string[] = [];
  let remaining = text.trim();
  while (remaining.length > limit) {
    const split = remaining.lastIndexOf("။", limit);
    const end = split > limit / 2 ? split + 1 : limit;
    out.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) out.push(remaining);
  return out;
}
function card(
  grade: 10 | 11,
  unit: number,
  skill: MethodSkill,
  index: number,
  title: string,
  paragraphs: string[],
  notes: string[],
  pattern?: string,
): ReadingSegment[] {
  const pieces = paragraphs.flatMap((p) => chunks(p));
  const result: ReadingSegment[] = [];
  for (let i = 0; i < pieces.length; i += 3)
    result.push({
      id: `g${grade}-u${unit}-${skill}-method-${index}-${i / 3}`,
      paragraph: index + 1,
      source: `${sourcePath(grade, unit)}; authored ${skill} teaching, ${TEACHING_METHOD_REVISION}`,
      english:
        `${skill === "grammar" ? "Grammar" : "Writing"} · ${title}` +
        (i ? " · ဆက်လက်ရှင်းပြချက်" : ""),
      translation: pieces[i],
      explanation:
        pieces[i + 1] ?? "ဒီအချက်ရဲ့ အဓိပ္ပာယ်နဲ့ အသုံးကို ကိုယ့်စကားနဲ့ ပြန်စဉ်းစားကြည့်ပါ။",
      reasoning:
        pieces[i + 2] ??
        "စည်းမျဉ်းကို ဘယ်အခြေအနေမှာ သုံးရလဲ၊ ဘာကြောင့်လဲဆိုတာ အကြောင်းပြပြီးမှ ကိုယ်တိုင်လေ့ကျင့်ကြည့်ပါ။",
      notes,
      focus: pattern ? [pattern] : [],
    });
  return result;
}
function grammarSegments(grade: 10 | 11, unit: number) {
  if (grade === 10 && unit === 1)
    return apposition.flatMap((c, i) => card(10, 1, "grammar", i, c.title, c.paragraphs, c.notes));
  const foundation = rules[`${grade}:${unit}`];
  return foundation.sections.flatMap((s, index) =>
    card(
      grade,
      unit,
      "grammar",
      index,
      s.title,
      [
        join([
          `ကဲ၊ ဒီအပိုင်းမှာ ${s.title} ကို သင်ကြမယ်နော်။ ဝါကျအဖြေကို တန်းမှတ်မယ့်အစား ဒီ grammar က ဘာအဓိပ္ပာယ်ပေးလဲ၊ ဘာအတွက်သုံးလဲဆိုတာ အရင်နားလည်ရမယ်။`,
          ...s.meaning,
          ...s.why.filter((p) => !p.includes("အမှတ်အရဆုံး")),
        ]),
        join([
          "အခု rule ရဲ့ ဖွဲ့စည်းပုံကို သေချာစဉ်းစားကြည့်မယ်။ Formula ကို အလွတ်ကျက်ရုံနဲ့ မလုံလောက်ဘူးနော်။ အစိတ်အပိုင်းတစ်ခုချင်းက ဘယ်အလုပ်လုပ်နေလဲ သိရမယ်။",
          ...s.patterns.map((p) => `ပုံစံကို ဘုတ်မှာ ဒီလို မှတ်ထားမယ် — ${p}`),
          ...s.rules.map((p, i) => `စည်းမျဉ်းအချက် ${i + 1} ကို ကြည့်ပါ။ ${p}`),
        ]),
        join([
          "ဒီပုံစံကို သုံးဖို့ မေးခွန်းမှာ ဘာအဓိပ္ပာယ်၊ ဘာအချိန်နဲ့ ဘယ်စကားစုရဲ့အလုပ်ကို ကြည့်ရမလဲ စဉ်းစားပါ။ မူရင်းအဓိပ္ပာယ်၊ subject၊ verb နဲ့ စကားစုတွေ ဆက်နွှယ်ပုံကို အရင်ရှာပြီးမှ rule ရွေးရမယ်။",
          ...s.cautions,
          "ပြီးရင် စာအုပ်ထဲက နမူနာကို စည်းမျဉ်းအတွက် အထောက်အကူအဖြစ် ကြည့်မယ်။ ဘယ်အပိုင်းက ဒီ rule နဲ့ ကိုက်လဲ၊ ဘာကြောင့်လဲဆိုတာ ရှင်းနိုင်ရမယ်။ အဖြေတစ်ကြောင်းကို အလွတ်ကျက်ထားတာထက် နောက်မေးခွန်းမှာ ကိုယ်တိုင်ရွေးသုံးနိုင်ဖို့ အရေးကြီးတယ်နော်။",
        ]),
      ],
      [s.title, ...s.patterns.slice(0, 2), "Meaning → rule → conditions → reason → practice"],
      s.patterns[0],
    ),
  );
}
const cache = new Map<string, ReadingLesson>();
export function getMethodLesson(grade: number, unit: number, skill: string): ReadingLesson | null {
  if (
    (grade !== 10 && grade !== 11) ||
    !Number.isInteger(unit) ||
    unit < 1 ||
    unit > 12 ||
    (skill !== "grammar" && skill !== "writing")
  )
    return null;
  const key = `g${grade}-u${unit}-${skill}`;
  if (!cache.has(key))
    cache.set(key, {
      id: key,
      grade,
      unit,
      section: skill,
      version: skill === "grammar" ? "rule-first-v1" : WRITING_VERSION,
      teachingRevision: skill === "writing" ? WRITING_REVISION : TEACHING_METHOD_REVISION,
      teachingMethod: skill === "grammar" ? "rule-first" : "point-first",
      review: "draft",
      title:
        skill === "grammar"
          ? rules[`${grade}:${unit}`].title
          : writingProfiles.find((p) => p.grade === grade && p.unit === unit)!.title,
      segments: skill === "grammar" ? grammarSegments(grade, unit) : writingSegments(grade, unit),
      questions: [],
    });
  return cache.get(key)!;
}
export const methodLessons = ([10, 11] as const).flatMap((grade) =>
  Array.from({ length: 12 }, (_, i) => i + 1).flatMap((unit) =>
    (["grammar", "writing"] as const).map((skill) => getMethodLesson(grade, unit, skill)!),
  ),
);
