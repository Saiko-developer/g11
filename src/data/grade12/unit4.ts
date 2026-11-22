import type { Grade12Skill } from "./syllabus";
import type { TextbookExercise } from "./unit2";
import type { ExerciseTranslation } from "./unit2-exercises-my";
import passage from "./unit4-passage.json";

export const unit4Reading = passage;
type Item = readonly [en: string, my: string, answer?: string, choices?: readonly string[]];
function exercise(
  instruction: string,
  my: string,
  items: readonly Item[],
  reference?: string,
  referenceMy?: string,
) {
  const source: TextbookExercise = {
    instruction,
    reference,
    items: items.map(([text, , answer, choices]) => ({ text, answer, choices })),
  };
  const translation: ExerciseTranslation = {
    instruction: my,
    items: items.map(([, text]) => text),
    reference: referenceMy,
  };
  return { source, translation };
}

const headingChoices = [
  "The importance of emotional well-being",
  "Definition of emotional well-being",
  "Some practical ways to achieve emotional well-being",
  "Definition of emotion",
  "Ways to achieve a better quality of life",
  "Types of emotions",
];
const antonyms = ["mild", "relaxed", "bias", "unsteadiness", "weakness", "pleasant"];

export const unit4EmotionRows = [
  ["Delight", "Anger", "ဝမ်းသာပီတိ", "ဒေါသ"],
  ["Joy", "Fear", "ပျော်ရွှင်မှု", "ကြောက်ရွံ့မှု"],
  ["Sympathy", "Anxiety", "စာနာမှု", "စိုးရိမ်မှု"],
  ["Empathy", "Jealousy", "ထပ်တူခံစားမှု", "မနာလိုမှု"],
  ["Rapture", "Grief", "အလွန်ကြည်နူးမှု", "ဝမ်းနည်းပူဆွေးမှု"],
  ["Trust", "Greed", "ယုံကြည်မှု", "လောဘ"],
  ["Love", "Hatred", "ချစ်ခြင်း", "မုန်းတီးမှု"],
] as const;

export const unit4Strategies = [
  [
    "Stay honest",
    "Be honest with others. Emotional stability is based on honesty and **integrity**.",
    "ရိုးသားပါ။ တခြားသူတွေအပေါ် ရိုးသားပါ။ စိတ်ခံစားမှု တည်ငြိမ်ခြင်းက ရိုးသားမှုနဲ့ ကိုယ်ကျင့်သိက္ခာအပေါ် အခြေခံပါတယ်။",
  ],
  [
    "Stay positive",
    "Keep a healthy, positive attitude to life. Smile, laugh, and enjoy your life.",
    "အကောင်းမြင်ပါ။ ဘဝအပေါ် ကောင်းမွန်ပြီး အကောင်းမြင်တဲ့ သဘောထား ထားပါ။ ပြုံးပါ၊ ရယ်ပါ၊ ဘဝကို ပျော်ပျော်ရွှင်ရွှင် ဖြတ်သန်းပါ။",
  ],
  [
    "Stay peaceful",
    "Try to be a peacemaker. Develop fairness and conflict resolution skills. Overlook offenses and stay **serene** and calm.",
    "အေးချမ်းစွာ နေပါ။ ပြေလည်အောင် ကြိုးစားပါ။ မျှတမှုနဲ့ ပဋိပက္ခဖြေရှင်းနိုင်စွမ်းကို မြှင့်ပါ။ စိတ်ထိခိုက်စရာတွေကို သည်းခံပြီး အေးအေးချမ်းချမ်း နေပါ။",
  ],
  [
    "Stay connected",
    "Stay close to those who provide support for your emotional **recovery** and keep yourself away from those who do not.",
    "အဆက်အသွယ်ထားပါ။ စိတ်ခံစားမှု ပြန်ကောင်းလာအောင် ကူညီသူတွေနဲ့ နီးနီးကပ်ကပ်နေပြီး ကူညီပံ့ပိုးမှုမပေးသူတွေနဲ့ အကွာအဝေးထားပါ။",
  ],
  [
    "Stay grateful",
    "Stay **modest** and humble. Gratitude opens the door to more friendships.",
    "ကျေးဇူးတင်တတ်ပါ။ ကြွားဝါမှုကင်းပြီး နှိမ့်ချပါ။ ကျေးဇူးတင်တတ်ခြင်းက မိတ်ဆွေပိုများလာဖို့ လမ်းဖွင့်ပေးပါတယ်။",
  ],
  [
    "Stay determined",
    "Find the key reason for your emotional recovery and stick to it.",
    "စိတ်ပိုင်းဆိုင်ရာ ပြန်ကောင်းလာဖို့ အဓိက အကြောင်းရင်းကို ရှာပြီး အဲဒါကို စွဲမြဲစွာ လိုက်နာပါ။",
  ],
  [
    "Stay intentional",
    "Try to have a specific aim in view. Stay **deliberate**, determined and purposeful.",
    "ရည်ရွယ်ချက်ထားပါ။ တိကျတဲ့ ပန်းတိုင်ကို မြင်အောင်ကြည့်ပါ။ စဉ်းစားစီစဉ်ပြီး စိတ်ပိုင်းဖြတ်ကာ ရည်ရွယ်ချက်ရှိရှိ လုပ်ဆောင်ပါ။",
  ],
  [
    "Stay strong",
    "Try to have the strength and courage to face difficult situations to come.",
    "စိတ်ဓာတ်ကြံ့ခိုင်ပါ။ ကြုံလာမယ့် ခက်ခဲတဲ့ အခြေအနေတွေကို ရင်ဆိုင်ဖို့ ခွန်အားနဲ့ သတ္တိရှိအောင် ကြိုးစားပါ။",
  ],
  [
    "Stay balanced",
    "Keep the right balance of both pleasant and unpleasant feelings. Find ways to improve your work-life balance.",
    "ဟန်ချက်ညီအောင် နေပါ။ နှစ်သက်စရာနဲ့ မနှစ်သက်စရာ ခံစားချက်တွေကို ဟန်ချက်ညီအောင် ထိန်းပါ။ အလုပ်နဲ့ ကိုယ်ပိုင်ဘဝ ပိုမျှတအောင် နည်းလမ်းရှာပါ။",
  ],
  [
    "Stay hopeful",
    "Stay confident that your future is filled with the promise of good things to come. Hope gives birth to a brighter and sweeter future.",
    "မျှော်လင့်ချက်ထားပါ။ အနာဂတ်မှာ ကောင်းတဲ့အရာတွေ ဖြစ်လာမယ်လို့ ယုံကြည်ပါ။ မျှော်လင့်ချက်က ပိုတောက်ပသာယာတဲ့ အနာဂတ်ကို ဖြစ်စေပါတယ်။",
  ],
] as const;

const reading = [
  exercise("Pre-reading", "ဖတ်စာမဖတ်မီ အောက်ပါ မေးခွန်းတွေကို ဖြေပါ။", [
    [
      "What generally makes you happy / angry?",
      "ပုံမှန်အားဖြင့် ဘာက သင့်ကို ပျော်ရွှင်စေသလဲ၊ ဒေါသထွက်စေသလဲ။",
    ],
    [
      "What do you usually do when you are surprised / excited / annoyed / angry?",
      "အံ့ဩ၊ စိတ်လှုပ်ရှား၊ စိတ်အနှောင့်အယှက်ဖြစ်၊ ဒေါသထွက်တဲ့အခါ ပုံမှန် ဘာလုပ်သလဲ။",
    ],
    [
      "Which do you think is more important in life – physical well-being or mental well-being? Why?",
      "ဘဝမှာ ကိုယ်ကျန်းမာရေးနဲ့ စိတ်ကျန်းမာရေး ဘယ်ဟာ ပိုအရေးကြီးတယ်လို့ ထင်သလဲ။ ဘာကြောင့်လဲ။",
    ],
  ]),
  exercise(
    "A. Read the passage and choose the appropriate topic for each paragraph. Match the paragraphs (1–5) with the topics (a–f). There is one extra topic.",
    "ဖတ်စာကို ဖတ်ပြီး စာပိုဒ် ၁ မှ ၅ အထိ သင့်တော်ရာ ခေါင်းစဉ်နဲ့ တွဲပါ။ ခေါင်းစဉ်တစ်ခု ပိုနေပါတယ်။",
    [3, 5, 1, 0, 2].map((answer, index): Item => [
      `Paragraph ${index + 1}`,
      `စာပိုဒ် ${["၁", "၂", "၃", "၄", "၅"][index]}`,
      headingChoices[answer],
      headingChoices,
    ]),
    headingChoices.map((choice, i) => `(${String.fromCharCode(97 + i)}) ${choice}`).join("\n"),
    "စိတ်ခံစားမှု ကောင်းမွန်ခြင်း၏ အရေးပါမှု\nစိတ်ခံစားမှု ကောင်းမွန်ခြင်း၏ အဓိပ္ပာယ်\nစိတ်ခံစားမှု ကောင်းမွန်စေသည့် လက်တွေ့နည်းလမ်းများ\nစိတ်ခံစားမှု၏ အဓိပ္ပာယ်\nပိုကောင်းတဲ့ ဘဝအရည်အသွေး ရရှိနိုင်မည့် နည်းလမ်းများ\nစိတ်ခံစားမှု အမျိုးအစားများ",
  ),
  exercise(
    "B. In pairs, find the bold-faced words in the passage that are similar in meaning to the following.",
    "နှစ်ယောက်တွဲပြီး အောက်ပါအဓိပ္ပာယ်တွေနဲ့ ဆင်တူတဲ့ စာလုံးထူတွေကို ဖတ်စာထဲက ရှာပါ။",
    [
      [
        "able to become strong, happy, or successful again after a difficult situation",
        "ခက်ခဲတဲ့ အခြေအနေပြီးနောက် ပြန်လည် ကြံ့ခိုင်၊ ပျော်ရွှင် သို့မဟုတ် အောင်မြင်နိုင်သော",
        "resilient",
      ],
      [
        "a return to a normal state of health, mind, or strength",
        "ကျန်းမာရေး၊ စိတ် သို့မဟုတ် ခွန်အား ပုံမှန်အခြေအနေသို့ ပြန်ရောက်ခြင်း",
        "recovery",
      ],
      ["very calm or peaceful", "အလွန် အေးချမ်းငြိမ်သက်သော", "serene"],
      ["intended or planned", "ရည်ရွယ်ထားသော သို့မဟုတ် စီစဉ်ထားသော", "deliberate"],
      ["not proud", "မဝင့်ကြွားသော", "modest"],
      ["caused", "ဖြစ်ပေါ်စေခဲ့သော", "induced"],
      ["long-lasting; persisting for a long time", "ကြာရှည်စွာ ဆက်လက်ဖြစ်နေသော", "chronic"],
      ["emotionally influenced", "စိတ်ခံစားမှုအပေါ် သက်ရောက်ခံရသော", "touched"],
      [
        "succeed in dealing with a difficult situation",
        "ခက်ခဲတဲ့ အခြေအနေကို အောင်မြင်စွာ ကိုင်တွယ်နိုင်သည်",
        "cope with",
      ],
      [
        "the quality of being honest and having strong moral principles",
        "ရိုးသားပြီး ခိုင်မာတဲ့ ကိုယ်ကျင့်တရား ရှိခြင်း",
        "integrity",
      ],
    ],
  ),
  exercise(
    "C. Complete the sentences with the appropriate answers (a–j) in Exercise B.",
    "လေ့ကျင့်ခန်း ခ မှ သင့်တော်ရာ အဖြေတွေကို ဝါကျတွေထဲ ထည့်ပါ။",
    [
      [
        "A number of health issues will arise if unpleasant feelings become ______ and persistent.",
        "မနှစ်မြို့ဖွယ် ခံစားချက်တွေ ______ ပြီး ဆက်ရှိနေရင် ကျန်းမာရေးပြဿနာတွေ ဖြစ်လာပါမယ်။",
        "chronic",
      ],
      [
        "She worked overtime last week; her illness was ______ by overwork.",
        "ပြီးခဲ့တဲ့အပတ်က အချိန်ပို လုပ်ခဲ့တယ်။ သူမ နာမကျန်းမှုကို အလုပ်လွန်ကဲတာက ______ ခဲ့တယ်။",
        "induced",
      ],
      [
        "She was deeply ______ by the story of a poor little boy who had lost his parents in an accident.",
        "မတော်တဆမှုကြောင့် မိဘဆုံးရှုံးထားတဲ့ ကလေးငယ်ရဲ့ အဖြစ်ကို ကြားရလို့ သူမ နက်နက်ရှိုင်းရှိုင်း ______ ဖြစ်ခဲ့တယ်။",
        "touched",
      ],
      [
        "Our company proved remarkably ______ during the economic crisis.",
        "စီးပွားရေးအကျပ်အတည်းမှာ ကျွန်ုပ်တို့ကုမ္ပဏီ ထူးထူးခြားခြား ______ ကြောင်း ပြသနိုင်ခဲ့တယ်။",
        "resilient",
      ],
      [
        "Those who are emotionally stable can ______ the difficulties of life.",
        "စိတ်ခံစားမှု တည်ငြိမ်သူတွေက ဘဝအခက်အခဲတွေကို ______ နိုင်ပါတယ်။",
        "cope with",
      ],
      [
        "______ is one of the most important qualities of a leader.",
        "______ က ခေါင်းဆောင်တစ်ဦးရဲ့ အရေးကြီးဆုံး အရည်အချင်းတွေထဲက တစ်ခုပါ။",
        "Integrity",
      ],
      [
        "We wish the patient would make a full and speedy ______.",
        "လူနာ အပြည့်အဝ မြန်မြန် ______ ပါစေလို့ ဆုတောင်းပါတယ်။",
        "recovery",
      ],
      [
        "She used her ______ strategy to win the first prize in the talent contest.",
        "စွမ်းရည်ပြိုင်ပွဲမှာ ပထမဆုရဖို့ သူမ ______ နည်းဗျူဟာ အသုံးပြုခဲ့တယ်။",
        "deliberate",
      ],
      [
        "Despite being a famous tennis player, he remains ______ about his achievements.",
        "နာမည်ကြီး တင်းနစ်ကစားသမား ဖြစ်ပေမဲ့ အောင်မြင်မှုတွေအပေါ် ______ နေတုန်းပါ။",
        "modest",
      ],
      [
        "She practises meditation every day and her face looks ______.",
        "သူမ နေ့တိုင်း တရားထိုင်လို့ မျက်နှာက ______ ပုံပေါ်ပါတယ်။",
        "serene",
      ],
    ],
  ),
  exercise(
    "D. In pairs, fill each blank with an appropriate antonym in the box.",
    "နှစ်ယောက်တွဲပြီး အကွက်ထဲမှ ဆန့်ကျင်ဘက် စကားလုံး သင့်တော်ရာကို ရွေးပါ။",
    [
      ["distressed", "စိတ်ဒုက္ခရောက်နေသော", "relaxed", antonyms],
      ["overwhelming", "မခံနိုင်လောက်အောင် ပြင်းထန်သော", "mild", antonyms],
      ["stressful", "စိတ်ဖိစီးမှု ဖြစ်စေသော", "pleasant", antonyms],
      ["stability", "တည်ငြိမ်မှု", "unsteadiness", antonyms],
      ["fairness", "မျှတမှု", "bias", antonyms],
      ["strength", "ခွန်အား", "weakness", antonyms],
    ],
    antonyms.join(" · "),
    "မပြင်းထန်သော၊ စိတ်အေးလက်အေးရှိသော၊ ဘက်လိုက်မှု၊ မတည်ငြိမ်မှု၊ အားနည်းချက်၊ သာယာသော",
  ),
  exercise(
    "E. Complete the sentences with the appropriate words (1–6) in Exercise D.",
    "လေ့ကျင့်ခန်း ဃ ထဲက နံပါတ် ၁ မှ ၆ ပါ စကားလုံးတွေနဲ့ ဝါကျတွေကို ဖြည့်ပါ။",
    [
      [
        "His critical thinking skill is the main ______ in solving problems.",
        "ပြဿနာဖြေရှင်းရာမှာ ဝေဖန်ဆန်းစစ်နိုင်စွမ်းက သူ့ရဲ့ အဓိက ______ ပါ။",
        "strength",
      ],
      [
        "He has a sense of ______ and hates injustice.",
        "သူက ______ ရှိပြီး မတရားမှုကို မုန်းတယ်။",
        "fairness",
      ],
      [
        "Honesty and integrity are important for emotional ______.",
        "စိတ်ခံစားမှု ______ အတွက် ရိုးသားခြင်းနဲ့ ကိုယ်ကျင့်သိက္ခာ ရှိခြင်း အရေးကြီးတယ်။",
        "stability",
      ],
      [
        "She felt a(n) ______ desire to defeat her rival.",
        "ပြိုင်ဘက်ကို အနိုင်ယူချင်တဲ့ ______ ဆန္ဒ သူမမှာ ဖြစ်ပေါ်လာတယ်။",
        "overwhelming",
      ],
      [
        "As her new job is very ______, she has a lot of anxiety and worry.",
        "အလုပ်အသစ်က အလွန် ______ ဖြစ်လို့ သူမ စိုးရိမ်ပူပန်နေတယ်။",
        "stressful",
      ],
      [
        "Hla Hla was deeply ______ by the news of her father’s death.",
        "ဖခင် သေဆုံးသတင်းကြောင့် လှလှ အလွန် ______ ဖြစ်ခဲ့တယ်။",
        "distressed",
      ],
    ],
  ),
  exercise(
    "F. Give a full-sentence answer to each question below.",
    "မေးခွန်းတိုင်းကို ဝါကျအပြည့်ဖြင့် ဖြေပါ။",
    [
      [
        "What are the two main types of emotions?",
        "စိတ်ခံစားမှုရဲ့ အဓိက အမျိုးအစားနှစ်ခုက ဘာတွေလဲ။",
      ],
      [
        "‘In daily life, we are more likely to experience negative emotions than positive ones.’ Do you agree with this statement? Why or why not?",
        "နေ့စဉ်ဘဝမှာ အကောင်းမြင်ခံစားချက်ထက် အဆိုးမြင်ခံစားချက်ကို ပိုကြုံတတ်တယ်ဆိုတာ သဘောတူသလား။ ဘာကြောင့်လဲ။",
      ],
      [
        "What do we usually do when something bad or unkind happens to us?",
        "မကောင်းမှု ဒါမှမဟုတ် မကြင်နာတဲ့ အပြုအမူ ကြုံရတဲ့အခါ ပုံမှန် ဘာလုပ်တတ်သလဲ။",
      ],
      [
        "How do we feel when we cannot fulfil our wants or needs?",
        "လိုချင်တာ၊ လိုအပ်တာတွေ မပြည့်မီတဲ့အခါ ဘယ်လို ခံစားရသလဲ။",
      ],
      [
        "Why is emotional well-being so important in seeking happiness and life satisfaction?",
        "ပျော်ရွှင်မှုနဲ့ ဘဝကျေနပ်မှု ရှာဖွေရာမှာ စိတ်ခံစားမှု ကောင်းမွန်ခြင်းက ဘာကြောင့် အရေးကြီးသလဲ။",
      ],
      [
        "What is essential for us to enjoy a better quality of life?",
        "ပိုကောင်းတဲ့ ဘဝအရည်အသွေး ခံစားနိုင်ဖို့ ဘာက မရှိမဖြစ်လိုအပ်သလဲ။",
      ],
      [
        "How do you usually manage your emotions?",
        "သင့်စိတ်ခံစားမှုတွေကို ပုံမှန် ဘယ်လို စီမံထိန်းညှိသလဲ။",
      ],
      [
        "Suggest two other ways of achieving emotional well-being.",
        "စိတ်ခံစားမှု ကောင်းမွန်ဖို့ တခြားနည်းလမ်းနှစ်ခု အကြံပြုပါ။",
      ],
    ],
  ),
];

const adjectives = [
  "bored",
  "interested",
  "surprising",
  "amusing",
  "confused",
  "boring",
  "amused",
  "confusing",
  "surprised",
  "interesting",
];
const adjectivePairs: readonly (readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
])[] = [
  [
    "We are going to Kalaw next weekend. We have never been there before. (excite)",
    "နောက်အပတ် ပိတ်ရက်မှာ ကလောကို သွားမယ်။ အရင်က မရောက်ဖူးဘူး။",
    "It will be an ______ trip.",
    "______ ခရီးတစ်ခု ဖြစ်မယ်။",
    "exciting",
    "We are ______ about the trip.",
    "ခရီးအတွက် ကျွန်တော်တို့ ______ နေကြတယ်။",
    "excited",
  ],
  [
    "Ko Thu spends most of his spare time in the garden. (interest)",
    "ကိုသူက အားလပ်ချိန်အများစုကို ဥယျာဉ်ထဲမှာ ကုန်ဆုံးတယ်။",
    "He finds gardening ______.",
    "ဥယျာဉ်စိုက်တာကို ______ လို့ သူယူဆတယ်။",
    "interesting",
    "He is really ______ in gardening.",
    "ဥယျာဉ်စိုက်တာကို သူ တကယ် ______ တယ်။",
    "interested",
  ],
  [
    "My roommate listens to loud music most of the time. (annoy)",
    "အခန်းဖော်က အချိန်အများစုမှာ ဂီတကို အသံကျယ်ကျယ် နားထောင်တယ်။",
    "This makes me really ______.",
    "ဒါက ကျွန်တော့်ကို တကယ် ______ စေတယ်။",
    "annoyed",
    "It’s really ______ to me.",
    "ဒါက ကျွန်တော့်အတွက် တကယ် ______ တယ်။",
    "annoying",
  ],
  [
    "The film I watched last night was not so good as I expected. (disappoint)",
    "မနေ့ညက ကြည့်တဲ့ရုပ်ရှင်က မျှော်လင့်သလောက် မကောင်းဘူး။",
    "The film was ______.",
    "ရုပ်ရှင်က ______ တယ်။",
    "disappointing",
    "I was ______ with the film.",
    "ရုပ်ရှင်ကြောင့် ကျွန်တော် ______ ခဲ့တယ်။",
    "disappointed",
  ],
  [
    "You were so rude to your friend yesterday. (disgust)",
    "မနေ့က သင့်သူငယ်ချင်းကို အလွန် ရိုင်းပျခဲ့တယ်။",
    "We were totally ______ with your behaviour.",
    "သင့်အပြုအမူကို ကျွန်တော်တို့ အလွန် ______ တယ်။",
    "disgusted",
    "Your behaviour towards your friend was ______.",
    "သင့်သူငယ်ချင်းအပေါ် ပြုမူပုံက ______ တယ်။",
    "disgusting",
  ],
  [
    "Daw Wai Wai has been doing the household chores all day. (exhaust)",
    "ဒေါ်ဝေဝေ တစ်နေ့လုံး အိမ်မှုကိစ္စလုပ်နေခဲ့တယ်။",
    "She finds her day ______.",
    "သူမအတွက် ဒီနေ့က ______ တယ်။",
    "exhausting",
    "She is totally ______ from doing the housework.",
    "အိမ်မှုကိစ္စလုပ်ရလို့ သူမ အလွန် ______ နေတယ်။",
    "exhausted",
  ],
  [
    "Yesterday Myintzu began to see her close friend’s true colours. (shock)",
    "မနေ့က မြင့်ဇူဟာ သူ့ရင်းနှီးတဲ့ သူငယ်ချင်းရဲ့ သရုပ်မှန်ကို စတင်မြင်လာတယ်။",
    "Myintzu was ______ to see his true colours.",
    "သူ့သရုပ်မှန်ကို မြင်တော့ မြင့်ဇူ ______ သွားတယ်။",
    "shocked",
    "It was ______ that he suddenly revealed his real character.",
    "သူ ရုတ်တရက် စရိုက်မှန် ပြလာတာ ______ တယ်။",
    "shocking",
  ],
  [
    "Myint Myint spends her free time reading novels and magazines. (relax)",
    "မြင့်မြင့်က အားလပ်ချိန်မှာ ဝတ္ထုနဲ့ မဂ္ဂဇင်းတွေ ဖတ်တယ်။",
    "Reading makes her feel ______.",
    "စာဖတ်ရင် သူမ ______ တယ်။",
    "relaxed",
    "It is ______ for her to read books.",
    "သူမအတွက် စာအုပ်ဖတ်တာက ______ တယ်။",
    "relaxing",
  ],
  [
    "I am not happy with my sister as she is selfish. (embarrass)",
    "အစ်မက တစ်ကိုယ်ကောင်းဆန်လို့ ကျွန်တော် မနှစ်သက်ဘူး။",
    "Her selfishness is so ______.",
    "သူမ တစ်ကိုယ်ကောင်းဆန်တာ အလွန် ______ တယ်။",
    "embarrassing",
    "I usually feel so ______ about her selfish behaviour.",
    "သူမ တစ်ကိုယ်ကောင်းဆန်တဲ့ အပြုအမူကြောင့် ကျွန်တော် အများအားဖြင့် အလွန် ______ တယ်။",
    "embarrassed",
  ],
  [
    "We haven’t seen Cherry for the last two years. (astonish)",
    "ချယ်ရီကို မတွေ့တာ နှစ်နှစ်ရှိပြီ။",
    "We are ______ to find that she has changed a lot.",
    "သူမ အများကြီး ပြောင်းလဲနေတာ တွေ့ရလို့ ကျွန်တော်တို့ ______ ကြတယ်။",
    "astonished",
    "It is ______ to see how much she has changed.",
    "သူမ ဘယ်လောက် ပြောင်းလဲသွားလဲ မြင်ရတာ ______ တယ်။",
    "astonishing",
  ],
];
const vocabA: readonly Item[] = [
  [
    "I’m ______ that you can’t come to my wedding.",
    "ကျွန်တော့်မင်္ဂလာပွဲကို မလာနိုင်လို့ ______ တယ်။",
    "disappointed",
    ["disappointing", "disappointed"],
  ],
  [
    "Bears are ______ when they get angry.",
    "ဝက်ဝံတွေ ဒေါသထွက်ရင် ______ တယ်။",
    "terrifying",
    ["terrifying", "terrified"],
  ],
  [
    "She looked ______ and confident before the match.",
    "ပွဲမစခင် သူမ ______ ပြီး ယုံကြည်မှုရှိပုံရတယ်။",
    "relaxed",
    ["relaxing", "relaxed"],
  ],
  [
    "Local people are ______ by the spread of the disease.",
    "ရောဂါပျံ့နှံ့တာကြောင့် ဒေသခံတွေ ______ နေတယ်။",
    "worried",
    ["worrying", "worried"],
  ],
  [
    "I’ve had a very ______ day at work and I need to have a good long rest.",
    "အလုပ်မှာ အရမ်း ______ တဲ့နေ့ ကြုံခဲ့လို့ ကြာကြာ အနားယူဖို့ လိုတယ်။",
    "tiring",
    ["tiring", "tired"],
  ],
  [
    "Students are ______ about their field trip to Mount Popa.",
    "ကျောင်းသားတွေ ပုပ္ပားတောင် လေ့လာရေးခရီးအတွက် ______ နေကြတယ်။",
    "excited",
    ["exciting", "excited"],
  ],
  [
    "Children are playing outside noisily. They are so ______.",
    "ကလေးတွေ အပြင်မှာ ဆူဆူညံညံ ကစားနေကြတယ်။ အရမ်း ______ တယ်။",
    "annoying",
    ["annoying", "annoyed"],
  ],
  [
    "My uncle told me a very ______ story. I laughed and laughed.",
    "ဦးလေးက အလွန် ______ တဲ့ ဇာတ်လမ်းတစ်ပုဒ် ပြောပြလို့ ကျွန်တော် အများကြီး ရယ်ခဲ့တယ်။",
    "amusing",
    ["amusing", "amused"],
  ],
  [
    "His early life is really ______ to me.",
    "သူ့ငယ်ဘဝက ကျွန်တော့်အတွက် တကယ် ______ တယ်။",
    "fascinating",
    ["fascinating", "fascinated"],
  ],
  [
    "The map was ______ and I got lost.",
    "မြေပုံက ______ လို့ ကျွန်တော် လမ်းပျောက်ခဲ့တယ်။",
    "confusing",
    ["confusing", "confused"],
  ],
];
const vocabB: readonly Item[] = [
  [
    "He is very ______. He tells lots of jokes when he gives a speech in public.",
    "သူက အလွန် ______ တယ်။ လူအများရှေ့ မိန့်ခွန်းပြောရင် ဟာသတွေ ပြောတတ်တယ်။",
    "amusing",
  ],
  [
    "This is a terribly ______ book. Nothing interesting happens in it.",
    "ဒီစာအုပ်က အရမ်း ______ တယ်။ စိတ်ဝင်စားစရာ ဘာမှမဖြစ်ဘူး။",
    "boring",
  ],
  [
    "She’s ______ in fashion and often talks about it.",
    "သူမ ဖက်ရှင်ကို ______ ပြီး အဲဒီအကြောင်း မကြာခဏ ပြောတယ်။",
    "interested",
  ],
  [
    "I’m ______ by the whole thing — can you repeat all that again?",
    "အကြောင်းအရာအားလုံးကြောင့် ______ နေတယ်။ အားလုံး ပြန်ပြောပေးနိုင်မလား။",
    "confused",
  ],
  [
    "She was ______ because she had nothing to do all day.",
    "တစ်နေ့လုံး ဘာမှလုပ်စရာမရှိလို့ သူမ ______ နေတယ်။",
    "bored",
  ],
  [
    "Everyone else thought it was funny, but she wasn’t ______.",
    "သူများအားလုံး ရယ်စရာလို့ ထင်ပေမဲ့ သူမ ______ မဖြစ်ဘူး။",
    "amused",
  ],
  [
    "Your instruction is really ______. Could you explain it to me again?",
    "သင့်ညွှန်ကြားချက်က တကယ် ______ တယ်။ ပြန်ရှင်းပြပေးနိုင်မလား။",
    "confusing",
  ],
  [
    "It is ______ that she failed the exam, because she’s a good student.",
    "သူမက ကျောင်းသူတော်တစ်ယောက်ဖြစ်လို့ စာမေးပွဲကျတာ ______ တယ်။",
    "surprising",
  ],
  [
    "Everyone was ______ to hear the news of his sudden death.",
    "သူ ရုတ်တရက် ဆုံးသွားတဲ့သတင်းကို ကြားတော့ လူတိုင်း ______ ကြတယ်။",
    "surprised",
  ],
  [
    "The story was very ______ so I was totally lost in it.",
    "ဇာတ်လမ်းက အလွန် ______ လို့ ကျွန်တော် အာရုံအပြည့် စိုက်မိသွားတယ်။",
    "interesting",
  ],
];
const vocabulary = [
  exercise("A. Choose the correct option.", "မှန်ကန်တဲ့ စကားလုံးကို ရွေးပါ။", vocabA),
  exercise(
    "B. Complete each sentence using the correct word from the box. Use each word once.",
    "အကွက်ထဲက မှန်ကန်တဲ့ စကားလုံးနဲ့ ဖြည့်ပါ။ စကားလုံးတစ်လုံးစီကို တစ်ကြိမ်သာသုံးပါ။",
    vocabB.map(([en, my, key]): Item => [en, my, key, adjectives]),
    adjectives.join(" · "),
    "ငြီးငွေ့နေသော၊ စိတ်ဝင်စားနေသော၊ အံ့ဩစရာကောင်းသော၊ ရယ်စရာကောင်းသော၊ ရှုပ်ထွေးနေသော၊ ငြီးငွေ့စရာကောင်းသော၊ ရယ်မောပျော်ရွှင်သော၊ နားရှုပ်စေသော၊ အံ့ဩနေသော၊ စိတ်ဝင်စားစရာကောင်းသော",
  ),
  exercise(
    "C. Complete the sentences with the correct participle adjectives (-ed or -ing adjectives).",
    "ခံစားသူကို ဖော်ပြတဲ့ နာမဝိသေသနနဲ့ ခံစားမှုဖြစ်စေသူကို ဖော်ပြတဲ့ နာမဝိသေသနထဲက မှန်ရာကို ရွေးပြီး ဖြည့်ပါ။",
    adjectivePairs.flatMap(([stem, stemMy, a, aMy, aKey, b, bMy, bKey], index): Item[] => [
      [`${index + 1}(a). ${stem}\n${a}`, `${stemMy}\n${aMy}`, aKey],
      [`${index + 1}(b). ${b}`, `${stemMy}\n${bMy}`, bKey],
    ]),
  ),
];

const endings = [
  "of the wealth and success of other people.",
  "with me about my careless mistakes.",
  "by the way he talked.",
  "on fishing. I think it’s so boring.",
  "about Ko Oo. He didn’t come back home last night.",
];
const grammarBank = [
  "good at",
  "upset by",
  "scared of",
  "excited about",
  "interested in",
  "pleased with",
  "bored with",
  "angry with",
  "fed up with",
  "aware of",
];
const grammar = [
  exercise(
    "A. Match the beginnings (1–5) with their endings (a–e).",
    "ဝါကျအစ ၁ မှ ၅ ကို သက်ဆိုင်ရာ ဝါကျအဆုံးနဲ့ တွဲပါ။",
    [
      ["He was embarrassed", "သူ ရှက်ရွံ့ခဲ့တယ်။", endings[2], endings],
      ["I’m not very keen", "ကျွန်တော် သိပ် စိတ်မဝင်စားဘူး။", endings[3], endings],
      ["We should not be jealous", "ကျွန်တော်တို့ မနာလို မဖြစ်သင့်ဘူး။", endings[0], endings],
      ["I’m really worried", "ကျွန်တော် တကယ် စိုးရိမ်နေတယ်။", endings[4], endings],
      ["The teacher was annoyed", "ဆရာမ စိတ်အနှောင့်အယှက် ဖြစ်ခဲ့တယ်။", endings[1], endings],
    ],
    endings.join("\n"),
    "သူများရဲ့ ဥစ္စာနဲ့ အောင်မြင်မှုအပေါ်\nကျွန်တော် ပေါ့ဆပြီး မှားခဲ့တာနဲ့ ပတ်သက်ပြီး ကျွန်တော့်အပေါ်\nသူ စကားပြောပုံကြောင့်\nငါးမျှားတာကို။ ပျင်းစရာကောင်းတယ်လို့ ထင်တယ်။\nကိုဦးအတွက်။ မနေ့ည အိမ်ပြန်မလာခဲ့ဘူး။",
  ),
  exercise(
    "B. Complete each sentence with an appropriate phrase in the box.",
    "အကွက်ထဲက သင့်တော်တဲ့ စကားစုနဲ့ ဝါကျတစ်ကြောင်းစီကို ဖြည့်ပါ။",
    (
      [
        [
          "As Kyaw Kyaw was ______ astronomy, he bought a small telescope.",
          "ကျော်ကျော် နက္ခတ္တဗေဒကို ______ လို့ မှန်ပြောင်းအသေးတစ်လုံး ဝယ်ခဲ့တယ်။",
          "interested in",
        ],
        [
          "He was very ______ driving again after the accident.",
          "မတော်တဆမှုအပြီး ကားပြန်မောင်းဖို့ အလွန် ______ တယ်။",
          "scared of",
        ],
        [
          "I am ______ my studies. I have to do a lot of lessons hour by hour without a break.",
          "ကျွန်တော် စာလေ့လာရတာ ______ တယ်။ မနားဘဲ နာရီတိုင်း သင်ခန်းစာအများကြီး လုပ်နေရတယ်။",
          "fed up with",
        ],
        [
          "We should be ______ the danger of taking narcotic drugs.",
          "မူးယစ်ဆေး သုံးစွဲခြင်းရဲ့ အန္တရာယ်ကို ______ သင့်တယ်။",
          "aware of",
        ],
        [
          "My father was really ______ me for teasing my younger sister.",
          "ညီမကို စနောက်တဲ့အတွက် အဖေ ကျွန်တော့်ကို တကယ် ______ တယ်။",
          "angry with",
        ],
        [
          "She is very ______ playing chess. She always beats me when I play with her.",
          "သူမ စစ်တုရင် ကစားတာ အလွန် ______ တယ်။ သူနဲ့ကစားရင် ကျွန်တော် အမြဲရှုံးတယ်။",
          "good at",
        ],
        [
          "He was deeply ______ his friend’s insulting remarks.",
          "သူငယ်ချင်းရဲ့ စော်ကားတဲ့ စကားတွေကြောင့် သူ အလွန် ______ တယ်။",
          "upset by",
        ],
        [
          "Students were ______ the upcoming summer holidays.",
          "လာမယ့် နွေရာသီပိတ်ရက်အတွက် ကျောင်းသားတွေ ______ ကြတယ်။",
          "excited about",
        ],
        [
          "My father is ______ my success. He gave me a watch as a reward.",
          "ကျွန်တော့် အောင်မြင်မှုကို အဖေ ______ တယ်။ ဆုအဖြစ် နာရီတစ်လုံး ပေးတယ်။",
          "pleased with",
        ],
        [
          "He was so ______ his friend’s endless conversation that he nearly fell asleep.",
          "သူငယ်ချင်းရဲ့ မဆုံးနိုင်တဲ့ စကားတွေကြောင့် အလွန် ______ ပြီး အိပ်ပျော်လုနီးပါး ဖြစ်ခဲ့တယ်။",
          "bored with",
        ],
      ] as const
    ).map(([en, my, key]): Item => [en, my, key, grammarBank]),
    grammarBank.join(" · "),
    "ကျွမ်းကျင်သော၊ ကြောင့် စိတ်ထိခိုက်သော၊ ကြောက်သော၊ အကြောင်း စိတ်လှုပ်ရှားသော၊ စိတ်ဝင်စားသော၊ ကျေနပ်သော၊ ငြီးငွေ့သော၊ စိတ်ဆိုးသော၊ စိတ်ကုန်သော၊ သိရှိသတိထားသော",
  ),
];

const listening = [
  exercise(
    "A. Listen to a psychologist talking about some strategies to deal with stress and number the strategies that you hear.",
    "စိတ်ဖိစီးမှု ကိုင်တွယ်နည်းအကြောင်း စိတ်ပညာရှင် ပြောတာ နားထောင်ပြီး နားထောင်ရတဲ့ အစီအစဉ်အတိုင်း နံပါတ်တပ်ပါ။",
    [
      [
        "Taking regular exercise",
        "ပုံမှန် ကိုယ်လက်လှုပ်ရှားခြင်း",
        undefined,
        ["1", "2", "3", "4"],
      ],
      ["Keeping a mood journal", "စိတ်ခံစားမှု မှတ်တမ်းရေးခြင်း", undefined, ["1", "2", "3", "4"]],
      [
        "Mindfulness",
        "လက်ရှိအခိုက်အတန့်ကို သတိနဲ့ အာရုံစိုက်ခြင်း",
        undefined,
        ["1", "2", "3", "4"],
      ],
      ["Laughter", "ရယ်မောခြင်း", undefined, ["1", "2", "3", "4"]],
    ],
  ),
  exercise("B. Listen again and complete the sentences.", "ထပ်နားထောင်ပြီး ဝါကျတွေကို ဖြည့်ပါ။", [
    [
      "In his talk, the psychologist refers to stress as the ______ of the 21st century.",
      "စိတ်ပညာရှင်က စိတ်ဖိစီးမှုကို ၂၁ ရာစုရဲ့ ______ အဖြစ် ရည်ညွှန်းပါတယ်။",
    ],
    [
      "The ______ of a loved one is one of the major life-changing events that can lead to stress.",
      "ချစ်ရသူတစ်ဦး ______ ခြင်းက စိတ်ဖိစီးစေနိုင်တဲ့ ဘဝပြောင်းလဲမှုကြီးတွေထဲက တစ်ခုပါ။",
    ],
    [
      "If you do not have enough ______ over a long period of time, you are likely to have high levels of stress.",
      "အချိန်ကြာကြာ ______ လုံလောက်မှု မရှိရင် စိတ်ဖိစီးမှု မြင့်နိုင်ပါတယ်။",
    ],
    [
      "Stress can make us put on or lose ______ over a short period of time.",
      "စိတ်ဖိစီးမှုက အချိန်တိုအတွင်း ______ တိုးစေ၊ လျော့စေနိုင်ပါတယ်။",
    ],
    [
      "Mindfulness is a great way to ______ the ups and downs of our emotions.",
      "သတိနဲ့ အာရုံစိုက်ခြင်းက စိတ်ခံစားမှု အတက်အကျတွေကို ______ ဖို့ နည်းလမ်းကောင်းတစ်ခုပါ။",
    ],
    [
      "Laughter produces ______ that make you feel happier.",
      "ရယ်မောခြင်းက ပိုပျော်စေတဲ့ ______ တွေကို ထုတ်ပေးပါတယ်။",
    ],
    [
      "In many countries, laughter is used in hospitals as a strategy to make patients feel less ______.",
      "နိုင်ငံအများအပြားရဲ့ ဆေးရုံတွေမှာ လူနာတွေ ______ နည်းစေဖို့ ရယ်မောခြင်းကို အသုံးပြုကြတယ်။",
    ],
    [
      "You should exercise ______ times a week to reduce stress.",
      "စိတ်ဖိစီးမှု လျော့ဖို့ တစ်ပတ် ______ ကြိမ် ကိုယ်လက်လှုပ်ရှားသင့်တယ်။",
    ],
    ["Swimming is a good way of ______.", "ရေကူးတာဟာ ______ ဖို့ နည်းလမ်းကောင်းပါ။"],
    [
      "Keeping a ______ really helps us to reduce stress.",
      "______ ထားတာက စိတ်ဖိစီးမှု လျော့ဖို့ တကယ် ကူညီတယ်။",
    ],
  ]),
];

const dialogue = [
  [
    "Nilar",
    "Hello, Thazin. You look tired. What’s wrong with you?",
    "မင်္ဂလာပါ သဇင်။ မောနေသလိုပဲ။ ဘာဖြစ်လို့လဲ။",
  ],
  [
    "Thazin",
    "You know, I’ve got a lot of pressure from my parents. They want me to get good marks in all subjects. So I’ve been busy with my studies all the time. The problem is, er, I often have headaches and can’t sleep well at night these days.",
    "မိဘတွေဆီက ဖိအားအများကြီး ရနေတယ်။ ဘာသာတိုင်း အမှတ်ကောင်းကောင်းရစေချင်ကြတယ်။ ဒါကြောင့် တစ်ချိန်လုံး စာနဲ့ အလုပ်ရှုပ်နေတယ်။ အခုတလော ခေါင်းခဏခဏ ကိုက်ပြီး ညဘက် ကောင်းကောင်း အိပ်လို့မရဘူး။",
  ],
  [
    "Nilar",
    "Oh, I see. You’re feeling stressed out. **You ought to** find some strategies to relax before it gets worse.",
    "သဘောပေါက်ပြီ။ နင် စိတ်ဖိစီးနေတာပဲ။ ပိုမဆိုးခင် အနားရစေမယ့် နည်းလမ်းတွေ ရှာသင့်တယ်။",
  ],
  [
    "Thazin",
    "I think you’re right. What should I do?",
    "နင်ပြောတာ မှန်မယ်ထင်တယ်။ ငါ ဘာလုပ်သင့်လဲ။",
  ],
  [
    "Nilar",
    "You should have some time for leisure activities. For example, you should take up a hobby like drawing or cooking. A break from study can refresh your mind and body.",
    "အပန်းဖြေဖို့ အချိန်နည်းနည်း ထားသင့်တယ်။ ဥပမာ ပုံဆွဲတာ၊ ဟင်းချက်တာလို ဝါသနာတစ်ခု စလုပ်သင့်တယ်။ စာခဏနားလိုက်ရင် စိတ်ရော ကိုယ်ပါ လန်းဆန်းလာနိုင်တယ်။",
  ],
  [
    "Thazin",
    "That’s true. I haven’t thought about it. Actually, I’m interested in drawing. Another problem is I want to be alone, but this makes me feel depressed. What do you suggest?",
    "မှန်တယ်။ အဲဒါကို မစဉ်းစားမိဘူး။ တကယ်တော့ ပုံဆွဲတာကို စိတ်ဝင်စားတယ်။ နောက်တစ်ခုက တစ်ယောက်တည်း နေချင်ပေမဲ့ အဲဒါကြောင့် စိတ်ဓာတ်ကျသလို ခံစားရတယ်။ ဘာအကြံပေးချင်လဲ။",
  ],
  [
    "Nilar",
    "You’d better socialize more. What I mean is you should make time to see friends two or three evenings a week. Hanging out with friends is a good way to relax.",
    "လူတွေနဲ့ ပိုပေါင်းသင်းရင် ကောင်းမယ်။ ဆိုလိုတာက တစ်ပတ်မှာ နှစ်ည သုံးညလောက် သူငယ်ချင်းတွေကို တွေ့ဖို့ အချိန်ပေးသင့်တယ်။ သူငယ်ချင်းတွေနဲ့ တွေ့ဆုံတာ စိတ်အပန်းဖြေဖို့ ကောင်းတယ်။",
  ],
  [
    "Thazin",
    "I see your point, but my parents wouldn’t allow me to go out with my friends often.",
    "နင်ပြောတာ နားလည်ပါတယ်။ ဒါပေမဲ့ မိဘတွေက သူငယ်ချင်းတွေနဲ့ မကြာခဏ အပြင်ထွက်ခွင့် ပေးမှာမဟုတ်ဘူး။",
  ],
  [
    "Nilar",
    "I see. Why don’t you exercise regularly? Physical activity produces chemicals in the brain that make you feel happy.",
    "နားလည်ပြီ။ ပုံမှန် ကိုယ်လက်လှုပ်ရှားကြည့်ပါလား။ ကိုယ်လက်လှုပ်ရှားရင် ဦးနှောက်ထဲမှာ ပျော်ရွှင်စေတဲ့ ဓာတ်တွေ ထွက်လာတယ်။",
  ],
  [
    "Thazin",
    "OK, I’ll do that. Thank you for your suggestions.",
    "ကောင်းပြီ၊ အဲဒီလို လုပ်မယ်။ အကြံပေးတာ ကျေးဇူးတင်ပါတယ်။",
  ],
] as const;
export const unit4SpeakingLines = dialogue.map(([speaker, en, my], i) => ({
  id: `g12-u4-speaking-${i + 1}`,
  en: en.replaceAll("**", ""),
  my,
  page: i < 5 ? 43 : 44,
  speaker,
}));
const speaking = [
  exercise(
    "C. Study the dialogue and underline the language expressions used to ask for suggestions and to give suggestions and responses. The first one is done as an example.",
    "အကြံတောင်း၊ အကြံပေးနဲ့ ပြန်တုံ့ပြန်ရာမှာ အသုံးပြုတဲ့ စကားရပ်တွေကို စကားပြောခန်းထဲက ရှာပြီး မျဉ်းသားပါ။ ပထမတစ်ခုကို နမူနာ ပြထားပါတယ်။",
    [["Expressions in the dialogue", "စကားပြောခန်းထဲက အသုံးအနှုန်းများ"]],
    dialogue.map(([speaker, en]) => `${speaker}: ${en}`).join("\n\n"),
    dialogue
      .map(([speaker, , my]) => `${speaker === "Nilar" ? "နီလာ" : "သဇင်"}။ ${my}`)
      .join("\n\n"),
  ),
  exercise(
    "D. Read the dialogue again and put the underlined expressions in Exercise C in the correct column.",
    "စကားပြောခန်းကို ပြန်ဖတ်ပြီး လေ့ကျင့်ခန်း ဂ မှ မျဉ်းသားထားတဲ့ စကားရပ်တွေကို သက်ဆိုင်ရာ ကော်လံထဲ ထည့်ပါ။",
    [
      ["Asking for suggestions", "အကြံတောင်းခြင်း"],
      ["Giving suggestions", "အကြံပေးခြင်း"],
      ["Responses — Agreeing", "တုံ့ပြန်မှု — သဘောတူခြင်း"],
      ["Responses — Disagreeing", "တုံ့ပြန်မှု — သဘောမတူခြင်း"],
    ],
  ),
  exercise("E. In pairs, practise the dialogue.", "နှစ်ယောက်တွဲပြီး စကားပြောခန်းကို လေ့ကျင့်ပါ။", [
    ["Dialogue practice notes", "စကားပြောလေ့ကျင့်မှု မှတ်စု"],
  ]),
];
const writing = [
  exercise(
    "Write an essay on ‘How to deal with stress’, using the answers to the following questions as prompts.",
    "အောက်ပါမေးခွန်းတွေရဲ့ အဖြေတွေကို လမ်းညွှန်အဖြစ် သုံးပြီး ‘စိတ်ဖိစီးမှုကို ဘယ်လို ကိုင်တွယ်မလဲ’ ခေါင်းစဉ်နဲ့ စာစီစာကုံး ရေးပါ။",
    [
      [
        "In what situations do people often feel stressed?",
        "လူတွေ ဘယ်လိုအခြေအနေတွေမှာ စိတ်ဖိစီးတတ်သလဲ။",
      ],
      ["Who suffers from stress most?", "ဘယ်သူတွေ စိတ်ဖိစီးမှုကို အများဆုံး ခံစားရသလဲ။"],
      ["How does stress affect our health?", "စိတ်ဖိစီးမှုက ကျန်းမာရေးကို ဘယ်လို ထိခိုက်စေသလဲ။"],
      ["What can we do to reduce stress?", "စိတ်ဖိစီးမှု လျော့ဖို့ ဘာလုပ်နိုင်သလဲ။"],
      [
        "What advice will you give to people who want to reduce stress?",
        "စိတ်ဖိစီးမှု လျော့ချချင်သူတွေကို ဘာအကြံပေးမလဲ။",
      ],
      ["Your essay", "သင့်စာစီစာကုံး"],
    ],
  ),
];
const sections = { reading, vocabulary, grammar, listening, speaking, writing };
export const unit4Exercises = Object.fromEntries(
  Object.entries(sections).map(([skill, groups]) => [skill, groups.map(({ source }) => source)]),
) as Record<Grade12Skill, TextbookExercise[]>;
export const unit4ExercisesMy = Object.fromEntries(
  Object.entries(sections).map(([skill, groups]) => [
    skill,
    groups.map(({ translation }) => translation),
  ]),
) as Record<Grade12Skill, ExerciseTranslation[]>;

export const unit4References = {
  vocabulary: [
    "They come from verbs and can have two forms: adjectives that end with -ed (e.g. amazed) and adjectives that end with -ing (e.g. amazing).",
    "We use -ed adjectives to describe how we feel.\nI was so bored with that lesson; I almost fell asleep.\nHe was surprised to see Helen after all those years.\nShe was really tired and went to bed early.",
    "We use -ing adjectives to describe a thing or person that makes us have a feeling.\nHave you seen that film? It’s really frightening.\nHe is the most boring person I’ve ever met.\nI can’t sleep well! That noise is really annoying!",
  ],
  grammar: [
    "When we study adjectives, it is a good idea to study the prepositions that go with them.",
    "I am really frightened of spiders.",
    "The teacher was very satisfied with her students’ work.",
  ],
  writing: [],
} as const;

export const unit4VocabularyMy = [
  "ဒီနာမဝိသေသနတွေက ကြိယာမှ ဆင်းသက်လာပြီး ခံစားသူကို ဖော်ပြတဲ့ ပုံစံနဲ့ ခံစားမှုဖြစ်စေသူကို ဖော်ပြတဲ့ ပုံစံ နှစ်မျိုးရှိပါတယ်။",
  "ခံစားသူကို ဖော်ပြတဲ့ ပုံစံကို ကိုယ်ဘယ်လို ခံစားရလဲ ပြောဖို့ သုံးပါတယ်။ အဲဒီသင်ခန်းစာကို အလွန် ငြီးငွေ့လို့ အိပ်ပျော်လုနီးပါး ဖြစ်ခဲ့တယ်။ နှစ်ပေါင်းများစွာကြာပြီး ဟယ်လင်ကို တွေ့တော့ သူ အံ့ဩခဲ့တယ်။ သူမ အလွန် မောပန်းလို့ စောစော အိပ်ရာဝင်ခဲ့တယ်။",
  "ခံစားမှုဖြစ်စေတဲ့ လူနဲ့ အရာကို ဖော်ပြတဲ့ ပုံစံလည်း ရှိပါတယ်။ အဲဒီရုပ်ရှင် ကြည့်ဖူးလား။ တကယ် ကြောက်စရာကောင်းတယ်။ သူက ကျွန်တော် တွေ့ဖူးသမျှထဲမှာ ငြီးငွေ့စရာ အကောင်းဆုံးလူပါ။ ကောင်းကောင်း အိပ်လို့မရဘူး။ အဲဒီအသံက တကယ် စိတ်အနှောင့်အယှက် ဖြစ်စေတယ်။",
];

export const unit4ComprehensionSamples = [
  "The two main types of emotions are positive emotions and negative emotions.",
  "I agree because stressful situations can make me feel worried or disappointed more often than I expect.",
  "We usually blame or criticise others when something bad or unkind happens to us.",
  "We feel depressed, distressed or frustrated when we cannot fulfil our wants or needs.",
  "Emotional well-being helps us cope with life’s challenges, recover from setbacks and experience pleasant feelings.",
  "A good sense of emotional well-being is essential for us to enjoy a better quality of life.",
  "I usually take a short break and talk to someone I trust before I react.",
  "Two other ways are keeping a mood journal and setting aside time for a relaxing hobby.",
];

export const unit4ReadingStructuresMy = [
  "အမျိုးအစားနှစ်ခုကို စာရင်းပြပြီး ဝါကျအပြည့်ဖြေပါ။",
  "သဘောတူသလား အရင်ပြောပြီး အကြောင်းပြချက်ကို စကားဆက်နဲ့ ရှင်းပါ။",
  "ဖြစ်ရပ်ကြုံတဲ့အခါ ပုံမှန်လုပ်တတ်တဲ့ လုပ်ရပ်ကို ဝါကျအပြည့် ဖော်ပြပါ။",
  "ခံစားချက်တွေကို ဖော်ပြပြီး ဘယ်အခြေအနေမှာ ဖြစ်သလဲ ဆက်ရေးပါ။",
  "အရေးကြီးရတဲ့ အကြောင်းရင်းကို ဖတ်စာထဲက အကျိုးကျေးဇူးနဲ့ ဆက်စပ်ဖြေပါ။",
  "မရှိမဖြစ်လိုအပ်တဲ့ အချက်ကို ဝါကျရဲ့ ကတ္တားအဖြစ်ထားပြီး ဖြေပါ။",
  "ကိုယ်လုပ်နေကျ နည်းလမ်းတစ်ခုကို ပထမပုဂ္ဂိုလ်နဲ့ ဖော်ပြပါ။",
  "ကိုယ့်အကြံပြုချက် နှစ်ခုကို ပုံစံတူ စကားစုနှစ်ခုနဲ့ ဖော်ပြပါ။",
];
