import type { GrammarSection, UnitGrammar } from "@/data/grammar/types";
import type { AdditionalUnitNumber } from "./additionalUnits";

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

const realConditionals = lesson({
  id: "grade12-unit8-real-conditionals",
  topicEn: "Zero and first conditionals",
  topicMy: "ယေဘုယျအမှန်နှင့် ဖြစ်နိုင်သော အခြေအနေ",
  rule: "အမြဲဖြစ်လေ့ရှိသော အခြေအနေနှင့် ရလဒ်ကို နှစ်ပိုင်းလုံး ပစ္စုပ္ပန်ကာလ သုံး၍ ရေးပါ။ သီးခြား အနာဂတ်ဖြစ်နိုင်ခြေအတွက် အခြေအနေတွင် ပစ္စုပ္ပန်၊ ရလဒ်တွင် အနာဂတ် အကူကြိယာ သုံးပါ။",
  reason:
    "ထပ်ခါတလဲလဲ အမှန်ဖြစ်သလား၊ နောင် တစ်ကြိမ်ဖြစ်နိုင်သလား ခွဲသိလျှင် ရလဒ်၏ ကာလကို ရွေးနိုင်သည်။",
  examples: [
    {
      en: "If the wind stops blowing, all wind turbines stop working.",
      my: "လေမတိုက်တော့လျှင် လေတာဘိုင်အားလုံး ရပ်သည်။",
    },
    {
      en: "If they are hungry, I’ll make some sandwiches.",
      my: "သူတို့ ဗိုက်ဆာလျှင် အသားညှပ်ပေါင်မုန့် လုပ်ပေးမည်။",
    },
  ],
  formula: "If + present simple, present simple / will + base verb",
  before: ["We may use public transport more.", "Our cities may be cleaner."],
  after: "Our cities will be cleaner if we use public transport more.",
  steps: [
    "အခြေအနေကို အရင် ရှာပါ။",
    "ရလဒ်က ယေဘုယျအမှန်လား၊ နောင်ဖြစ်နိုင်တာလား ဆုံးဖြတ်ပါ။",
    "အခြေအနေပြ ဝါကျခွဲ ရှေ့ရောက်လျှင် ကော်မာ ထည့်ပါ။",
  ],
  mistake: [
    "If she will not hurry, she will miss the bus.",
    "If she does not hurry, she will miss the bus.",
    "သာမန် အနာဂတ် အခြေအနေပြ အပိုင်းတွင် ရိုးရိုး ပစ္စုပ္ပန် သုံးပါ။",
  ],
  script:
    "ကဲ၊ လေမတိုက်ရင် တာဘိုင်ရပ်တယ်။ ဒီဟာက တစ်ကြိမ်အတွက် ခန့်မှန်းတာလား၊ လေမတိုက်တိုင်း ဖြစ်တာလား။ တိုက်တိုင်း ဖြစ်တာဆိုတော့ နှစ်ဖက်လုံး ရိုးရိုး ပစ္စုပ္ပန်နဲ့ ပြောပါတယ်။ အခု ဘတ်စ်ကား မီမလား ဆိုတာ ကြည့်ပါ။ ဒီနေ့ သူ အလျင်မလုပ်ရင် ကားလွတ်မယ်။ ကားလွတ်မယ်ဆိုတာ နောင်ရလဒ်ပါ။ အခြေအနေမှာ ပစ္စုပ္ပန်ထားပြီး ရလဒ်မှာ အနာဂတ်ပုံ သုံးပါ။ စာကြောင်းဆက်မီ အကြိမ်တိုင်း မှန်တာလား၊ တစ်ကြိမ် ဖြစ်နိုင်တာလားလို့ ကိုယ့်ကိုယ်ကို မေးပါ။",
  question: "If she does not hurry, she ___ the bus.",
  options: ["will miss", "would have missed", "had missed"],
  answer: "will miss",
});

const imaginedConditionals = lesson({
  id: "grade12-unit8-unreal-conditionals",
  topicEn: "Second and third conditionals",
  topicMy: "လက်ရှိနှင့် အတိတ် စိတ်ကူးအခြေအနေများ",
  rule: "ယခု သို့မဟုတ် နောင် စိတ်ကူးအတွက် အခြေအနေကို ရိုးရိုးအတိတ်၊ ရလဒ်ကို အကူကြိယာနှင့် ကြိယာအမြစ် သုံးပါ။ ပြောင်းမရသော အတိတ်အတွက် အတိတ်ပြီးစီးကာလနှင့် အတိတ်စိတ်ကူး ရလဒ်ပုံကို တွဲပါ။",
  reason:
    "အတိတ်ပုံစံကို အချိန်အတွက် သုံးတာလား၊ အဖြစ်မှန်နှင့် ကွာကြောင်း ပြဖို့ သုံးတာလား ခွဲကြည့်ပါ။",
  examples: [
    {
      en: "If I had more time, I would exercise more.",
      my: "အချိန်ပိုရလျှင် လေ့ကျင့်ခန်း ပိုလုပ်မည်။",
    },
    {
      en: "You would never have met Jamie if you hadn’t gone to the same school.",
      my: "ကျောင်းတူ မတက်ခဲ့လျှင် ဂျေမီနှင့် တွေ့ခဲ့မည် မဟုတ်ပါ။",
    },
  ],
  formula:
    "If + past simple → would + base verb · If + had + past participle → would have + past participle",
  before: ["I didn’t know you were in the hospital.", "I didn’t visit you."],
  after: "If I had known you were in the hospital, I would have visited you.",
  steps: [
    "နှစ်ခုစလုံး အတိတ်မှာ ပြီးသွားသလား စစ်ပါ။",
    "အတိတ် အဖြစ်မှန်ကို ပြောင်းစိတ်ကူးလျှင် အခြေအနေကို အတိတ်ပြီးစီးပုံထားပါ။",
    "ရလဒ်ကိုလည်း အတိတ်စိတ်ကူး ကြိယာပုံနှင့် တွဲပါ။",
  ],
  mistake: [
    "If I knew you were in hospital yesterday, I would have visited.",
    "If I had known you were in hospital yesterday, I would have visited.",
    "မနေ့က မသိခဲ့သော အခြေအနေကို အတိတ်ပြီးစီးပုံ သုံးပါ။",
  ],
  script:
    "ကားမရှိလို့ ကျောင်းကို ကားမောင်း မသွားနိုင်ဘူး။ ကားရှိတယ်လို့ စိတ်ကူးမယ်ဆိုရင် အခုကို ပြောင်းစိတ်ကူးတာပါ။ အခြေအနေမှာ အတိတ်ပုံ သုံးပေမဲ့ ပြောနေတာ အခုပါ။ မနေ့က သူငယ်ချင်း ဆေးရုံတက်မှန်း မသိလို့ မသွားခဲ့ဘူး ဆိုရင်တော့ အတိတ်ကို ပြန်ပြောင်းစိတ်ကူးတာ။ သိခဲ့ရင် သွားခဲ့မှာပေါ့လို့ ရေးမယ်။ အခြေအနေနဲ့ ရလဒ် နှစ်ခုလုံး အတိတ်စိတ်ကူးပုံ သုံးပါ။ လေ့ကျင့်ခန်းကို ဖြေခါနီး ဘယ်အချိန်ကို ပြောင်းစိတ်ကူးနေတာလဲ ဆုံးဖြတ်ပါ။",
  question: "If we had listened to the radio, we ___ the news.",
  options: ["will hear", "would hear", "would have heard"],
  answer: "would have heard",
});

const infinitivePatterns = lesson({
  id: "grade12-unit9-infinitives",
  topicEn: "Noun group + bare infinitive or to-infinitive",
  topicMy: "နာမ်စုနောက် လိုက်သည့် ကြိယာအမြစ်ပုံ နှစ်မျိုး",
  rule: "ခွင့်ပြုခြင်း၊ အတင်းလုပ်စေခြင်းနှင့် မြင်ကြားသိခြင်းပြ ကြိယာအချို့နောက်တွင် ကံနှင့် အမှတ်အသားမပါသော ကြိယာအမြစ် လိုက်သည်။ တောင်းဆို၊ ခွင့်ပြု၊ အကြံပေးသည့် အခြားကြိယာများတွင် အမှတ်အသားပါသော ကြိယာအမြစ် လိုက်သည်။",
  reason:
    "ပထမ ကြိယာကို ခွဲသိလျှင် ကံနောက်တွင် မည်သည့်ပုံ လိုက်ရမည်ကို ရွေးနိုင်သည်။ ကူညီသည်ဟူသော ကြိယာနောက် နှစ်မျိုးလုံး ရသည်။",
  examples: [
    { en: "Annie made Helen pick up the doll.", my: "အန်နီ ဟယ်လင်ကို အရုပ်ကောက်စေသည်။" },
    {
      en: "Annie asked the family to leave the room.",
      my: "အန်နီက မိသားစုကို အခန်းမှ ထွက်ရန် တောင်းဆိုသည်။",
    },
    { en: "Can you help me (to) carry this box?", my: "ဒီသေတ္တာကို သယ်ပေးနိုင်မလား။" },
  ],
  formula:
    "make / let / hear + object + base verb · ask / allow / advise + object + to + base verb",
  before: ["He went out of the room.", "She heard him."],
  after: "She heard him go out of the room.",
  steps: [
    "ကြားသည့်သူကို အဓိကဝါကျ ကတ္တားထားပါ။",
    "ထွက်သွားသူကို ကြားခြင်းပြ ကြိယာနောက် ကံအဖြစ် ထားပါ။",
    "ကံနောက် လုပ်ရပ်ကို အမြစ်ပုံ ပြန်ပြောင်းပါ။",
  ],
  mistake: [
    "They let her to eat with her hands.",
    "They let her eat with her hands.",
    "ခွင့်ပြုသည်ဟု ဆိုတိုင်း ပုံတူမဟုတ်ပါ။ မည်သည့် ပထမကြိယာ သုံးထားသလဲ စစ်ပါ။",
  ],
  script:
    "အန်နီက ဟယ်လင်ကို အရုပ်ကောက်စေတယ်။ လုပ်စေသူ အန်နီ၊ လုပ်ရသူ ဟယ်လင်၊ လုပ်ရပ်က အရုပ်ကောက်တာပါ။ အတင်းလုပ်စေတဲ့ ကြိယာ သုံးထားလို့ ကံနောက်မှာ ကြိယာ အမြစ်ပဲ ထည့်ပါ။ အန်နီက မိသားစုကို ထွက်ဖို့ တောင်းဆိုတယ်ဆိုရင်လည်း လုပ်သူနဲ့ လုပ်ရပ်ကို ခွဲပါ။ ဒီတစ်ခါ ပထမကြိယာက တောင်းဆိုတာဖြစ်လို့ လုပ်ရပ်ရှေ့ အမှတ်အသား ပါရမယ်။ နှစ်ခုလုံးမှာ လူနဲ့ လုပ်ရပ် ပါတာတူတယ်။ ဘယ်လို ဆက်ရမလဲဆိုတာ ပထမကြိယာက ဆုံးဖြတ်ပေးပါတယ်။",
  question: "The Kellers allowed Helen ___ food from other people’s plates.",
  options: ["take", "to take", "takes"],
  answer: "to take",
});

const purpose = lesson({
  id: "grade12-unit10-purpose",
  topicEn: "Connectors of purpose",
  topicMy: "ရည်ရွယ်ချက်ပြ စကားဆက်များ",
  rule: "ရည်ရွယ်ချက်ကို ကြိယာအမြစ်ပါ စကားစု သို့မဟုတ် သီးခြား ကတ္တားနှင့် ကြိယာပါ ဝါကျခွဲဖြင့် ရေးနိုင်သည်။",
  reason: "ရည်ရွယ်ချက်အပိုင်းတွင် ဘယ်သူ ဘာလုပ်မည်ကို သီးခြား ဖော်ပြဖို့ လိုသလား စစ်ပါ။",
  examples: [
    {
      en: "The student opened the window to ventilate the classroom.",
      my: "စာသင်ခန်း လေဝင်ရန် ကျောင်းသား ပြတင်းပေါက် ဖွင့်သည်။",
    },
    {
      en: "We want to get to the beach early so that we can see the sunrise.",
      my: "နေထွက်တာ မြင်နိုင်ရန် ကမ်းခြေကို စောစောရောက်ချင်သည်။",
    },
  ],
  formula: "to / in order to / so as to + base verb · so that / in order that + subject + verb",
  before: ["The teacher spoke slowly.", "The students could take down the notes."],
  after: "The teacher spoke slowly so that the students could take down the notes.",
  steps: [
    "ပထမလုပ်ရပ်နှင့် လိုချင်သော ရလဒ်ကို ခွဲပါ။",
    "ရည်ရွယ်ချက်၏ ကတ္တားက ကျောင်းသားများဖြစ်၍ ဝါကျခွဲအဖြစ် ထည့်ပါ။",
    "ဖြစ်နိုင်စွမ်းကို အကူကြိယာဖြင့် ပြပါ။",
  ],
  mistake: [
    "The teacher spoke slowly to the students could take notes.",
    "The teacher spoke slowly so that the students could take notes.",
    "ကတ္တားကြိယာပါ ဝါကျခွဲရှေ့တွင် ဝါကျခွဲဆက်စကား သုံးပါ။",
  ],
  script:
    "ပြတင်းပေါက် ဖွင့်တယ်။ ဘာအတွက်လဲ။ အခန်း လေဝင်ဖို့ပါ။ လုပ်ရပ်ကို ဘာလုပ်ဖို့လဲလို့ ဖြေလိုက်တော့ တိုတိုရေးလို့ ရတယ်။ ဆရာ ဖြည်းဖြည်း ပြောတယ်၊ ကျောင်းသားတွေ မှတ်စုလိုက်ရေးနိုင်ဖို့ဆိုရင် အပိုင်းနှစ်ခုမှာ လုပ်သူမတူဘူး။ ကျောင်းသားတွေကို သီးခြား ရေးရမယ်။ ဝါကျခွဲဆက်စကားသုံးပြီး လုပ်နိုင်တာကို ဆက်ပြပါ။ ကွက်လပ်နောက်မှာ ကြိယာအမြစ်ပဲလား၊ ကတ္တားနဲ့ ကြိယာလား စစ်ရင် ရွေးရလွယ်တယ်။",
  question: "I’ll go to bed early ___ I can get up early tomorrow.",
  options: ["to", "so that", "in order to"],
  answer: "so that",
});

const comparisons = lesson({
  id: "grade12-unit11-as-if",
  topicEn: "As if and as though",
  topicMy: "သကဲ့သို့ နှိုင်းယှဉ်သော ဝါကျများ",
  rule: "ဖြစ်နိုင်ဖွယ် အထင်နှင့် မဖြစ်နိုင်သော စိတ်ကူးကို သကဲ့သို့ ဟူသော ဆက်စကားဖြင့် နှိုင်းယှဉ်နိုင်သည်။ မဖြစ်နိုင်သော လက်ရှိ နှိုင်းယှဉ်မှုတွင် အတိတ်ပုံ၊ မဖြစ်ခဲ့သော အတိတ်အတွက် အတိတ်ပြီးစီးပုံ ရွေးနိုင်သည်။",
  reason:
    "မြင်ရ၊ ကြားရသည့် အထောက်အထားအရ ဖြစ်နိုင်သလား၊ အဖြစ်မှန်ကို သိပြီး တင်စားတာလား ဆုံးဖြတ်ပါ။",
  examples: [
    { en: "It looks as if you’ve not met before.", my: "အရင်က မဆုံဖူးပုံ ပေါ်သည်။" },
    { en: "He acts as if he were a king.", my: "ဘုရင်တစ်ပါးသကဲ့သို့ ပြုမူသည်။" },
    { en: "They looked as if they had seen a ghost.", my: "တစ္ဆေ မြင်ခဲ့သကဲ့သို့ ပုံပေါ်သည်။" },
  ],
  formula: "look / feel / sound / act + as if / as though + clause",
  before: ["They looked frightened.", "They did not see a ghost."],
  after: "They looked as if they had seen a ghost.",
  steps: [
    "မြင်ရသည့် အမူအရာကို အဓိကဝါကျ ထားပါ။",
    "မဖြစ်ခဲ့သော အတိတ်ကို အတိတ်ပြီးစီးပုံဖြင့် တင်စားပါ။",
  ],
  mistake: [
    "He acts as if were a king.",
    "He acts as if he were a king.",
    "နှိုင်းယှဉ်မှု ထည့်သော ဝါကျခွဲတွင် ကတ္တားပါရမည်။",
  ],
  script:
    "တစ်ယောက်ယောက် အိပ်ရေးမဝပုံပေါ်တယ်လို့ ပြောရင် တကယ် မအိပ်ခဲ့တာ ဖြစ်နိုင်တယ်။ ဘုရင်လို ပြုမူတယ်လို့ ပြောတာကတော့ သူ ဘုရင်မဟုတ်မှန်း သိပြီး နှိုင်းတာ။ ဒါကြောင့် အဲဒီ နှိုင်းယှဉ်ချက်မှာ အတိတ်ပုံကို သုံးပြီး စိတ်ကူးဖြစ်ကြောင်း ပြပါတယ်။ ကြောက်နေသူတွေ တစ္ဆေမြင်ခဲ့သလိုလို့ ဆိုရင် အဲဒါက အခုအမူအရာထက် စောတဲ့ မဖြစ်ခဲ့သောအရာပါ။ အတိတ်ပြီးစီးပုံ သုံးပါ။",
  question: "They did not see a ghost. They looked as if they ___ a ghost.",
  options: ["had seen", "see", "will see"],
  answer: "had seen",
});

const introductoryPhrases = lesson({
  id: "grade12-unit11-introductory-phrases",
  topicEn: "Introductory phrases",
  topicMy: "ဝါကျအစ စကားစုများ",
  rule: "အချိန်၊ နေရာ၊ တစ်ပြိုင်နက် လုပ်ရပ် သို့မဟုတ် ရည်ရွယ်ချက် စကားစုကို ရှေ့တင်၍ ဝါကျအစ အမျိုးမျိုး ရေးနိုင်သည်။",
  reason: "ဖတ်သူ အရင်သိရမည့် နောက်ခံကို ရှေ့တင်ပါ။ စကားစု၏ လုပ်သူနှင့် အဓိက ကတ္တားကို ကိုက်ညီစေပါ။",
  examples: [
    {
      en: "After the bad storm, we saw the clear blue sky.",
      my: "မုန်တိုင်းဆိုးပြီးနောက် ကြည်လင်သော ကောင်းကင် မြင်ရသည်။",
    },
    {
      en: "Leaning against the tree, he gulped down some water.",
      my: "သစ်ပင်မှီလျက် သူ ရေသောက်သည်။",
    },
    {
      en: "To run the programme, press the ‘Start’ button.",
      my: "ပရိုဂရမ် လည်ပတ်ရန် စတင်ခလုတ် နှိပ်ပါ။",
    },
  ],
  formula: "Prepositional / participle / infinitive phrase, main clause",
  before: ["She was driving to work.", "She saw a busking musician."],
  after: "Driving to work, she saw a busking musician.",
  steps: [
    "နောက်ခံ စကားစုကို ရှာပါ။",
    "ရှေ့တင်ပြီး ကော်မာ ထည့်ပါ။",
    "အစစကားစု၏ လုပ်သူကို ကော်မာနောက်တွင် ထားပါ။",
  ],
  mistake: [
    "Driving to work, a musician caught her eye.",
    "Driving to work, she saw a musician.",
    "ကားမောင်းသူကို ကော်မာနောက် ကတ္တားနေရာ ထားပါ။",
  ],
  script:
    "ကားမောင်းနေတုန်း လမ်းပေါ်က ဂီတဖျော်ဖြေသူကို မြင်တယ်ဆိုပါစို့။ စာဖတ်သူကို ဘယ်အချိန်ကလဲ အရင်ပြချင်ရင် ကားမောင်းနေစဉ် ဆိုတဲ့အပိုင်းကို ရှေ့တင်ပါ။ ပြီးမှ ကားမောင်းသူက ဘယ်သူလဲ ဆိုတာ ကော်မာနောက်မှာ ရှင်းအောင် ထားပါ။ နေရာပြ စကားစု၊ ရည်ရွယ်ချက်ပြ စကားစုကိုလည်း အဲဒီလို ရှေ့တင်နိုင်ပါတယ်။ စာကြောင်းတိုင်းကို ကတ္တားနဲ့ စရင် တူနေတတ်လို့ ဖတ်သူ အရင်သိသင့်တာကို ကြည့်ပြီး ရွေးပါ။",
  question: "___, U Soe listened to the footsteps.",
  options: ["Standing completely still", "U Soe standing", "Completely still stands"],
  answer: "Standing completely still",
});

const relatives = lesson({
  id: "grade12-unit12-relatives",
  topicEn: "Relative pronouns and relative adverbs",
  topicMy: "ဆက်စပ်နာမ်စားနှင့် ဆက်စပ်ကြိယာဝိသေသန",
  rule: "ထပ်ဖော်ပြလိုသော နာမ်နောက် ဆက်စပ်ဝါကျခွဲ ထားပါ။ လူ သို့မဟုတ် အရာကို ရည်ညွှန်းသည့် နာမ်စားက ကတ္တား၊ ကံ သို့မဟုတ် အပိုင် ဖြစ်နိုင်သည်။ နေရာ၊ အချိန်၊ အကြောင်းရင်းအတွက် သီးခြား ဆက်စကားများ ရှိသည်။",
  reason: "အရင်ဆုံး ထပ်နေသော နာမ်ကို ရှာပြီး ဆက်စပ်ဝါကျခွဲတွင် ထိုနာမ် ဘာတာဝန်ယူသလဲ စစ်ပါ။",
  examples: [
    {
      en: "The man who came to the house left flowers for you.",
      my: "အိမ်သို့ လာသော အမျိုးသားက သင့်အတွက် ပန်းများ ထားခဲ့သည်။",
    },
    {
      en: "I don’t know the man whom I met at the gate.",
      my: "တံခါးမှာ တွေ့ခဲ့သော အမျိုးသားကို မသိပါ။",
    },
    { en: "This is the village where I was born.", my: "ဤရွာသည် ကျွန်ုပ် မွေးခဲ့သော နေရာဖြစ်သည်။" },
    { en: "This is the season when roses bloom.", my: "ဤရာသီက နှင်းဆီပွင့်သော အချိန် ဖြစ်သည်။" },
  ],
  formula:
    "Noun + who / whom / whose / which / that + clause · place / time / reason + where / when / why + clause",
  before: ["This is the village.", "I was born in this village."],
  after: "This is the village where I was born.",
  steps: [
    "နှစ်ကြောင်းစလုံးတွင် ထပ်နေသော ရွာကို ရှာပါ။",
    "ဒုတိယဝါကျတွင် နေရာဖြစ်၍ နေရာပြ ဆက်စကား ရွေးပါ။",
    "ရွာနောက်တွင် ဝါကျခွဲဆက်ပြီး နေရာပြ အပိုင်းကို ထပ်မရေးပါနှင့်။",
  ],
  mistake: [
    "This is the village where I was born there.",
    "This is the village where I was born.",
    "ဆက်စကားက နေရာကို ကိုယ်စားပြုပြီးသားဖြစ်၍ ထပ်မထည့်ရပါ။",
  ],
  script:
    "ဤရွာက ကျွန်ုပ်မွေးတဲ့ရွာလို့ ရေးမယ်ဆိုရင် မူရင်း နှစ်ကြောင်းထဲ ရွာ ထပ်နေတာကို အရင် ရှာပါ။ ဒုတိယကြောင်းမှာ မွေးသူက ကျွန်ုပ်၊ ရွာက မွေးတဲ့နေရာ။ နေရာပြ ဆက်စကားကို ရွာနောက် ထည့်ပြီး ရွာကို ထပ်မရေးနဲ့။ အိမ်လာသော အမျိုးသား ဆိုရင်တော့ အမျိုးသားက လာသူ၊ ကတ္တား ပါ။ တံခါးမှာ တွေ့ခဲ့သော အမျိုးသားဆိုရင် တွေ့သူက ကျွန်ုပ်၊ အမျိုးသားက တွေ့တဲ့သူ၊ ကံ ဖြစ်ပါတယ်။ အရင် နာမ်ကို ရှာ၊ ပြီးမှ လုပ်သူလား၊ ကံလား၊ နေရာလား စစ်ပါ။",
  question: "I do not know the reason ___ he left early.",
  options: ["where", "whom", "why"],
  answer: "why",
});

export const additionalGrammar: Record<AdditionalUnitNumber, UnitGrammar> = {
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
  8: {
    unit: 8,
    topicEn: "Conditionals",
    topicMy: "အခြေအနေပြ ဝါကျများ",
    sections: [realConditionals, imaginedConditionals],
  },
  9: {
    unit: 9,
    topicEn: infinitivePatterns.titleEn,
    topicMy: infinitivePatterns.titleMy,
    sections: [infinitivePatterns],
  },
  10: { unit: 10, topicEn: purpose.titleEn, topicMy: purpose.titleMy, sections: [purpose] },
  11: {
    unit: 11,
    topicEn: "As if / as though and introductory phrases",
    topicMy: "နှိုင်းယှဉ်မှုနှင့် ဝါကျအစ စကားစုများ",
    sections: [comparisons, introductoryPhrases],
  },
  12: { unit: 12, topicEn: relatives.titleEn, topicMy: relatives.titleMy, sections: [relatives] },
};
