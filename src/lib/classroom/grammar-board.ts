import foundations from "@/data/classroom/grammar-rule-foundations.json";
import { stepAt, type ReadingLesson } from "./types";

export type GrammarBoardPart = {
  text: string;
  role?: "subject" | "appositive" | "verb" | "punctuation" | "neutral" | "noun" | "modifier";
  label?: string;
};
export type GrammarBoardCue = {
  stage: string;
  title: string;
  focus: string;
  notes: { label: string; text: string }[];
  formulas?: string[];
  parts?: GrammarBoardPart[];
  example?: boolean;
  comparison?: { title: string; pattern: string; reason: string }[];
  check: string;
};
const mySon: GrammarBoardPart[] = [
  { text: "My son", role: "subject", label: "အဓိက subject" },
  { text: ", ", role: "punctuation" },
  { text: "a musician", role: "appositive", label: "ထပ်ဖော်ပြသော နာမ်စု" },
  { text: ", ", role: "punctuation" },
  { text: "earns", role: "verb", label: "main verb" },
  { text: " little and lives with me.", role: "neutral" },
];
const apposition: GrammarBoardCue[][] = [
  [
    {
      stage: "ခေါင်းစဉ်",
      title: "Nouns in Apposition",
      focus: "နာမ်တစ်ခုကို နောက်နာမ်စုတစ်ခုနဲ့ ထပ်ဖော်ပြမယ်။",
      notes: [
        { label: "Meaning", text: "နာမ်စုနှစ်ခုက လူတစ်ဦး၊ နေရာတစ်ခု၊ အရာတစ်ခုတည်းကို ညွှန်းရမယ်။" },
        { label: "ဒီအပိုင်းမှာ", text: "Noun → noun phrase → referent တူညီမှု" },
      ],
      formulas: ["Noun A ↔ Noun phrase B"],
      check: "ဒီနာမ်စုနှစ်ခုက တစ်ဦးတည်း၊ တစ်ခုတည်းကို ညွှန်းသလား?",
    },
    {
      stage: "အခြေခံ",
      title: "Noun နဲ့ Noun phrase ကို ခွဲကြည့်မယ်",
      focus: "အဓိကနာမ်နဲ့ အဲဒီနာမ်ကို ဖြည့်ဖော်ပြတဲ့ စကားလုံးတွေကို မြင်အောင်ကြည့်ပါ။",
      notes: [
        { label: "Noun", text: "teacher · musician · country" },
        { label: "Noun phrase", text: "our English teacher — နာမ်ကို အဓိကထားဖွဲ့ထားသော စကားစု" },
      ],
      parts: [
        { text: "our", role: "modifier", label: "ဘယ်သူ့ရဲ့လဲ" },
        { text: "English", role: "modifier", label: "ဘယ်လိုဆရာလဲ" },
        { text: "teacher", role: "noun", label: "အဓိကနာမ်" },
      ],
      check: "ဒီနာမ်စုထဲက အဓိကနာမ်က ဘာလဲ?",
    },
    {
      stage: "အဓိပ္ပာယ်",
      title: "ဖော်ပြချက်နှစ်ခု၊ လူတစ်ယောက်တည်း",
      focus: "အမည်နဲ့ ဘယ်သူလဲဆိုတဲ့ ဖော်ပြချက်ကို တစ်ဦးတည်းအဖြစ် ဆက်စပ်ကြည့်ပါ။",
      notes: [
        { label: "အမည်", text: "U Tun Tun" },
        { label: "ဘယ်သူလဲ", text: "our English teacher" },
      ],
      formulas: ["U Tun Tun ↔ our English teacher"],
      check: "ဒုတိယနာမ်စုက ပထမနာမ်ကို အမည်ပြောင်းဖော်ပြနေတာလား?",
    },
    {
      stage: "ခွဲသိမယ်",
      title: "နာမ်နှစ်ခု တွေ့တိုင်း Apposition မဟုတ်",
      focus: "ဘေးချင်းကပ်နေရုံနဲ့ မဆုံးဖြတ်ပါနဲ့။ ရည်ညွှန်းချက် တူမတူကို စစ်ပါ။",
      notes: [
        {
          label: "အဓိက rule",
          text: "Apposition မှာ referent တစ်ခုတည်းကို နာမ်စုနှစ်ခုနဲ့ ဖော်ပြတယ်။",
        },
      ],
      comparison: [
        {
          title: "နှစ်ဦး ဖြစ်နိုင်",
          pattern: "my brother and my teacher",
          reason: "and နဲ့ ချိတ်ထားတာက ပုံမှန်အားဖြင့် လူနှစ်ဦးကို ဆိုနိုင်တယ်။",
        },
        {
          title: "တစ်ဦးတည်းကို ဖော်ပြ",
          pattern: "U Tun Tun ↔ our English teacher",
          reason: "အမည်နဲ့ ဖော်ပြချက်က လူတစ်ဦးတည်းကို ညွှန်းတယ်။",
        },
      ],
      check: "ဒုတိယနာမ်စုက လူအသစ်တစ်ယောက်လား၊ မူရင်းလူကိုပဲ ဖော်ပြတာလား?",
    },
  ],
  [
    {
      stage: "ရည်ရွယ်ချက်",
      title: "နာမ်အကြောင်း ပိုရှင်းအောင် ဖော်ပြမယ်",
      focus: "အမည်၊ အလုပ်၊ အမျိုးအစား စတဲ့ အချက်အလက်ကို နာမ်ဘေးမှာ ထပ်ဖြည့်နိုင်တယ်။",
      notes: [{ label: "ဘာအတွက်လဲ", text: "ဖတ်သူက ဘယ်သူ၊ ဘာလဲဆိုတာ ပိုနားလည်စေဖို့။" }],
      formulas: ["Noun + appositive noun phrase"],
      check: "ဒီနာမ်အကြောင်း ဖတ်သူ ထပ်သိလာတဲ့အချက်က ဘာလဲ?",
    },
    {
      stage: "နမူနာကို ကြည့်မယ်",
      title: "My son ကို ဘယ်နာမ်စုက ဖော်ပြသလဲ?",
      focus: "a musician က လူသစ် မဟုတ်ပါ။ My son အကြောင်း ထပ်သိစေတဲ့ နာမ်စုပါ။",
      notes: [
        { label: "ရည်ညွှန်းချက်", text: "My son = a musician" },
        {
          label: "ဝါကျရဲ့ အဓိကအပိုင်း",
          text: "Subject နဲ့ main verb ကို အပိုရှင်းချက်ကြားကနေ ခွဲမြင်ပါ။",
        },
      ],
      parts: mySon,
      example: true,
      check: "a musician က ဘယ်နာမ်ကို ထပ်ဖော်ပြနေတာလဲ?",
    },
    {
      stage: "နေရာ",
      title: "ဖော်ပြခံရတဲ့ နာမ်ဘေးမှာ ထားမယ်",
      focus:
        "Subject နောက်မှာပဲ ထားရမယ်လို့ မမှတ်ပါနဲ့။ ဘယ်နာမ်ကို ရှင်းပြချင်သလဲက နေရာကို ဆုံးဖြတ်တယ်။",
      notes: [
        {
          label: "ဖော်ပြခံရသောနာမ်",
          text: "Subject၊ object၊ preposition နောက်က noun လည်း ဖြစ်နိုင်တယ်။",
        },
        { label: "အနီးကပ်ထား", text: "ရှင်းပြချက်က ဘယ်နာမ်နဲ့ ဆက်နွှယ်လဲ ဖတ်သူမြင်ရမယ်။" },
      ],
      formulas: ["Finland ↔ the land of a thousand lakes"],
      check: "ဒီ phrase က Finland ကို ဖော်ပြတာလား၊ လူအကြောင်းကို ဖော်ပြတာလား?",
    },
    {
      stage: "နာမ်စုအပြည့်",
      title: "လိုအပ်တဲ့ စကားလုံးတွေ မကျန်စေနဲ့",
      focus: "Noun phrase ကို အပြည့်ယူပါ။ Main verb ပါတဲ့ ဝါကျတစ်ကြောင်းနဲ့ မရောပါနဲ့။",
      notes: [
        {
          label: "အပြည့်ယူရန်",
          text: "Article၊ possessive နဲ့ modifier တွေက phrase ရဲ့ အစိတ်အပိုင်းတွေပါ။",
        },
        { label: "သတိထား", text: "Apposition တိုင်းရှေ့ a / the ထည့်ရမယ်ဆိုတဲ့ rule မရှိပါ။" },
      ],
      parts: [
        { text: "our", role: "modifier", label: "မချန်ပါနဲ့" },
        { text: "English", role: "modifier" },
        { text: "teacher", role: "noun", label: "head noun" },
      ],
      check: "Phrase ထဲမှာ လိုအပ်တဲ့ determiner နဲ့ modifier တွေ ပြည့်သလား?",
    },
  ],
  [
    {
      stage: "ခေါင်းစဉ်",
      title: "Identifying information နဲ့ Comma",
      focus: "Comma ထည့်မထည့်ကို phrase ရဲ့ အလုပ်နဲ့ context ကို ကြည့်ပြီး ဆုံးဖြတ်မယ်။",
      notes: [
        { label: "ခွဲကြည့်မယ်", text: "Identifying information / extra information" },
        { label: "နေရာပါ စစ်မယ်", text: "အပိုရှင်းချက်ရဲ့ အစနဲ့အဆုံးကို ကြည့်မယ်။" },
      ],
      check: "ဒီ phrase က ဘယ်သူလဲ ခွဲပေးတာလား၊ အပိုရှင်းတာလား?",
    },
    {
      stage: "ခွဲသတ်မှတ်ချက်",
      title: "ဘယ်သူလဲဆိုတာ သိဖို့ လိုသလား?",
      focus: "Identifying information က အများကြားက ဘယ်သူကိုပြောနေလဲ ခွဲသတ်မှတ်ပေးတယ်။",
      notes: [
        { label: "ဥပမာ context", text: "သူငယ်ချင်းများထဲက Aye Aye ကို ခွဲသတ်မှတ်ရန် အမည်လိုတယ်။" },
        { label: "Comma", text: "ဒီ identifying အသုံးမှာ ပုံမှန်အားဖြင့် comma မခံပါ။" },
      ],
      parts: [
        { text: "my friend", role: "subject", label: "ဘယ်သူငယ်ချင်းလဲ" },
        { text: "Aye Aye", role: "appositive", label: "ခွဲသတ်မှတ်ပေးသော အမည်" },
      ],
      check: "အမည်ကို ဖယ်လိုက်ရင် ဘယ်သူကို ဆိုလိုသလဲ လိုအပ်သလောက် ရှင်းနေသေးလား?",
    },
    {
      stage: "ထပ်ဖြည့်ရှင်းချက်",
      title: "Extra information ကို Comma နဲ့ ခွဲမယ်",
      focus: "သတ်မှတ်ပြီးသားသူအကြောင်း အပိုအချက်အလက် ဖြည့်ပြတာနဲ့ ခွဲသတ်မှတ်ပေးတာကို မရောပါနဲ့။",
      notes: [
        { label: "အပိုအချက်", text: "a musician ကို အပိုရှင်းချက်အဖြစ် ထည့်ထားသည်။" },
        {
          label: "အဓိပ္ပာယ်ပါ စစ်",
          text: "Phrase ဖယ်လို့ ဝါကျသဒ္ဒါပြည့်ရုံနဲ့ မလုံလောက်ပါ။ ဘယ်သူကိုပြောနေလဲ ရှင်းလားပါ စစ်ပါ။",
        },
      ],
      comparison: [
        {
          title: "Identifying",
          pattern: "my friend Aye Aye",
          reason: "ဘယ်သူကိုပြောလဲ ခွဲသတ်မှတ်ဖို့ လိုသည်။",
        },
        {
          title: "Extra information",
          pattern: "My son, a musician, …",
          reason: "သတ်မှတ်ထားသူအပေါ် အပိုရှင်းချက် ဖြည့်ထားသည်။",
        },
      ],
      check: "ဒီ phrase ရဲ့ အလုပ်က identifying လား၊ extra information လား?",
    },
    {
      stage: "Comma နယ်နိမိတ်",
      title: "အပိုရှင်းချက်ရဲ့ အစနဲ့အဆုံးကို ကြည့်မယ်",
      focus: "ဝါကျအလယ်နဲ့ အဆုံးမှာ punctuation ပိတ်ပုံ ကွာတယ်။",
      notes: [
        {
          label: "Context",
          text: "ဒီပုံစံတွေက extra information အတွက်ပါ။ Apposition အားလုံးအတွက် အမြဲမဟုတ်ပါ။",
        },
      ],
      comparison: [
        {
          title: "ဝါကျအလယ်",
          pattern: "Noun, extra information, main clause …",
          reason: "အပိုရှင်းချက်ကို comma နှစ်ဖက်နဲ့ ခွဲထားသည်။",
        },
        {
          title: "ဝါကျအဆုံး",
          pattern: "… Noun, extra information.",
          reason: "ရှေ့မှာ comma၊ အဆုံးမှာ full stop နဲ့ ပိတ်သည်။",
        },
      ],
      check: "အပိုရှင်းချက် ဘယ်မှာစပြီး ဘယ်မှာဆုံးသလဲ?",
    },
  ],
  [
    {
      stage: "ခေါင်းစဉ်",
      title: "Agreement နဲ့ Rule အသုံးချမှု",
      focus: "Main subject ကို ခွဲမြင်ပြီး နာမ်စု၊ အဓိပ္ပာယ်နဲ့ punctuation ကို ပြန်စစ်မယ်။",
      notes: [
        { label: "အဓိက", text: "Appositive phrase ထည့်ခြင်းကြောင့် main subject မပြောင်းပါ။" },
      ],
      check: "ကိုယ့်အဖြေထဲမှာ main subject နဲ့ main verb ကို ပြန်ရှာနိုင်သလား?",
    },
    {
      stage: "Subject–verb agreement",
      title: "Main subject ကို ပြန်ရှာမယ်",
      focus: "Verb နဲ့ အနီးဆုံးနာမ်ကိုပဲ မကြည့်ပါနဲ့။ အဓိက subject အလိုက် verb ရွေးရမယ်။",
      notes: [
        { label: "မူရင်း subject", text: "My son → singular" },
        { label: "အပိုရှင်းချက်", text: "Appositive phrase ထည့်လို့ main subject မပြောင်းပါ။" },
      ],
      formulas: ["Main subject → main verb agreement"],
      parts: [
        { text: "My son", role: "subject", label: "agreement ကို ဆုံးဖြတ်" },
        { text: "a musician", role: "appositive", label: "အပိုရှင်းချက်" },
      ],
      check: "Main verb ကို ဘယ် subject နဲ့ ညှိရမလဲ?",
    },
    {
      stage: "Rule နဲ့ စစ်မယ်",
      title: "Apposition ကို ခွဲသိဖို့ စစ်ဆေးချက်",
      focus: "Phrase ရှာရုံနဲ့ မပြီးပါ။ ရည်ညွှန်းချက်နဲ့ ဝါကျထဲက အလုပ်ကိုပါ ရှင်းနိုင်ရမယ်။",
      notes: [
        { label: "၁ · Noun", text: "ဘယ်နာမ်ကို ထပ်ဖော်ပြထားလဲ?" },
        { label: "၂ · Phrase", text: "နာမ်စု ဘယ်ကနေ ဘယ်အထိလဲ?" },
        { label: "၃ · Meaning", text: "Referent တူလား? Identifying လား၊ extra information လား?" },
      ],
      check: "Phrase ရဲ့အလုပ်ကို ကိုယ့်စကားနဲ့ ရှင်းနိုင်သလား?",
    },
    {
      stage: "အသုံးချမယ်",
      title: "Rule နားလည်ပြီးမှ ဝါကျမှာ အသုံးချမယ်",
      focus: "ပြောင်းရေးပြီးရင် မူရင်းအဓိပ္ပာယ်နဲ့ tense မပြောင်းကြောင်း ပြန်စစ်ပါ။",
      notes: [
        {
          label: "စဉ်းစားမည့် အစီအစဉ်",
          text: "Referent ရှာ → noun phrase ရွေး → သက်ဆိုင်ရာနာမ်ဘေးထား",
        },
        { label: "နောက်ဆုံး စစ်ရန်", text: "Meaning · main clause · agreement · comma" },
      ],
      formulas: ["Referent → phrase → position → meaning / punctuation"],
      check: "ဒီ rule ကို ဘာကြောင့်ရွေးသုံးတာလဲ ရှင်းပြနိုင်သလား?",
    },
  ],
];

function sentences(text: string) {
  return text
    .split("။")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s + "။");
}
/** Presentation only: never attach board cues to lesson objects or change their publication/audio hashes. */
export function grammarBoardCue(lesson: ReadingLesson, cursor: number): GrammarBoardCue {
  const { segment, stage, text } = stepAt(lesson, cursor);
  if (lesson.grade === 10 && lesson.unit === 1) return apposition[segment.paragraph - 1][stage];
  const foundation = (
    foundations as Record<
      string,
      {
        sections: {
          title: string;
          meaning: string[];
          why: string[];
          rules: string[];
          patterns: string[];
          cautions: string[];
        }[];
      }
    >
  )[`${lesson.grade}:${lesson.unit}`];
  const topic = foundation.sections[segment.paragraph - 1];
  const rules = topic.rules.filter((rule) => text.includes(rule));
  const cautions = topic.cautions.filter((rule) => text.includes(rule));
  const formulas = topic.patterns
    .filter((pattern) => text.includes(pattern))
    .flatMap((p) =>
      p
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  const ruleStage = formulas.length > 0 || rules.length > 0;
  const source =
    stage === 0
      ? []
      : ruleStage
        ? rules
        : cautions.length
          ? cautions
          : sentences(text).filter((s) => !/^ကဲ၊|^အခု |^ဒီအပိုင်းမှာ|^ပြီးရင် စာအုပ်/.test(s));
  const notes = source.slice(0, 2).map((s, i) => ({
    label: ruleStage
      ? `Rule ${i + 1}`
      : cautions.length
        ? `သတိထားရန် ${i + 1}`
        : `အဓိကအချက် ${i + 1}`,
    text: s,
  }));
  return {
    stage:
      stage === 0
        ? "ခေါင်းစဉ်"
        : ruleStage
          ? "Rule & Form"
          : cautions.length
            ? "ခွဲသိ / စစ်ဆေး"
            : "အဓိပ္ပာယ်နဲ့ ရွေးသုံးပုံ",
    title: topic.title,
    focus:
      stage === 0
        ? "အဓိပ္ပာယ်၊ ပုံစံနဲ့ ဘယ်အခြေအနေမှာ သုံးရလဲဆိုတာ ဆက်စပ်ကြည့်မယ်။"
        : ruleStage
          ? "Formula ရဲ့ အစိတ်အပိုင်းတစ်ခုချင်းနဲ့ အသုံးချရတဲ့ အကြောင်းရင်းကို တွဲကြည့်ပါ။"
          : "ဆရာပြောနေတဲ့ အဓိကအချက်ကို ကြည့်ပြီး ဘာကြောင့် ဒီပုံစံရွေးရလဲ စဉ်းစားပါ။",
    notes,
    formulas,
    check: ruleStage
      ? "ဒီ rule ကို သုံးနိုင်ဖို့ ဘယ်အဓိပ္ပာယ်နဲ့ ဘယ်အခြေအနေ လိုသလဲ?"
      : "အခုရှင်းပြတဲ့အချက်ကို မူရင်းစာအုပ်နမူနာထဲမှာ ဘယ်နေရာတွေ့သလဲ?",
  };
}
/** Split formula slots while keeping optional (+...) and bracketed phrases intact. */
export function grammarFormulaParts(formula: string): string[] {
  const parts: string[] = [];
  let start = 0,
    depth = 0;
  for (let i = 0; i < formula.length; i++) {
    if (formula[i] === "[" || formula[i] === "(") depth++;
    if (formula[i] === "]" || formula[i] === ")") depth = Math.max(0, depth - 1);
    if (["+", "→", "↔"].includes(formula[i]) && depth === 0) {
      if (formula.slice(start, i).trim()) parts.push(formula.slice(start, i).trim());
      parts.push(formula[i]);
      start = i + 1;
    }
  }
  if (formula.slice(start).trim()) parts.push(formula.slice(start).trim());
  return parts;
}
