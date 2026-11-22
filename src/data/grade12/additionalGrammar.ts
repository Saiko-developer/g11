import type { GrammarSection, UnitGrammar } from "@/data/grammar/types";

function lesson({
  id,
  topicEn,
  topicMy,
  rule,
  reason,
  examples,
  formula,
  before,
  after,
  steps,
  mistake,
  script,
  question,
  options,
  answer,
}: {
  id: string;
  topicEn: string;
  topicMy: string;
  rule: string;
  reason: string;
  examples: { en: string; my: string }[];
  formula: string;
  before: string[];
  after: string;
  steps: string[];
  mistake: [string, string, string];
  script: string;
  question: string;
  options: string[];
  answer: string;
}): GrammarSection {
  return {
    id,
    titleEn: topicEn,
    titleMy: topicMy,
    text: {
      whatMy: [rule],
      whyMy: [reason],
      goldenRulesMy: steps,
      transformation: { beforeEn: before, afterEn: after, stepsMy: steps },
      formulas: [
        {
          labelMy: "ဝါကျတည်ဆောက်ပုံ",
          formula,
          exampleEn: examples[0].en,
          exampleMy: examples[0].my,
          parts: [],
        },
      ],
      mistakes: [{ wrongEn: mistake[0], rightEn: mistake[1], whyMy: mistake[2] }],
      examples,
    },
    oral: {
      scriptMy: script,
      note: { ideaMy: rule, formula, examples },
    },
    quiz: {
      promptMy: "သင့်တော်သော အဖြေကို ရွေးပါ။",
      questionEn: question,
      options,
      answerEn: answer,
      hintMy: reason,
    },
  };
}

const conjunctions = lesson({
  id: "grade12-unit5-adverbial-clauses",
  topicEn: "Subordinating conjunctions in adverbial clauses",
  topicMy: "ကြိယာဝိသေသန ဝါကျခွဲများတွင် သုံးသော စကားဆက်များ",
  rule: "ကြိယာဝိသေသန ဝါကျခွဲက အဓိကဝါကျရှိ လုပ်ရပ်၏ အချိန်၊ အကြောင်းရင်း၊ ရည်ရွယ်ချက်၊ အခြေအနေ သို့မဟုတ် ဆန့်ကျင်သဘောကို ဖော်ပြသည်။",
  reason:
    "ဆက်လိုက်မည့် အပိုင်းက ဘာကြောင့်လဲ၊ ဘယ်အချိန်လဲ၊ ဘာလုပ်နိုင်ဖို့လဲဆိုတာ ခွဲကြည့်လျှင် မှန်ကန်သော စကားဆက်ကို ရွေးနိုင်သည်။",
  examples: [
    { en: "When I reach the station, I will give you a call.", my: "ဘူတာရောက်လျှင် ဖုန်းခေါ်မည်။" },
    {
      en: "She decided not to go to school because she was too sick.",
      my: "နေမကောင်းလွန်း၍ သူမ ကျောင်းမသွားရန် ဆုံးဖြတ်ခဲ့သည်။",
    },
  ],
  formula: "Conjunction + subject + verb, main clause",
  before: ["We left rather late.", "We arrived on time."],
  after: "Although we left rather late, we arrived on time.",
  steps: [
    "အဓိကပြောလိုသော ရလဒ်နှင့် ဝါကျခွဲက ပေးသော အခြေအနေကို အရင် ခွဲပါ။",
    "နောက်ကျထွက်သော်လည်း အချိန်မီရောက်သည်။ မျှော်လင့်ထားသည်နှင့် ဆန့်ကျင်သောကြောင့် သော်လည်းဟူသော စကားဆက်ကို ရွေးပါ။",
    "ဝါကျခွဲကို ရှေ့ထားလျှင် ကော်မာဖြင့် ခွဲပါ။ တစ်ခါတည်း ဆန့်ကျင်သဘောပြ စကားဆက်နှစ်ခု မထည့်ပါနှင့်။",
  ],
  mistake: [
    "Although we left late, but we arrived on time.",
    "Although we left late, we arrived on time.",
    "ရှေ့ဝါကျခွဲက ဆန့်ကျင်သဘောကို ပေးပြီးသားဖြစ်၍ အဓိကဝါကျရှေ့တွင် ထပ်မံ မထည့်ရပါ။",
  ],
  script:
    "ကဲ၊ သားတို့ သမီးတို့ရေ၊ ဘတ်စ်ကားမှတ်တိုင်မှာ သူငယ်ချင်းရောက်တဲ့အထိ စောင့်တယ်လို့ စဉ်းစားကြည့်ပါ။ အဓိကလုပ်ရပ်က စောင့်တာနော်။ သူငယ်ချင်းရောက်တဲ့အထိ ဆိုတဲ့အပိုင်းက စောင့်တာ ဘယ်အချိန်ဆုံးသလဲ ဖြေပေးတယ်။ ဒါဆို အချိန်အဆုံးကို ပြတဲ့ စကားဆက်ကို ရွေးရမယ်။ နောက်တစ်ခုပဲ။ အိမ်က နောက်ကျထွက်တယ်။ အချိန်မီ ရောက်တယ်။ နောက်ကျထွက်လို့ အချိန်မီရောက်တာလား။ မဟုတ်ဘူး။ နောက်ကျထွက်ပေမဲ့ ရောက်တာ။ ဒါကြောင့် သော်လည်း ဆိုတဲ့ သဘောကို သုံးတာပါ။ စကားဆက်ကို အရင်မရွေးနဲ့။ အပိုင်းနှစ်ခု ဘယ်လို ဆက်နွှယ်သလဲလို့ အရင်မေးပါ။",
  question: "We ran into an old friend ___ we were waiting for the ferry.",
  options: ["where", "while", "so that"],
  answer: "while",
});

const concession = lesson({
  id: "grade12-unit6-no-matter",
  topicEn: "No matter + wh-word",
  topicMy: "အခြေအနေ မည်သို့ပင် ဖြစ်စေ",
  rule: "အခြေအနေ ဘယ်လို ပြောင်းပြောင်း အဓိကရလဒ်က အတူတူ ဖြစ်နေကြောင်း ပြောသည့် ပုံစံ ဖြစ်သည်။",
  reason:
    "ပြောင်းနိုင်သည့် အရာကို ခွဲပါ။ လူ၊ နေရာ၊ ရွေးချယ်မှု သို့မဟုတ် အတိုင်းအတာ ဘာလဲ သိလျှင် သက်ဆိုင်ရာ စကားလုံး ရွေးနိုင်သည်။",
  examples: [
    {
      en: "No matter how hard I work, I never stand first in the class.",
      my: "မည်မျှပင် ကြိုးစားပါစေ အတန်းထဲတွင် ပထမ မရပါ။",
    },
    {
      en: "No matter whether we recognise it or not, AI is everywhere.",
      my: "အသိအမှတ်ပြုသည်ဖြစ်စေ မပြုသည်ဖြစ်စေ ဉာဏ်ရည်တု နေရာတိုင်း ရှိသည်။",
    },
  ],
  formula: "No matter + wh-clause, main clause",
  before: ["Time flies too fast.", "Our friendship lasts forever."],
  after: "No matter how fast time flies, our friendship lasts forever.",
  steps: [
    "မပြောင်းသည့် ရလဒ်ကို အဓိကဝါကျ၌ ထားပါ။",
    "အတိုင်းအတာကို ဖော်ပြသော ပုံစံတွင် နာမဝိသေသန သို့မဟုတ် ကြိယာဝိသေသနကို ကတ္တားရှေ့ ရွှေ့ပါ။",
    "ဝါကျခွဲတွင် မေးခွန်းပြောင်းစဉ်ကဲ့သို့ ကြိယာနှင့် ကတ္တား နေရာမလဲပါနှင့်။ အနာဂတ်ကို ပြောသော်လည်း ဝါကျခွဲတွင် ပစ္စုပ္ပန်ပုံစံ သုံးပါ။",
  ],
  mistake: [
    "No matter how hard do I work, I never stand first.",
    "No matter how hard I work, I never stand first.",
    "ကတ္တားနောက် ကြိယာလိုက်သော ဝါကျအစဉ်ကို သုံးပါ။ အမေးဝါကျ အကူကြိယာ မလိုပါ။",
  ],
  script:
    "ကဲ၊ မိတ်ဆွေတစ်ယောက်က အနိုင်ရရ၊ ရှုံးရှုံး ကိုယ့်အနားမှာ ရှိတယ်ဆိုပါစို့။ ပြောင်းနိုင်တာက အနိုင်ရမလား ရှုံးမလားဆိုတာ။ မပြောင်းတာက သူ အနားမှာ ရှိတာ။ ဒီနှစ်ခုကို ခွဲတတ်ရင် ပုံစံတစ်ဝက် ရပြီ။ အနိုင်နဲ့ အရှုံးလို ရွေးစရာနှစ်ခုကို ပြောမယ်ဆို တစ်မျိုးကို သုံးပါ။ ဘယ်လောက် ကြိုးစားကြိုးစား ဆိုရင် အတိုင်းအတာကို မေးပါတယ်။ အဲဒီအတိုင်းအတာ ပြတဲ့ စကားနောက်မှာ ကြိုးစားတဲ့ပုံကို အရင်ထား၊ ပြီးမှ ဘယ်သူ ဘာလုပ်တယ် ဆိုတာ ပြောပါ။ မေးခွန်း လုပ်နေတာ မဟုတ်တဲ့အတွက် ကတ္တားအရင် ကြိယာနောက်ပါ။",
  question: "___ the foods are hidden, my brothers will find them in no time.",
  options: ["no matter who", "no matter where", "no matter how"],
  answer: "no matter where",
});

const causeVerbs = lesson({
  id: "grade12-unit7-cause-verbs",
  topicEn: "Verbs of cause and effect",
  topicMy: "အကြောင်းနှင့် အကျိုးပြ ကြိယာများ",
  rule: "အကြောင်းပြ ကြိယာသည် ဖြစ်ရပ်တစ်ခုက နောက်ရလဒ်တစ်ခုကို ဖြစ်ပေါ်စေပုံကို ချိတ်ဆက်ပြသည်။",
  reason: "ဘယ်ဖြစ်ရပ်က အစဖြစ်ပြီး ဘာဖြစ်လာသလဲ ခွဲပါ။ အခံဝါကျတွင် ရလဒ်ကို ရှေ့တင်နိုင်သည်။",
  examples: [
    {
      en: "The severe cyclonic storm Nargis caused great damage.",
      my: "ပြင်းထန်သော နာဂစ်မုန်တိုင်းက အပျက်အစီးများစွာ ဖြစ်စေခဲ့သည်။",
    },
    { en: "Smoking can lead to lung cancer.", my: "ဆေးလိပ်သောက်ခြင်းက အဆုတ်ကင်ဆာ ဖြစ်စေနိုင်သည်။" },
  ],
  formula: "Cause + cause / lead to / result in / bring about + effect",
  before: ["There was a severe cyclonic storm.", "There was great damage."],
  after: "The severe cyclonic storm Nargis caused great damage.",
  steps: [
    "နှစ်ခုအနက် ဘယ်ဖြစ်ရပ်က နောက်ဖြစ်ရပ်ကို ဖြစ်စေသလဲ ရှာပါ။",
    "အပြုဝါကျတွင် အကြောင်းကို ကတ္တားထားပြီး အကျိုးကို ကြိယာနောက် ထည့်ပါ။",
    "အကျိုးကို ဦးစားပေးမည်ဆိုလျှင် ဖြစ်စေခံရပုံကို အခံဝါကျဖြင့် ရေးနိုင်သည်။",
  ],
  mistake: [
    "Smoking can lead lung cancer.",
    "Smoking can lead to lung cancer.",
    "ရလဒ်နှင့် ဆက်စပ်သည့် ဤကြိယာတွဲတွင် ဝိဘတ် လိုသည်။",
  ],
  script:
    "ကဲ၊ နာဂစ်မုန်တိုင်းနဲ့ အပျက်အစီးကို ကြည့်ရအောင်။ အပျက်အစီးကြောင့် မုန်တိုင်းဖြစ်တာလား၊ မုန်တိုင်းကြောင့် အပျက်အစီး ဖြစ်တာလား။ အဲဒီမေးခွန်းနဲ့ အကြောင်းကို ရှာပါ။ မုန်တိုင်းကို အရင်ထားရင် အကြောင်းက ကတ္တား။ ပြီးရင် ဖြစ်စေတဲ့ ကြိယာ ထည့်ပြီး အပျက်အစီးကို နောက်မှာထားပါ။ တစ်ခါတလေ ဖတ်သူကို ရလဒ် အရင်ပြချင်မယ်။ အဲဒီအခါ အကျိုးကို ရှေ့တင်ပြီး ဘာကြောင့် ဖြစ်လဲ နောက်က ပြန်ဆက်ပါတော့။",
  question: "A sudden change in temperature will ___ torrential rain.",
  options: ["result in", "result from", "because"],
  answer: "result in",
});

const causeLinks = lesson({
  id: "grade12-unit7-cause-links",
  topicEn: "Linking words for cause and effect",
  topicMy: "အကြောင်းနှင့် အကျိုးပြ စကားဆက်",
  rule: "အကြောင်းပြ စကားဆက်အချို့နောက်တွင် ကတ္တားနှင့် ကြိယာပါ ဝါကျခွဲ လိုက်ပြီး အချို့နောက်တွင် နာမ်စကားစု လိုက်သည်။ အကျိုးဆက်ပြ စကားဆက်အချို့ဖြင့် ဒုတိယဝါကျကို စနိုင်သည်။",
  reason:
    "စကားဆက်နောက် ဘာပုံစံ လိုက်မလဲနှင့် အကြောင်းကို ထည့်မလား၊ အကျိုးကို ထည့်မလား အရင် ဆုံးဖြတ်ပါ။",
  examples: [
    {
      en: "Because the alarm did not go off, we were late for school.",
      my: "နှိုးစက် မမြည်သောကြောင့် ကျောင်းနောက်ကျခဲ့သည်။",
    },
    {
      en: "I stayed at home because of the heavy rain.",
      my: "မိုးသည်းသောကြောင့် အိမ်မှာ နေခဲ့သည်။",
    },
    {
      en: "She made a big mistake, and as a result, the teacher punished her.",
      my: "အမှားကြီးလုပ်မိသဖြင့် ဆရာမ အပြစ်ပေးခဲ့သည်။",
    },
  ],
  formula: "because + clause · because of + noun / -ing · as a result, + effect clause",
  before: ["There was a heavy rain.", "The roads were flooded."],
  after: "The roads were flooded as a result of the heavy rain.",
  steps: [
    "မူလဝါကျနှစ်ခုတွင် အကြောင်းနှင့် အကျိုးကို ခွဲပါ။",
    "နာမ်လိုက်ရသော ပုံစံဖြစ်လျှင် အကြောင်းကို နာမ်စကားစုအဖြစ် ပြောင်းပါ။",
    "သီးခြား အကျိုးဝါကျစမည့် စကားဆက်ဖြစ်လျှင် အကြောင်းအရင်ရေးပြီး ကော်မာနောက် အကျိုးကို ဖော်ပြပါ။",
  ],
  mistake: [
    "I stayed at home because of it was raining.",
    "I stayed at home because of the rain.",
    "နာမ်စကားစု လိုက်ရမည့်နေရာတွင် ကတ္တားကြိယာပါ ဝါကျခွဲ မထည့်ရပါ။",
  ],
  script:
    "ကဲ၊ မိုးသည်းလို့ အိမ်မှာ နေခဲ့တယ်။ ဒီသဘောကို နှစ်မျိုး ပြောနိုင်တယ်။ မိုးသည်းနေတယ်လို့ ကတ္တားနဲ့ ကြိယာပါအောင် ပြောမလား၊ မိုးသည်းမှုဆိုတဲ့ နာမ်စုနဲ့ ပြောမလား။ အနက်တူပေမဲ့ ရှေ့က စကားဆက် မတူပါဘူး။ အကြောင်းကို ဝါကျတစ်ကြောင်းနဲ့ ဖော်ပြပြီးရင် သူ့အကျိုးဆက်က ဘာလဲဆိုတာ နောက်တစ်ကြောင်းနဲ့ ဖြေလို့ရတယ်။ လေ့ကျင့်ခန်းမှာ ကွင်းထဲ ပေးထားတာကို ကြည့်ပါ။ နောက်က လိုက်ရမယ့်ပုံကို ရွေးပြီးမှ မူလစာကြောင်းကို ပြောင်းပါ။",
  question: "The football match was cancelled ___ the extremely bad weather.",
  options: ["because", "consequently", "owing to"],
  answer: "owing to",
});

export const additionalGrammar: Record<5 | 6 | 7, UnitGrammar> = {
  5: {
    unit: 5,
    topicEn: conjunctions.titleEn,
    topicMy: conjunctions.titleMy,
    sections: [conjunctions],
  },
  6: { unit: 6, topicEn: concession.titleEn, topicMy: concession.titleMy, sections: [concession] },
  7: {
    unit: 7,
    topicEn: "Cause and effect",
    topicMy: "အကြောင်းနှင့် အကျိုး",
    sections: [causeVerbs, causeLinks],
  },
};
