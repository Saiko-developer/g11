import { grammarFlow, writingFlow } from "./teaching-method";
import inventory from "@/data/classroom/curriculum-inventory.json";
import { SYLLABUS } from "@/data/syllabus";
import { G11_SYLLABUS } from "@/data/grade11/syllabus";

export const TEACHING_SKILLS = [
  "reading",
  "vocabulary",
  "grammar",
  "listening",
  "speaking",
  "writing",
] as const;
export type TeachingSkill = (typeof TEACHING_SKILLS)[number];
export type TeachingGrade = 10 | 11;
export const skillLabel = (skill: TeachingSkill) => skill[0].toUpperCase() + skill.slice(1);
export const curriculumInventory = inventory;

export function teachingUnits(grade: TeachingGrade) {
  return (grade === 10 ? SYLLABUS : G11_SYLLABUS).filter((unit) => unit.type === "unit");
}
export function curriculumSection(grade: TeachingGrade, unit: number, skill: TeachingSkill) {
  const record = inventory.find(
    (item) => item.grade === grade && item.unit === unit && item.skill === skill,
  );
  const syllabus = teachingUnits(grade).find((item) => item.number === unit);
  if (!record || !syllabus) return null;
  return {
    ...record,
    unitTitle: syllabus.title,
    topic: syllabus.skills.find((item) => item.kind === skill)?.detail ?? skillLabel(skill),
    lessonUrl: grade === 10 ? `/practice/${unit}/${skill}` : `/grade-11/${unit}/${skill}`,
  };
}

/** Authoring requirements, not claims that a section already has approved teaching audio. */
export const teachingBlueprints: Record<TeachingSkill, { flow: string[]; checks: string[] }> = {
  reading: {
    flow: [
      "အကြောင်းအရာနှင့် ချိတ်ဆက်မိတ်ဆက်မယ်။",
      "English တစ်ဝါကျ → မြန်မာဘာသာပြန် → သဘာဝကျသော ဆရာရှင်းပြချက်။",
      "Contextual vocabulary၊ grammar ရွေးသုံးရသည့် အကြောင်းရင်းနှင့် ဆက်စပ်ဥပမာ။",
      "နောက်ဝါကျသို့ ချိတ်ဆက်သင်ပြီး passage အပြည့်ပြီးမှ comprehension ဖြေမယ်။",
    ],
    checks: [
      "မူရင်း English စာသားကို တစ်ကြောင်းချင်း တိုက်စစ်ပါ။",
      "စာပိုဒ်တစ်ခုလုံးကို English အရင်မဖတ်ပါနှင့်။",
      "ဘုတ်မှာ စကားစု highlight၊ မှတ်စုတိုနှင့် ဥပမာပဲ ပြပါ။",
    ],
  },
  vocabulary: {
    flow: [
      "ဖတ်စာထဲက စကားလုံးအသုံးကို အရင်ပြမယ်။",
      "အဲဒီ context ထဲက အဓိပ္ပာယ်၊ အသံထွက်နှင့် word family ကို ရှင်းမယ်။",
      "Collocation၊ လိုက်ဖက်သော preposition နှင့် ဆက်စပ် grammar ကို ဥပမာနဲ့ သင်မယ်။",
      "အဓိပ္ပာယ်တူသော်လည်း အသုံးမတူပုံ ခွဲပြပြီး ကျောင်းသားကိုယ်တိုင် ဝါကျတည်ဆောက်မယ်။",
    ],
    checks: [
      "ဘာသာပြန်စာရင်း ဖတ်ပြရုံ မဖြစ်စေရ။",
      "Textbook အသုံးနှင့် ဖြည့်စွက်ဥပမာကို ခွဲဖော်ပြပါ။",
      "စကားလုံးရဲ့ အခြားအဓိပ္ပာယ်ကို passage ထဲက အဓိပ္ပာယ်နဲ့ မရောပါနှင့်။",
    ],
  },
  grammar: {
    flow: grammarFlow,
    checks: [
      "ရှိပြီးသား grammar teaching data နှင့် textbook example ကို ပြန်သုံးပါ။",
      "Subject–verb agreement၊ punctuation နှင့် tense မပြောင်းလဲသွားကြောင်း စစ်ပါ။",
      "ရှိပြီးသား exercise checking ကို ပြန်သုံးပြီး လေ့ကျင့်ခန်းကို အစားမထိုးပါနှင့်။",
    ],
  },
  listening: {
    flow: [
      "ဘာကို နားထောင်ရှာရမလဲ အရင်လမ်းညွှန်မယ်။",
      "ရှိပြီးသား textbook recording ကို အဓိကအကြောင်းအရာသိဖို့ နားထောင်မယ်။",
      "လိုအပ်တဲ့အပိုင်းကို ပြန်ဖွင့်ပြီး အသေးစိတ်အချက် ရှာမယ်။",
      "Textbook activity ဖြေပြီးမှ transcript နဲ့ အဖြေဖြစ်ရတဲ့ အကြောင်းရင်းကို ချိတ်ရှင်းမယ်။",
    ],
    checks: [
      "မူရင်း recording ကို AI narration နဲ့ မအစားထိုးပါနှင့်။",
      "Transcript၊ audio နှင့် activity အမှန်တကယ် ကိုက်ညီမှုကို နားထောင်စစ်ပါ။",
      "နားမထောင်မီ answer/transcript အပြည့်ကို ကြိုမဖော်ပါနှင့်။",
    ],
  },
  speaking: {
    flow: [
      "Textbook situation၊ ရည်ရွယ်ချက်နှင့် model conversation ကို ရှင်းမယ်။",
      "Useful expressions နှင့် natural response ကို ဥပမာပြမယ်။",
      "ကျောင်းသား အလှည့်ကျ ပြောလေ့ကျင့်ပြီး role play လုပ်မယ်။",
      "ရှိပြီးသား speaking feedback ကို သုံးပြီး အဓိပ္ပာယ်၊ grammar၊ အသံထွက်ကို လိုအပ်သလောက် ပြန်လေ့ကျင့်မယ်။",
    ],
    checks: [
      "အဖြေတစ်မျိုးတည်း အလွတ်ကျက်စေခြင်း မဖြစ်စေရ။",
      "မူရင်း speaking activities နှင့် recording privacy ကို ထိန်းထားပါ။",
      "အမှန်တကယ် မတိုင်းတာထားသော pronunciation score ကို မတီထွင်ပါနှင့်။",
    ],
  },
  writing: {
    flow: writingFlow,
    checks: [
      "Essay အဆင်သင့် ထုတ်ပေးရုံ မဖြစ်စေရ။",
      "Textbook word target၊ format နှင့် ပေးထားသော facts ကို စစ်ပါ။",
      "Suggested answer ကို တစ်ခုတည်းသော မှန်ကန်သည့်အဖြေအဖြစ် မသတ်မှတ်ပါနှင့်။",
    ],
  },
};
