import type { GrammarSection, UnitGrammar } from "@/data/grammar/types";

const defining: GrammarSection = {
  id: "grade12-unit2-defining",
  titleEn: "Defining relative clauses",
  titleMy: "နာမ်ကို အတိအကျ သတ်မှတ်ပေးသော ဝါကျခွဲ",
  text: {
    whatMy: ["လူ သို့မဟုတ် အရာဝတ္ထု ဘယ်တစ်ခုကို ဆိုလိုသလဲဆိုတာ သတ်မှတ်ပေးတဲ့ ဝါကျခွဲပါ။"],
    whyMy: [
      "စာအုပ်တွေ အများကြီးထဲက ဘယ်စာအုပ်တွေကို ဆိုလိုတာလဲဆိုတဲ့ အချက်က အရေးကြီးရင် သတ်မှတ်ပေးတဲ့ ဝါကျခွဲကို သုံးပါ။",
    ],
    goldenRulesMy: [
      "သတ်မှတ်ပေးတဲ့ ဝါကျခွဲကို ကော်မာနဲ့ မခွဲပါနဲ့။",
      "လူလား၊ အရာဝတ္ထုလား၊ ပိုင်ဆိုင်မှုလား ကြည့်ပြီး ဆက်စပ်နာမ်စား ရွေးပါ။",
    ],
    transformation: {
      beforeEn: ["I brought a dictionary.", "Nilar wanted it."],
      afterEn: "I brought the dictionary that Nilar wanted.",
      stepsMy: [
        "ဒုတိယဝါကျထဲက နာမ်စားက ပထမဝါကျထဲက အဘိဓာန်ကို ရည်ညွှန်းပါတယ်။",
        "ထပ်နေတဲ့ နာမ်စားကို ဖြုတ်ပြီး အဘိဓာန်နောက်မှာ ဆက်စပ်ဝါကျခွဲ ထည့်ပါ။",
      ],
    },
    mistakes: [
      {
        wrongEn: "I brought the dictionary that Nilar wanted it.",
        rightEn: "I brought the dictionary that Nilar wanted.",
        whyMy:
          "အဘိဓာန်ကို ဆက်စပ်နာမ်စားနဲ့ ရည်ညွှန်းပြီးဖြစ်လို့ ဒုတိယဝါကျထဲက နာမ်စားကို ထပ်မထည့်ပါနဲ့။",
      },
    ],
    formulas: [
      {
        labelMy: "အရာဝတ္ထုကို သတ်မှတ်ခြင်း",
        formula: "Noun + that / which + relative clause",
        exampleEn: "The news that he told you is not true.",
        exampleMy: "သူ သင့်ကို ပြောခဲ့တဲ့ သတင်းက မမှန်ပါဘူး။",
        parts: [
          { chunk: "The news", role: "[Noun]", glossMy: "သတ်မှတ်လိုသည့် သတင်း" },
          {
            chunk: "that he told you",
            role: "[Relative clause]",
            glossMy: "ဘယ်သတင်းလဲဆိုတာ ခွဲပြသည်",
          },
          {
            chunk: "is not true",
            role: "[Main predicate]",
            glossMy: "သတင်းက မမှန်ကြောင်း ပြောသည်",
          },
        ],
      },
    ],
  },
  oral: {
    scriptMy:
      "ကဲ၊ အဘိဓာန်တွေ အများကြီး ရှိတယ်ဆိုပါစို့။ ဆရာက အဘိဓာန် ယူလာတယ်လို့ပဲ ပြောရင် ဘယ်စာအုပ်လဲ မသိရသေးဘူးနော်။ နီလာ လိုချင်တဲ့ အဘိဓာန်လို့ ဖြည့်ပြောလိုက်မှ ရှင်းသွားတယ်။ ဒီအချက်က ဘယ်အဘိဓာန်လဲဆိုတာကို သတ်မှတ်ပေးတာပါ။ ဝါကျနှစ်ကြောင်း ပေါင်းတဲ့အခါ အဘိဓာန်ကို ကိုယ်စားပြုထားတဲ့ နာမ်စားကို ရှာပါ။ အဲဒီနာမ်စားက နှစ်ကြိမ်ထပ်နေလို့ ဖြုတ်ပါ။ ပြီးရင် အဘိဓာန်နောက်မှာ နီလာ လိုချင်ကြောင်း ပြတဲ့ ဝါကျခွဲကို ဆက်ပါ။ ကော်မာ ထည့်ရမလား။ မထည့်ပါဘူး။ အဲဒီအချက်မပါရင် ဘယ်အဘိဓာန်လဲ မသိတော့လို့ပါ။",
    note: {
      ideaMy: "ဘယ်လူ၊ ဘယ်အရာလဲဆိုတာ သတ်မှတ်ပေးပါ။",
      formula: "Noun + that / which + relative clause",
      examples: [
        {
          en: "I brought the dictionary that Nilar wanted.",
          my: "နီလာ လိုချင်တဲ့ အဘိဓာန်ကို ကျွန်တော် ယူလာခဲ့တယ်။",
        },
      ],
    },
  },
  quiz: {
    promptMy: "သင့်လျော်တဲ့ ဆက်စပ်နာမ်စား ဖြည့်ပါ။",
    questionEn: "A waiter is a person ______ job is to serve customers.",
    answerEn: "whose",
    hintMy: "စားပွဲထိုးရဲ့ အလုပ်ကို ဖော်ပြထားပါတယ်။",
  },
};

const nonDefining: GrammarSection = {
  id: "grade12-unit2-non-defining",
  titleEn: "Non-defining relative clauses",
  titleMy: "အပိုအချက်အလက် ပေးသော ဝါကျခွဲ",
  text: {
    whatMy: ["ဘယ်လူ၊ ဘယ်အရာလဲ သိပြီးသားဖြစ်တဲ့အခါ အဲဒီနာမ်အကြောင်း ထပ်ဖြည့်ပေးတဲ့ ဝါကျခွဲပါ။"],
    whyMy: [
      "ဝါကျခွဲကို ဖြုတ်ကြည့်ပါ။ ပင်မဝါကျက ပြည့်စုံပြီး ဘယ်အရာကို ဆိုလိုတာလဲ သိနေသေးရင် အပိုအချက် ဖြစ်ပါတယ်။",
    ],
    goldenRulesMy: [
      "ဝါကျအလယ်မှာ အပိုအချက်ကို ကော်မာနှစ်ခုနဲ့ ခွဲပါ။ ဝါကျအဆုံးမှာ ရှေ့ကော်မာနဲ့ ခွဲပါ။",
      "အပိုအချက်ပြ ဝါကျခွဲမှာ အရာဝတ္ထုအတွက် အသုံးပြုရမယ့် ဆက်စပ်နာမ်စားကို ရွေးပါ။",
    ],
    transformation: {
      beforeEn: ["We often visit Inya Lake.", "It is very good for walking exercise."],
      afterEn: "We often visit Inya Lake, which is very good for walking exercise.",
      stepsMy: [
        "အင်းလျားကန်လို့ အမည်ပြောထားလို့ ဘယ်ကန်လဲ သိပြီးသားပါ။",
        "ဒုတိယဝါကျကို ကော်မာနောက်မှာ အပိုအချက်အဖြစ် ဆက်ပါ။",
      ],
    },
    mistakes: [
      {
        wrongEn: "We often visit Inya Lake, that is very good for walking exercise.",
        rightEn: "We often visit Inya Lake, which is very good for walking exercise.",
        whyMy:
          "အပိုအချက်ပြ ဝါကျခွဲမှာ သတ်မှတ်ဝါကျခွဲအတွက် သုံးနိုင်တဲ့ ဆက်စပ်နာမ်စားကို မသုံးပါနဲ့။ ဒီနေရာမှာ ကန်ကို ရည်ညွှန်းတဲ့ ပုံစံကို ရွေးပါ။",
      },
    ],
    formulas: [
      {
        labelMy: "ဝါကျအလယ်မှာ အပိုအချက်ထည့်ခြင်း",
        formula: "Noun, which + relative clause, + main predicate",
        exampleEn: "This movie, which I watched last night, has caught the attention of the media.",
        exampleMy: "မနေ့ညက ကျွန်တော် ကြည့်ခဲ့တဲ့ ဒီရုပ်ရှင်ကို သတင်းမီဒီယာတွေ စိတ်ဝင်စားလာကြပါတယ်။",
        parts: [
          { chunk: "This movie", role: "[Noun]", glossMy: "ပြောနေသည့် ရုပ်ရှင်" },
          {
            chunk: "which I watched last night",
            role: "[Relative clause]",
            glossMy: "မနေ့ညက ကြည့်ခဲ့ကြောင်း အပိုပြောသည်",
          },
          {
            chunk: "has caught the attention of the media",
            role: "[Main predicate]",
            glossMy: "မီဒီယာတွေ အာရုံစိုက်လာကြောင်း ပြောသည်",
          },
        ],
      },
    ],
  },
  oral: {
    scriptMy:
      "ကဲ၊ အင်းလျားကန်ကို မကြာခဏ သွားတယ်လို့ ပြောကြည့်ပါ။ ဘယ်ကန်လဲ ရှင်းပြီးသားနော်။ လမ်းလျှောက်လို့ သိပ်ကောင်းတယ်ဆိုတာ ထပ်ပြောချင်ရင် ကန်အမည်နောက်မှာ ကော်မာ ထည့်ပြီး အပိုအချက်ကို ဆက်ပြောပါ။ စာကြောင်းကို စစ်ချင်ရင် အပိုအချက်ကို ခဏ ဖြုတ်ကြည့်ပါ။ အင်းလျားကန်ကို မကြာခဏ သွားတယ်ဆိုတဲ့ အဓိကအကြောင်းက ပြည့်စုံနေသေးတယ် မဟုတ်လား။ အဲဒါနဲ့ အဘိဓာန်ဥပမာကို ယှဉ်ကြည့်ပါ။ အဘိဓာန်ဥပမာမှာ ဘယ်တစ်အုပ်လဲ ခွဲဖို့ လိုတာပါ။ ဒီဥပမာမှာတော့ ဘယ်ကန်လဲ သိပြီးသားဖြစ်လို့ အချက်အလက် ထပ်ဖြည့်တာပါ။ ဝါကျအလယ်မှာ ထည့်ရင် ကော်မာနှစ်ခုနဲ့ ခွဲရမယ်နော်။",
    note: {
      ideaMy: "သိပြီးသားနာမ်အကြောင်း အပိုအချက် ထည့်ပါ။",
      formula: "Noun, which + relative clause",
      examples: [
        {
          en: "We often visit Inya Lake, which is very good for walking exercise.",
          my: "ကျွန်တော်တို့ အင်းလျားကန်ကို မကြာခဏသွားတယ်။ အဲဒီကန်က လမ်းလျှောက်ဖို့ သိပ်ကောင်းတယ်။",
        },
      ],
    },
  },
  quiz: {
    promptMy: "သင့်လျော်တဲ့ ဆက်စပ်နာမ်စား ဖြည့်ပါ။",
    questionEn: "We often visit Inya Lake, ______ is very good for walking exercise.",
    answerEn: "which",
    hintMy: "နေရာတစ်ခုအကြောင်း အပိုအချက်ကို ကော်မာနဲ့ ခွဲထားပါတယ်။",
  },
};

export const unit2Grammar: UnitGrammar = {
  unit: 2,
  topicEn: "Relative clauses",
  topicMy: "ဆက်စပ်ဝါကျခွဲများ",
  sections: [defining, nonDefining],
};
