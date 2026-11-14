import apposition from "@/data/classroom/apposition-rule-first.json";
import foundations from "@/data/classroom/grammar-rule-foundations.json";
import writingProfiles from "@/data/classroom/writing-teaching-profiles.json";
import { TEACHING_METHOD_REVISION } from "./teaching-method";
import type { ReadingLesson, ReadingSegment } from "./types";

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
function writingSegments(grade: 10 | 11, unit: number) {
  const p = writingProfiles.find((p) => p.grade === grade && p.unit === unit)!;
  return [
    ...card(
      grade,
      unit,
      "writing",
      0,
      p.title,
      [
        `ကဲ၊ ဒီနေ့ Writing ခေါင်းစဉ်က ${p.title} ပါ။ မရေးခင် မေးခွန်းက ဘာလုပ်ခိုင်းထားလဲ အရင်သိရမယ်နော်။ ဒီ task က ${p.task} ဖြစ်တယ်။ ရေးမယ့်ရည်ရွယ်ချက်က ${p.focus} ဖြစ်တယ်။ ခေါင်းစဉ်ကို မဖတ်ဘဲ မှတ်မိတဲ့ essay တစ်ပုဒ်ကို အစားထိုးရေးလို့ မရဘူး။`,
        "ပေးထားတဲ့ point တွေက ဝါကျအပြည့် မဖြစ်သေးနိုင်ဘူး။ အချို့က နာမ်စု၊ အချို့က အချိန် သို့မဟုတ် နေရာအချက်၊ အချို့က လုပ်ဆောင်မှု ဒါမှမဟုတ် အကြောင်းရင်းပါ။ အဲဒါတွေကို အရင်ခွဲမှ grammar ရွေးဖို့ လွယ်မယ်။ point တစ်ခုချင်းကို ဘာအကြောင်းပြောဖို့ ပေးထားတာလဲ၊ ဘယ်မေးခွန်းကို ဖြေပေးသလဲဆိုပြီး စဉ်းစားပါ။",
        join([
          "ဒီ task မှာ အာရုံစိုက်ဖတ်ရမယ့် point အုပ်စုတွေကို ဘုတ်မှာ ပြမယ်။",
          ...p.points,
          "ဒီအုပ်စုတွေက မူရင်း task ကို နားလည်ဖို့ သင်ထောက်ကူပါ။ စာအုပ်ရဲ့ မူရင်း points နဲ့ အသေးစိတ်ကို ဆက်တိုက်စစ်ပါ။ scan ထဲမှာသာပါတဲ့ အချက်ကို မဖတ်ရသေးရင် အထင်နဲ့ မဖြည့်ပါနဲ့။",
        ]),
      ],
      [p.task, p.focus, ...p.points],
    ),
    ...card(
      grade,
      unit,
      "writing",
      1,
      "Thinking from points → Outline",
      [
        "အခု အင်္ဂလိပ်ဝါကျ တန်းမရေးသေးဘဲ ဖတ်သူက ဘာကို အရင်သိဖို့လိုလဲ စဉ်းစားမယ်။ အကြောင်းအရာတူတဲ့ points ကို အတူထားပြီး မိတ်ဆက်မယ့်အချက်၊ အသေးစိတ်ရှင်းမယ့်အချက်နဲ့ ချုပ်မယ့်အချက် ခွဲပါ။ အကြောင်းရင်းနဲ့ အကျိုးဆက်ကို မရောပါနဲ့။ ဖြစ်ရပ်ဆို အချိန်အစီအစဉ်၊ ဖော်ပြချက်ဆို သက်ဆိုင်ရာလက္ခဏာအုပ်စု၊ argument ဆို claim နဲ့ support ကို တွဲစဉ်းစားရမယ်။",
        join([
          "ဒီ task အတွက် outline ကို အောက်ပါအစီအစဉ်နဲ့ စဉ်းစားနိုင်တယ်။",
          ...p.outline.map((s, i) => `အပိုင်း ${i + 1} — ${s}`),
          "ဒါက ဝါကျအဖြေ မဟုတ်ဘူးနော်။ ကိုယ့်အတွေးကို စီဖို့ လမ်းညွှန်ပဲ။ point တစ်ခုကနေ ဘာပြောချင်လဲဆိုတာကို ကိုယ်တိုင် ရှင်းအောင် စဉ်းစားရမယ်။",
        ]),
        "Point တစ်ခုကို မေးခွန်းအဖြစ် ပြောင်းပြီး စဉ်းစားကြည့်ပါ။ ဘယ်သူ့အကြောင်းလဲ၊ ဘာလက္ခဏာလဲ၊ ဘာလုပ်သလဲ၊ ဘယ်အချိန်လဲ၊ ဘာကြောင့်လဲဆိုတဲ့ မေးခွန်းတွေထဲက သက်ဆိုင်တာကို ရွေးပါ။ စာပိုဒ်တစ်ပိုဒ်ဆို အဓိကအကြောင်းတစ်ခုအောက်မှာ ဆက်စပ်မယ်။ Essay ဆို body paragraph တစ်ပိုဒ်စီမှာ အဓိကအချက်တစ်ခုနဲ့ သက်ဆိုင်ရာရှင်းချက် ထားမယ်။ Letter သို့မဟုတ် email ဆို ဖတ်သူ၊ ရည်ရွယ်ချက်နဲ့ format ကို မလွတ်စေနဲ့။",
      ],
      p.outline,
    ),
    ...card(
      grade,
      unit,
      "writing",
      2,
      "Choose grammar — and explain why",
      [
        join([
          "အခု outline ရှိပြီဆိုတော့ ကိုယ်ပြောချင်တဲ့အချက်အလိုက် grammar ကို ရွေးမယ်။ ခက်တဲ့ပုံစံသုံးနိုင်မှ စာကောင်းတာ မဟုတ်ဘူး။ အဓိပ္ပာယ်ကို မှန်မှန်ပို့နိုင်တဲ့ပုံစံ ရွေးရတာပါ။",
          ...p.grammar,
        ]),
        "အချက်တစ်ခုကို ရေးဖို့ ဘယ်သူ သို့မဟုတ် ဘာကို subject ထားမလဲ အရင်ဆုံးဖြတ်ပါ။ ဘာဖြစ်တယ်၊ ဘယ်လိုလဲဆိုတာ ဖော်ပြတာလား၊ ဘာလုပ်သလဲဆိုတာ ပြောတာလား ခွဲပြီး be verb နဲ့ action verb ကို ရွေးမယ်။ subject တစ်ခုကိန်း၊ အများကိန်းနဲ့ tense အလိုက် verb ပုံစံ စစ်ပါ။ Verb တိုင်းရှေ့မှာ is ကို အလိုလို မထည့်ပါနဲ့။",
        "Point မှာ article မပါသေးပေမယ့် ဝါကျအပြည့်မှာ လိုလာနိုင်တယ်။ နာမ်က ရေတွက်လို့ရလား၊ တစ်ခုကိန်းလား၊ သတ်မှတ်ပြီးသားလား စစ်ပြီး a/an/the ကို ရွေးပါ။ နေရာနဲ့ အချိန်ကို ဆက်တဲ့ preposition ကို မြန်မာစကားလုံးတစ်လုံးချင်းနဲ့ အစားမထိုးဘဲ ဆက်နွှယ်မှုအရ ရွေးပါ။ Pronoun သုံးရင် ဘယ်နာမ်ကို ပြန်ညွှန်းလဲ ဖတ်သူသိရမယ်။ Connector ကိုလည်း point တွေရဲ့ အကြောင်းရင်း၊ အကျိုးဆက်၊ အပိုဖြည့်မှု၊ contrast ဆက်နွှယ်မှု ရှိမှ သုံးမယ်။",
      ],
      p.grammar,
    ),
    ...card(
      grade,
      unit,
      "writing",
      3,
      "Your draft → Review → Revise",
      [
        "အခု ကိုယ်တိုင် မူကြမ်းရေးကြည့်ပါ။ ဆရာက အဖြေဝါကျနဲ့ စာပိုဒ်အပြည့် အရင်ရေးပေးမှာ မဟုတ်ဘူး။ ကိုယ့် outline ထဲက အချက်ကို ကိုယ့်ဝါကျနဲ့ တည်ဆောက်ရမယ်။ Point တစ်ခုအတွက် ဝါကျတစ်ကြောင်း မဖြစ်မနေ မဟုတ်ဘူး။ နီးစပ်တဲ့အချက်တွေကို သင့်တော်သလို ဆက်နိုင်ပေမယ့် မနိုင်သေးတဲ့ ဝါကျရှည်တစ်ကြောင်းထဲ အချက်အားလုံး မသိပ်ထည့်ပါနဲ့။",
        `မူကြမ်းပြီးရင် ပထမအကြိမ် content နဲ့ organisation ကိုပဲ အရင်စစ်မယ်။ ${p.focus} ဆိုတဲ့ ရည်ရွယ်ချက်နဲ့ ကိုက်လား။ မူရင်း points ပြည့်လား၊ ထပ်ရေးထားတဲ့အချက်ရှိလား၊ အပိုဒ်အစီအစဉ်က ဖတ်သူလိုက်လို့လွယ်လား။ အဆုံးမှာ အကြောင်းအရာအသစ်ကြီး မစဘဲ ရေးထားတဲ့အချက်ကို ချုပ်နိုင်ရမယ်။`,
        `နောက်အကြိမ် grammar နဲ့ ရေးထုံးကို စစ်မယ်။ Subject နဲ့ verb ပြည့်လား၊ tense ရွေးထားတဲ့အကြောင်းရင်း မှန်လား၊ agreement ညီလား၊ article နဲ့ preposition လိုတဲ့နေရာတွေ ပြည့်လား စစ်ပါ။ ပြီးမှ spelling၊ punctuation နဲ့ format ကိုကြည့်မယ်။ Length က ${p.task} ဆိုတဲ့ သတ်မှတ်ချက်နဲ့ ကိုက်ရမယ်။ အရေအတွက်ပြည့်ဖို့ အဓိပ္ပာယ်တူကို ထပ်မရေးပါနဲ့။ ကိုယ်ရေးပြီးတဲ့ draft ကိုသာ ဆရာ့ဆီပြပြီး ဘာကြောင့်ပြင်သင့်လဲဆိုတာ နားလည်ကာ ကိုယ်တိုင်ပြန်ပြင်မယ်နော်။`,
      ],
      [
        "Draft ကို ကိုယ်တိုင်ရေး",
        "Content / organisation အရင်စစ်",
        "Grammar / reference / punctuation စစ်",
        p.task,
      ],
    ),
  ];
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
      version: skill === "grammar" ? "rule-first-v1" : "point-first-v1",
      teachingRevision: TEACHING_METHOD_REVISION,
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
