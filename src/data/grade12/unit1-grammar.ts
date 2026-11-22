import type { GrammarFormula, UnitGrammar } from "@/data/grammar/types";
import { modals } from "./unit1-reference";
import { modalNotes } from "./unit1-study-support";

const lessons = {
  Can: {
    title: "လုပ်နိုင်စွမ်း၊ ခွင့်ပြုချက်နှင့် ဖြစ်နိုင်ခြေ",
    subject: "He",
    verb: "lift",
    rest: "that heavy box",
    affirmativeMy: "သူ အဲဒီသေတ္တာအလေးကြီးကို မြှောက်နိုင်တယ်။",
    negativeMy: "သူ အဲဒီသေတ္တာအလေးကြီးကို မမြှောက်နိုင်ဘူး။",
    questionMy: "သူ အဲဒီသေတ္တာအလေးကြီးကို မြှောက်နိုင်သလား။",
    context:
      "တစ်ယောက်ယောက်က လုပ်တတ်သလား မေးတာနဲ့ တစ်ခုခု လုပ်ခွင့်တောင်းတာ နှစ်မျိုးလုံးမှာ သုံးနိုင်ပါတယ်။ အခြေအနေကို ကြည့်ပြီး ဘာကို ဆိုလိုသလဲ ခွဲပါ။",
    script:
      "ကဲ၊ လေးလံတဲ့ သေတ္တာတစ်လုံးကို မောင်မောင် မြှောက်နိုင်တယ်ဆိုပါစို့။ ဘာကို ပြောနေတာလဲ။ မြှောက်ရမယ်လို့ အမိန့်ပေးနေတာလား။ မဟုတ်ဘူးနော်။ သူ့မှာ အဲဒီသေတ္တာကို မြှောက်နိုင်စွမ်း ရှိတာကို ပြောတာပါ။ အရင်ဆုံး မြှောက်မယ့်သူကို ထားပါ။ ပြီးရင် လုပ်နိုင်ကြောင်းပြတဲ့ အထောက်အကူပြုကြိယာနဲ့ မြှောက်တယ်ဆိုတဲ့ ကြိယာအရင်းကို ထည့်ပါ။ တစ်ခုမှတ်ပါ။ လူတစ်ယောက်တည်းကို ပြောနေလည်း နောက်ကြိယာကို မပြောင်းရဘူး။ ကဲ၊ အခု သူငယ်ချင်းရဲ့ထီးကို ခဏငှားချင်တယ်ဆိုရင်ရော။ ကိုယ်လုပ်နိုင်စွမ်း ရှိမရှိ ပြောတာ မဟုတ်တော့ဘူး။ လုပ်ခွင့် တောင်းတာပါ။ အထောက်အကူပြုကြိယာကို ရှေ့ဆုံး ရွှေ့ပြီး မေးလိုက်ပါ။ စကားလုံးတူပေမဲ့ ဘာကြောင့်သုံးလဲဆိုတာ အခြေအနေက ပြောပြပေးပါတယ်။",
  },
  Should: {
    title: "အကြံပြုချက်နှင့် လုပ်သင့်သည့်တာဝန်",
    subject: "You",
    verb: "get",
    rest: "up early to study for your exam",
    affirmativeMy: "စာမေးပွဲအတွက် စာကျက်ဖို့ စောစောထသင့်တယ်။",
    negativeMy: "စာမေးပွဲအတွက် စာကျက်ဖို့ စောစောမထသင့်ဘူး။",
    questionMy: "စာမေးပွဲအတွက် စာကျက်ဖို့ စောစောထသင့်သလား။",
    context:
      "စာမေးပွဲအတွက် ကြိုတင်ပြင်ဆင်ဖို့ အကြံပေးရာမှာ သုံးပါ။ ကောင်းကျိုးကို မျှော်လင့်ပြီး လမ်းညွှန်တာလား၊ တိကျတဲ့ စည်းကမ်းတစ်ခုကို ပြောတာလား စဉ်းစားပါ။",
    script:
      "ကဲ၊ သူငယ်ချင်းတစ်ယောက်က စာမေးပွဲ နီးနေပြီ၊ စာလည်း မပြီးသေးဘူးလို့ လာပြောတယ်။ သားတို့သမီးတို့ ဘယ်လို အကြံပေးမလဲ။ စောစောထပြီး စာကျက်သင့်တယ်လို့ ပြောနိုင်တယ်နော်။ အဲဒီမှာ အရေးကြီးတာက စောစောထတာ အကျိုးရှိမယ်လို့ လမ်းညွှန်ပေးတာပါ။ စာမေးပွဲခန်းထဲ ဖုန်း မယူရဘူးဆိုတဲ့ စည်းကမ်းမျိုးနဲ့ သဘော မတူဘူး။ ဝါကျဖွဲ့တဲ့အခါ ဘယ်သူကို အကြံပေးတာလဲ အရင်ထား၊ နောက်မှာ လုပ်သင့်ကြောင်းပြတဲ့ စကားနဲ့ လုပ်ရပ်ရဲ့ ကြိယာအရင်းကို ဆက်ပါ။ လုပ်တာ မကောင်းဘူးလို့ အကြံပေးရင် အငြင်းပုံစံ ပြောင်းပါ။ အခု မနက်စာ မစားတဲ့သူကို ဘယ်လို အကြံပေးမလဲ စဉ်းစားကြည့်ပါ။ စားသင့်တယ်ဆိုတာအပြင် ဘာစားသင့်လဲ ထည့်ပြောရင် အကြံက ပိုရှင်းသွားမယ်။",
  },
  Must: {
    title: "မဖြစ်မနေ လုပ်ရမည့်အရာနှင့် တားမြစ်ချက်",
    subject: "You",
    verb: "arrive",
    rest: "two hours before your flight",
    affirmativeMy: "လေယာဉ်မထွက်ခင် နှစ်နာရီကြို ရောက်ရမယ်။",
    negativeMy: "လေယာဉ်မထွက်ခင် နှစ်နာရီကြို မရောက်ရဘူး။",
    questionMy: "လေယာဉ်မထွက်ခင် နှစ်နာရီကြို ရောက်ရမလား။",
    context: "မဖြစ်မနေလိုက်နာရမည့် အချိန်သတ်မှတ်ချက် သို့မဟုတ် စည်းကမ်းကို ပြောရာမှာ သုံးပါ။",
    script:
      "လေဆိပ်ကို သွားတော့မယ်ဆိုပါစို့။ လေယာဉ်မထွက်ခင် နှစ်နာရီ ကြိုရောက်ရမယ်လို့ ပြောရင် ဒီမှာ အချိန်က အရေးကြီးတယ်နော်။ အဆင်ပြေရင် ကြိုရောက်ပါလို့ အကြံပေးတာထက် ပိုတိကျတယ်။ မဖြစ်မနေ လုပ်ရမယ့်အရာကို ပြောတာပါ။ ကတ္တားနောက်မှာ မဖြစ်မနေ လုပ်ရကြောင်းပြတဲ့ စကားကို ထည့်ပြီး လုပ်ရပ်ကို ကြိယာအရင်းနဲ့ ဆက်ပါ။ အငြင်းပုံစံမှာ လူမှားတတ်တာ သတိထားပါ။ အစည်းအဝေးခန်းကို ခွင့်ပြုချက်မရှိဘဲ မဝင်ရဘူးဆိုတာ ဝင်ချင်ဝင်၊ မဝင်ချင်နေဆိုတာ မဟုတ်ပါဘူး။ ဝင်ခွင့်ကို တားမြစ်ထားတာပါ။ ကဲ၊ ကျောင်းမှာ ကြိုက်ရင်လုပ်လို့ရတဲ့ အကြံတစ်ခုနဲ့ မဖြစ်မနေ လိုက်နာရတဲ့ စည်းကမ်းတစ်ခု စဉ်းစားပါ။ နှစ်ခုကို ခွဲနိုင်ရင် ဘယ်အထောက်အကူပြုကြိယာကို ရွေးရမလဲ သိလာမယ်။",
  },
} as const;

export const unit1Grammar: UnitGrammar = {
  unit: 1,
  topicEn: "Modal auxiliaries: can, should, must",
  topicMy: "အထောက်အကူပြုကြိယာများ",
  sections: modals.map(({ word, negative, uses }) => {
    const lesson = lessons[word];
    const notes = modalNotes[word];
    const modal = word.toLowerCase();
    const { subject, verb, rest } = lesson;
    const affirmative = `${subject} ${modal} ${verb} ${rest}.`;
    const question = `${word} ${subject.toLowerCase()} ${verb} ${rest}?`;
    const negativeModal = negative.split(" / ")[0];
    const subjectPart = { role: "[Subject]", glossMy: "လုပ်ဆောင်သူ" };
    const modalPart = { role: "[Modal]", glossMy: "လုပ်ရပ်၏ သဘောကို ဖော်ပြသည်" };
    const actionParts = [
      { chunk: verb, role: "[Base verb]", glossMy: "အဓိကလုပ်ရပ်" },
      { chunk: rest, role: "[Rest]", glossMy: "လုပ်ရပ်၏ အသေးစိတ်" },
    ];
    const formulas: GrammarFormula[] = [
      {
        labelMy: "အပြုဝါကျ",
        formula: `Subject + ${modal} + base verb`,
        exampleEn: affirmative,
        exampleMy: lesson.affirmativeMy,
        parts: [{ chunk: subject, ...subjectPart }, { chunk: modal, ...modalPart }, ...actionParts],
      },
      {
        labelMy: "အငြင်းဝါကျ",
        formula: `Subject + ${negative} + base verb`,
        exampleEn: `${subject} ${negativeModal} ${verb} ${rest}.`,
        exampleMy: lesson.negativeMy,
        parts: [
          { chunk: subject, ...subjectPart },
          { chunk: negativeModal, ...modalPart },
          ...actionParts,
        ],
      },
      {
        labelMy: "မေးခွန်း",
        formula: `${word} + subject + base verb …?`,
        exampleEn: question,
        exampleMy: lesson.questionMy,
        parts: [
          { chunk: word, ...modalPart },
          { chunk: subject.toLowerCase(), ...subjectPart },
          ...actionParts,
        ],
      },
    ];
    const examples = uses.map(([, en], i) => ({ en, my: notes.examples[i] }));
    return {
      id: `grade12-unit1-${modal}`,
      titleEn: word,
      titleMy: lesson.title,
      text: {
        whatMy: [notes.summary],
        whyMy: [lesson.context, ...notes.uses],
        goldenRulesMy: [
          "အထောက်အကူပြုကြိယာနောက်တွင် အဓိကကြိယာကို အရင်းပုံစံဖြင့် သုံးပါ။",
          notes.tip,
        ],
        transformation: {
          labelMy: "မေးခွန်းပုံစံ ပြောင်းနည်း",
          beforeEn: [affirmative],
          afterEn: question,
          stepsMy: [
            "အထောက်အကူပြုကြိယာကို ကတ္တားရှေ့သို့ ရွှေ့ပါ။",
            "ကျန်သော ဝါကျအစီအစဉ်ကို ထိန်းထားပြီး အဆုံးတွင် မေးခွန်းအမှတ် ထည့်ပါ။",
          ],
        },
        mistakes: [
          {
            wrongEn: `${subject} ${modal} to ${verb} ${rest}.`,
            rightEn: affirmative,
            whyMy:
              "ဤအထောက်အကူပြုကြိယာနောက်တွင် ကြိယာအရင်းကို တိုက်ရိုက်ထည့်ပါ။ ကြိယာရှေ့၌ အပိုစကားလုံး မထည့်ပါနှင့်။",
          },
        ],
        formulas,
        examples,
      },
      oral: {
        scriptMy: lesson.script,
        note: { ideaMy: notes.summary, formula: formulas[0].formula, examples },
      },
      quiz: {
        promptMy: "သင့်လျော်သည့် အထောက်အကူပြုကြိယာကို ဖြည့်ပါ။",
        questionEn: `${subject} ______ ${verb} ${rest}.`,
        answerEn: modal,
        hintMy: lesson.context,
      },
    };
  }),
};
