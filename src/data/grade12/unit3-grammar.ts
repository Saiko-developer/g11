import type { GrammarSection, UnitGrammar } from "@/data/grammar/types";

type Lesson = {
  id: string;
  title: string;
  titleMy: string;
  rule: string;
  why: string;
  check: string;
  spoken: string;
  formula: string;
  before: string[];
  example: string;
  exampleMy: string;
  steps: string[];
  wrong: string;
  parts: GrammarSection["text"]["formulas"][number]["parts"];
  quiz: GrammarSection["quiz"];
};

function section(lesson: Lesson): GrammarSection {
  return {
    id: `grade12-unit3-${lesson.id}`,
    titleEn: lesson.title,
    titleMy: lesson.titleMy,
    text: {
      whatMy: [lesson.rule],
      whyMy: [lesson.why],
      goldenRulesMy: [lesson.check],
      transformation: {
        beforeEn: lesson.before,
        afterEn: lesson.example,
        stepsMy: lesson.steps,
      },
      mistakes: [{ wrongEn: lesson.wrong, rightEn: lesson.example, whyMy: lesson.check }],
      formulas: [
        {
          labelMy: "ဝါကျပုံစံ",
          formula: lesson.formula,
          exampleEn: lesson.example,
          exampleMy: lesson.exampleMy,
          parts: lesson.parts,
        },
      ],
    },
    oral: {
      scriptMy: lesson.spoken,
      note: {
        ideaMy: lesson.rule,
        formula: lesson.formula,
        examples: [{ en: lesson.example, my: lesson.exampleMy }],
      },
    },
    quiz: lesson.quiz,
  };
}

export const unit3Grammar: UnitGrammar = {
  unit: 3,
  topicEn: "Participle phrases, emphasis and parallel structures",
  topicMy: "ကြိယာစကားစု၊ အလေးပေးဝါကျနှင့် အပြိုင်ပုံစံ",
  sections: [
    section({
      id: "participle",
      title: "Participle phrases",
      titleMy: "ကြိယာမှ ဆင်းသက်လာသည့် စကားစုများ",
      rule: "ပင်မဝါကျရဲ့ ကတ္တားအကြောင်းကို ကြိယာပုံစံပြောင်းပြီး တိုတိုရှင်းရှင်း ဖော်ပြနိုင်ပါတယ်။",
      why: "ကိုယ်တိုင် လုပ်နေတဲ့အရာ၊ ခံရတဲ့အခြေအနေနဲ့ ပင်မဖြစ်ရပ်မတိုင်ခင် ပြီးသွားတဲ့အရာတို့ကို ခွဲပြီး ပုံစံရွေးပါ။",
      check: "စကားစုထဲက လုပ်ဆောင်သူနဲ့ ပင်မဝါကျရဲ့ ကတ္တား တစ်ဦးတည်းဖြစ်ရပါမယ်။",
      spoken:
        "သစ်တောတွေက အစားအစာတွေ ရရှိရာ အရေးကြီးတဲ့ နေရာလို့ ပြောကြည့်ပါ။ ဘာကြောင့် အဲဒီလိုဖြစ်တာလဲ။ သစ်တောတွေဟာ ဇီဝမျိုးစုံမျိုးကွဲတွေ ခိုလှုံရာဖြစ်လို့ပါ။ နှစ်ကြောင်းလုံးက သစ်တောအကြောင်းပဲ ဖြစ်ပါတယ်။ ဒါကြောင့် ရှေ့ပိုင်းမှာ ကတ္တားကို ထပ်မပြောဘဲ ကြိယာစကားစုအဖြစ် ချုံ့နိုင်ပါတယ်။ လုပ်ဆောင်တာလား၊ ခံရတာလား၊ အရင်ပြီးသွားတာလား စစ်ပါ။ စာမေးပွဲအရင်ပြီးမှ ပျော်တာလိုမျိုးမှာ အရင်ပြီးကြောင်း ပြတဲ့ ပုံစံကို ရွေးပါ။ နောက်ဆုံး ပင်မဝါကျကို ဖတ်ပြီး ရှေ့စကားစုက ဘယ်သူ့အကြောင်း ပြောသလဲ စစ်ပါ။",
      formula: "Participle phrase, + subject + main verb …",
      before: [
        "Forests are a haven of biodiversity.",
        "Forests are an excellent source of foods such as mushrooms, bamboo shoots, nuts, berries, leaves, and tubers.",
      ],
      example:
        "Being a haven of biodiversity, forests are an excellent source of foods such as mushrooms, bamboo shoots, nuts, berries, leaves, and tubers.",
      exampleMy:
        "ဇီဝမျိုးစုံမျိုးကွဲတွေ ခိုလှုံရာဖြစ်တဲ့အတွက် သစ်တောတွေဟာ မှို၊ မျှစ်၊ အခွံမာသီး၊ ဘယ်ရီသီး၊ အရွက်နဲ့ ဥမြစ်တို့လို အစားအစာတွေ ရရှိရာ အလွန်ကောင်းတဲ့ ရင်းမြစ်ပါ။",
      steps: [
        "နှစ်ကြောင်းလုံးမှာ သစ်တောက ကတ္တားဖြစ်တာ စစ်ပါ။",
        "ရှေ့ဝါကျကို ကြိယာစကားစုအဖြစ် ချုံ့ပြီး ကော်မာနောက်မှာ ပင်မဝါကျ ထားပါ။",
      ],
      wrong: "Being a haven of biodiversity, mushrooms are found in forests.",
      parts: [
        {
          chunk: "Being a haven of biodiversity",
          role: "[Participle phrase]",
          glossMy: "သစ်တောတွေနဲ့ သက်ဆိုင်တဲ့ အကြောင်းရင်း",
        },
        { chunk: "forests", role: "[Subject]", glossMy: "ပင်မဝါကျရဲ့ ကတ္တား" },
        {
          chunk: "are an excellent source of foods",
          role: "[Main predicate]",
          glossMy: "အစားအစာရရှိရာ ဖြစ်ကြောင်း",
        },
        {
          chunk: "such as mushrooms, bamboo shoots, nuts, berries, leaves, and tubers",
          role: "[Examples]",
          glossMy: "ရရှိနိုင်သည့် အစားအစာ ဥပမာများ",
        },
      ],
      quiz: {
        promptMy: "အရင် ပြီးသွားတဲ့ လုပ်ရပ်ကို ကြိယာစကားစုနဲ့ ဖော်ပြပါ။",
        questionEn: "After she had finished the exam, she felt very happy.",
        answerEn: "Having finished the exam, she felt very happy.",
        hintMy: "ပျော်တာထက် စာမေးပွဲပြီးတာက အရင်ဖြစ်ပါတယ်။",
      },
    }),
    section({
      id: "emphasis",
      title: "It is / It was … who / that …",
      titleMy: "လူ၊ အရာ၊ အချိန်နှင့် နေရာကို အလေးပေးခြင်း",
      rule: "ဝါကျထဲက သိစေချင်တဲ့ အပိုင်းကို ရှေ့က အလေးပေးပုံစံနဲ့ ထုတ်ပြနိုင်ပါတယ်။",
      why: "ဘာက ကိုယ်ခံအားကို ကောင်းစေတာလဲ ဆိုတဲ့ မေးခွန်းမှာ မျှတတဲ့ အစားအစာကို အလေးပေးဖြေချင်တဲ့အခါ ဒီပုံစံကို သုံးနိုင်ပါတယ်။",
      check:
        "အလေးပေးတဲ့ စကားစုကို ပင်မအပိုင်းထဲ ထပ်မထည့်ပါနဲ့။ အရာအတွက် လူကို ရည်ညွှန်းတဲ့ နာမ်စား မသုံးပါနဲ့။",
      spoken:
        "ကိုယ်ခံအားကို ကောင်းစေနိုင်တာ ဘာလဲလို့ မေးလာရင် အဖြေမှာ မျှတတဲ့ အစားအစာကို အလေးပေးချင်မယ်နော်။ စာကြောင်းထဲမှာ ဒီစကားစုကို အရင်ရှာပါ။ အလေးပေးတဲ့ နေရာဆီ ရွှေ့ပါ။ ပြီးရင် မူလဝါကျထဲက ကျန်တဲ့ အချက်တွေကို ဆက်စပ်စကားနဲ့ ဆက်ပါ။ ရွှေ့ထားတဲ့ စကားစုကို နောက်မှာ ထပ်မရေးရဘူး။ အချိန် ဒါမှမဟုတ် နေရာကို မျဉ်းသားထားရင် အဲဒီအပိုင်းကို ရွှေ့ရမယ်။ အခု ကိုယ်ရေးလိုက်တဲ့ ဝါကျက ဘယ်စကားစုကို အလေးပေးထားသလဲ ပြန်ပြောကြည့်ပါ။",
      formula: "It is / was + focus + who / that + rest of clause",
      before: ["A balanced diet can strengthen our immune system and protect us against illness."],
      example:
        "It is a balanced diet that can strengthen our immune system and protect us against illness.",
      exampleMy: "ကိုယ်ခံအားကို ကောင်းစေပြီး နာမကျန်းမှုကို ကာကွယ်နိုင်တာက မျှတတဲ့ အစားအသောက်ပါ။",
      steps: [
        "မျှတတဲ့အစားအသောက်ကို အလေးပေးမယ်လို့ ရွေးပါ။",
        "အရာဝတ္ထုကို ရည်ညွှန်းတဲ့ ဆက်စပ်စကားနဲ့ ကျန်ကြိယာပိုင်းကို ဆက်ပါ။",
      ],
      wrong:
        "It is a balanced diet who can strengthen our immune system and protect us against illness.",
      parts: [
        { chunk: "It is", role: "[Frame]", glossMy: "အလေးပေးပုံစံ အစ" },
        { chunk: "a balanced diet", role: "[Focus]", glossMy: "အလေးပေးလိုတဲ့ အစားအသောက်" },
        {
          chunk: "that can strengthen our immune system and protect us against illness",
          role: "[Rest of clause]",
          glossMy: "ကျန်တဲ့ အကြောင်းအရာ",
        },
      ],
      quiz: {
        promptMy: "မနေ့ညဆိုတဲ့ အချိန်ကို အလေးပေးပါ။",
        questionEn: "A big fire started in my neighbour’s house last night.",
        answerEn: "It was last night that a big fire started in my neighbour’s house.",
        hintMy: "အလေးပေးမယ့်အချိန်ကို ရှေ့သို့ ရွှေ့ပါ။",
      },
    }),
    section({
      id: "parallel",
      title: "Not only … but also …",
      titleMy: "အချက်နှစ်ခုကို အပြိုင် အလေးပေးခြင်း",
      rule: "အချက်တစ်ခုသာမက နောက်တစ်ခုလည်း ပါကြောင်း အပြိုင်ပုံစံနဲ့ ဖော်ပြပါတယ်။",
      why: "အချက်နှစ်ချက်လုံးကို စာဖတ်သူ သတိပြုစေချင်တဲ့အခါ သုံးပါ။ ဝါကျအစမှာ ပထမအပိုင်းကို ထားရင် ရှေ့ပိုင်းရဲ့ ကတ္တားနဲ့ အထောက်အကူပြုကြိယာ အစီအစဉ် ပြောင်းရပါတယ်။",
      check:
        "နှစ်ဖက်မှာ ပုံစံတူတဲ့ စကားလုံး သို့မဟုတ် စကားစုတွေကို တွဲပါ။ ပထမအပိုင်းက ဝါကျအစမှာ ရှိရင် အထောက်အကူပြုကြိယာကို ကတ္တားရှေ့မှာ ထားပါ။",
      spoken:
        "ခန်းမကို ဆေးသုတ်မယ်လို့ ပြောတဲ့အခါ အတွင်းဘက်လည်း သုတ်မယ်၊ အပြင်ဘက်လည်း သုတ်မယ်ဆိုပါစို့။ လုပ်ရပ်က နှစ်ကြောင်းလုံးမှာ ဆေးသုတ်တာပဲ။ မတူတာက အတွင်းဘက်နဲ့ အပြင်ဘက်ပါ။ အဲဒီနှစ်ခုကို အပြိုင် တွဲပါ။ တစ်ဖက်မှာ နာမ်စကားစု ထားရင် နောက်တစ်ဖက်မှာလည်း နာမ်စကားစု ထားပါ။ စာအုပ်ထဲက လူတစ်ယောက် ဉာဏ်ကောင်းသလို ချမ်းသာတယ်ဆိုတဲ့ ဥပမာမှာတော့ အလေးပေးစကား ဝါကျအစရောက်သွားပါတယ်။ ဒါကြောင့် ရှေ့ဝါကျခွဲမှာ ကြိယာနဲ့ ကတ္တား အစီအစဉ် ပြောင်းသွားတာကို သတိထားပါ။",
      formula: "not only + A + but also + B",
      before: ["She is smart.", "She is very rich."],
      example: "Not only is she smart, but she is also very rich.",
      exampleMy: "သူမက ဉာဏ်ကောင်းရုံသာမက အလွန်ချမ်းသာပါသေးတယ်။",
      steps: [
        "အရည်အချင်းနှစ်ခုကို ရှာပါ။",
        "အလေးပေးစကားကို အစမှာထားတဲ့အတွက် ရှေ့ဝါကျခွဲမှာ ကြိယာကို ကတ္တားရှေ့ ရွှေ့ပါ။",
      ],
      wrong: "Not only she is smart, but she is also very rich.",
      parts: [
        {
          chunk: "Not only is she smart",
          role: "[First clause]",
          glossMy: "ပထမအချက်၊ ကြိယာက ကတ္တားရှေ့တွင် ရှိသည်",
        },
        {
          chunk: "but she is also very rich",
          role: "[Second clause]",
          glossMy: "ဒုတိယအချက် ထပ်ဖြည့်သည်",
        },
      ],
      quiz: {
        promptMy: "ဘာသာစကားနှစ်ခုကို အပြိုင် ဖော်ပြပါ။",
        questionEn: "She enjoys learning English. She also enjoys learning French.",
        answerEn: "She enjoys learning not only English but also French.",
        hintMy: "အရင် တူညီတဲ့ ကြိယာပိုင်းကို ရှာပါ။",
      },
    }),
  ],
};
