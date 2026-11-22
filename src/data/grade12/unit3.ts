import type { Grade12Skill } from "./syllabus";
import type { TextbookExercise, TextbookItem } from "./unit2";
import passages from "./unit3-passages.json";

// Grade 12 textbook, printed pages 22–31. Answer values are suggested study answers.
export const unit3Reading = passages.reading;

const makeItems = (
  texts: readonly string[],
  keys?: readonly string[],
  choices?: readonly string[],
): TextbookItem[] => texts.map((text, index) => ({ text, answer: keys?.[index], choices }));

const gapPhrases = [
  "that can be harmful to our health",
  "which is necessary for the survival and healthy development of human beings",
  "their hopes of thriving in the long run will be dashed",
  "we will get all our essential nutrients",
  "that provide fatty acids",
];
const nutritionWords = [
  "varied",
  "nutrition",
  "dietary",
  "effects",
  "vitamins",
  "balance",
  "nutrients",
  "fats",
  "work",
  "specific",
];
export { unit3SpeakingTopics } from "./unit3-roleplay";
const speakingExample =
  "Essential foods for nutrition\n\nI’d like to talk about essential foods to get nutrients. The food we eat can be divided into grains, fruits, vegetables, milk products, animal products, and beans. These foods carry six types of nutrients: carbohydrates, vitamins, minerals, fibre, proteins and lipids. We can maintain good health by having these foods. Firstly, grains such as rice, wheat, maize, millet, barley, and corn are energy-giving foods because we get carbohydrates from them. Secondly, fruits and vegetables give minerals, vitamins and fibre. Thirdly, milk products give proteins. Fourthly, animal products provide the same proteins. What’s more, beans are an excellent source of proteins. Finally, foods such as vegetable oil, fish and other seafood, plant oil, nuts and seeds, eggs, yogurt, milk, etc. are energy-giving foods. To sum up, if we eat these foods regularly, we will be healthy and happy. Therefore, these foods are essential for nutrition.";

export const unit3Exercises: Record<Grade12Skill, TextbookExercise[]> = {
  reading: [
    {
      instruction: "Pre-reading",
      items: makeItems([
        "What do you eat every day? What do you eat on special occasions?",
        "Do you think that the food you eat is good for your health? Why?",
        "What kinds of food do you think help people lose / gain weight?",
      ]),
    },
    {
      instruction:
        "A. Read the passage and choose the appropriate phrases (a–e) to complete the gaps (1–5).",
      items: makeItems(
        ["Gap 1", "Gap 2", "Gap 3", "Gap 4", "Gap 5"],
        [gapPhrases[4], gapPhrases[3], gapPhrases[0], gapPhrases[2], gapPhrases[1]],
        gapPhrases,
      ),
    },
    {
      instruction:
        "B. In pairs, find the bold-faced words in the passage that are opposite in meaning to the following. There are two extras.",
      items: makeItems(
        [
          "poor",
          "insignificant",
          "unwise",
          "ill",
          "unwholesome",
          "natural",
          "positive",
          "careless",
          "global",
          "fresh",
        ],
        [
          "excellent",
          "important",
          "advisable",
          "healthy",
          "nutritious",
          "artificial",
          "adverse",
          "careful",
          "local",
          "processed",
        ],
      ),
    },
    {
      instruction: "C. Complete each sentence below with a suitable answer from Exercise B.",
      items: makeItems(
        [
          "The majority of the ______ foods may contain harmful chemicals.",
          "Our homemade foods and drinks are free from ______ colours and flavours.",
          "According to nutritionists, it is ______ that we should have a balanced diet.",
          "The tourism industry should promote the sale of ______ foods and products.",
          "Meat, poultry, fish and eggs are an ______ source of complete protein.",
          "Eating a balanced diet will make us fit and ______.",
          "A highly ______ diet contains many of the substances needed for life and growth.",
          "Vitamin D is ______ for our body because it helps build strong bones.",
          "______ effects of food additives are digestive and nervous disorders.",
          "Diabetic patients must be ______ to avoid eating too much sugar.",
        ],
        [
          "processed",
          "artificial",
          "advisable",
          "local",
          "excellent",
          "healthy",
          "nutritious",
          "important",
          "adverse",
          "careful",
        ],
      ),
    },
    {
      instruction: "D. Give a full-sentence answer to each question below.",
      items: makeItems([
        "What is a nutritious diet?",
        "What should you eat to gain essential nutrients for your body?",
        "What is a major cause of ill health?",
        "How can you strengthen your immune system and protect against illness?",
        "What kinds of food should you avoid eating?",
        "Why are forests beneficial to us?",
        "What can cause loss of biodiversity and loss of nutrition to many local communities?",
        "Mention some nutrition-related health problems.",
        "Why is nutrition said to be closely related to the environment?",
        "Why should we avoid eating processed foods?",
      ]),
    },
  ],
  vocabulary: [
    {
      instruction: "A. Rewrite the following with the correct form of the words given in brackets.",
      items: makeItems(
        [
          "One major cause of (nutrition) deficiency is inadequate intake of necessary nutrients.",
          "The (consume) of alcohol is strictly forbidden on campus.",
          "Cancer risks (associate) with smoking are already well known.",
          "All the tomato plants in my garden were destroyed by a new (infect) virus.",
          "He admitted that he had got this job on his cousin’s (recommend).",
          "She has boasted that her daughter is now in the final year of (medicine) school.",
          "(Deforest) is destroying large areas of tropical rainforest in South America.",
          "“Car exhaust fumes are one of several (pollute) in the city,” the mayor said.",
          "Nowadays people are becoming aware of (environment) problems.",
          "We should be wearing (protect) masks in crowded places during the COVID-19 period.",
        ],
        [
          "nutritional",
          "consumption",
          "associated",
          "infectious",
          "recommendation",
          "medical",
          "Deforestation",
          "pollutants",
          "environmental",
          "protective",
        ],
      ),
    },
  ],
  grammar: [
    {
      instruction: "A. Rewrite the following sentences, using participle phrases.",
      items: makeItems(
        [
          "After she had finished the exam, she felt very happy.",
          "Maung Maung knows that his friend enjoys reading. He has decided to buy her a book.",
          "After she had been made redundant, she started looking for a new job.",
          "I stood in a queue. I realised that I didn’t have any money on me.",
          "As she was shocked by the sad news, she didn’t know what to do next.",
          "Kyaw Aung was filled with pride, and he walked towards the stage to receive the prize.",
          "After he had picked up his coat, he slowly went downstairs.",
          "They become fully qualified doctors after they have finished their training.",
          "When he did not understand the lessons, he asked his teacher for help.",
          "When she realised that she had left her ticket, she went back home.",
        ],
        [
          "Having finished the exam, she felt very happy.",
          "Knowing that his friend enjoys reading, Maung Maung has decided to buy her a book.",
          "Having been made redundant, she started looking for a new job.",
          "Standing in a queue, I realised that I didn’t have any money on me.",
          "Shocked by the sad news, she didn’t know what to do next.",
          "Filled with pride, Kyaw Aung walked towards the stage to receive the prize.",
          "Having picked up his coat, he slowly went downstairs.",
          "Having finished their training, they become fully qualified doctors.",
          "Not understanding the lessons, he asked his teacher for help.",
          "Realising that she had left her ticket, she went back home.",
        ],
      ),
    },
    {
      instruction:
        "B. Rewrite the following using the pattern It is / It was (noun / noun phrase / adverbial phrase) who / that … .",
      items: makeItems(
        [
          "My daughter won the first prize **in the mathematics competition**.",
          "My parents bought **a Honda Fit car** for me when I passed the exam.",
          "The author has written many good short stories **for children**.",
          "The angry boys chased **the mad dog** away from the garden.",
          "**Nyo Nyo** broke the flower vase yesterday evening.",
          "He has decided to give back the purse to her **because he is honest**.",
          "A big fire started in my neighbour’s house **last night**.",
          "I saw **an ambulance** rushing to the scene.",
          "**Thandar** found a wallet on her way back home.",
          "**The drought** caused many farmers much trouble.",
        ],
        [
          "It was in the mathematics competition that my daughter won the first prize.",
          "It was a Honda Fit car that my parents bought for me when I passed the exam.",
          "It is for children that the author has written many good short stories.",
          "It was the mad dog that the angry boys chased away from the garden.",
          "It was Nyo Nyo who broke the flower vase yesterday evening.",
          "It is because he is honest that he has decided to give back the purse to her.",
          "It was last night that a big fire started in my neighbour’s house.",
          "It was an ambulance that I saw rushing to the scene.",
          "It was Thandar who found a wallet on her way back home.",
          "It was the drought that caused many farmers much trouble.",
        ],
      ),
    },
    {
      instruction: "C. Join the sentences using ‘not only … but also’.",
      items: makeItems(
        [
          "They will paint the inside of the hall. They will paint the outside of the hall.",
          "The circus comprises magicians and clowns. It also comprises tigers and lions.",
          "He will sing a song at the dinner party. He will also dance at the dinner party.",
          "She enjoys learning English. She also enjoys learning French.",
          "The actress has long, curly blonde hair. She also has lovely blue eyes.",
          "My cousins are good at playing basketball. They are good at playing volleyball as well.",
          "I washed my car yesterday. I cut the grass in my garden yesterday.",
          "My brother can speak Spanish well. My sister can speak Spanish well.",
          "He likes to do exercise at the gym. He likes to go jogging in the park.",
          "It was raining heavily. The wind was blowing hard.",
        ],
        [
          "They will paint not only the inside of the hall but also the outside of the hall.",
          "The circus comprises not only magicians and clowns but also tigers and lions.",
          "He will not only sing a song but also dance at the dinner party.",
          "She enjoys learning not only English but also French.",
          "The actress has not only long, curly blonde hair but also lovely blue eyes.",
          "My cousins are good at playing not only basketball but also volleyball.",
          "Yesterday I not only washed my car but also cut the grass in my garden.",
          "Not only my brother but also my sister can speak Spanish well.",
          "He likes not only to do exercise at the gym but also to go jogging in the park.",
          "Not only was it raining heavily, but the wind was also blowing hard.",
        ],
      ),
    },
  ],
  listening: [
    {
      instruction:
        "A. Listen to a man talking about nutrition. Fill the blanks with the appropriate words given in the box.",
      reference: passages.listening.join("\n\n"),
      items: makeItems(
        nutritionWords.map((_, i) => `Gap ${i + 1}`),
        undefined,
        nutritionWords,
      ),
    },
  ],
  speaking: [
    {
      instruction:
        "B. Study the following speaking cards. Choose one and give a one-minute talk on it.",
      reference: speakingExample,
      items: makeItems(["Speaking topic and notes"], undefined),
    },
  ],
  writing: [
    {
      instruction:
        "A. Study the following opinion writing and check whether it includes the points mentioned above.",
      reference: ["Active video games are worth playing", ...passages.writingA].join("\n\n"),
      items: makeItems(["Notes on the opinion writing"]),
    },
    {
      instruction:
        "B. Study the following opinion essay and check whether it has the points mentioned above.",
      reference: ["Eating Fast Food is Good for Health", ...passages.writingB].join("\n\n"),
      items: makeItems(["Notes on the opinion essay"]),
    },
    {
      instruction:
        "C. Write an opinion essay on ‘Home-cooked foods are a great source of nourishment’.",
      items: makeItems(["Your opinion essay"]),
    },
  ],
};

export const unit3References = {
  vocabulary: [
    "An affix is a grammatical element that is added either to the beginning or end of a word to form a new word. If it is added to the beginning of a word, it is called a prefix. If it is added to the end of a word, it is called a suffix. Therefore, an affix can be either a prefix or a suffix.",
    "nutrition → malnutrition\nill → illness",
  ],
  grammar: [
    "Participle phrases are used to give information in a more economical way. They are formed by using present participles (reading, seeing, walking, etc.), past participles (disappointed, filled, worried, etc.) or perfect participles (having finished, having read, having seen, etc.).",
    "Being a haven of biodiversity, forests are an excellent source of foods such as mushrooms, bamboo shoots, nuts, berries, leaves, and tubers.\nLooked after very carefully, these slippers will last for many years.\nNot wanting to hurt her feelings, I avoided the question.\nHaving lived through difficult times together, they were very close friends.",
    "The sentence pattern ‘It is / it was … who / that …’ can be used to emphasise a particular noun / noun phrase / adverbial phrase.",
    "A balanced diet can strengthen our immune system and protect us against illness.\nIt is a balanced diet that can strengthen our immune system and protect us against illness.\n(The emphasis is placed on the noun phrase ‘a balanced diet’.)",
    "The sentence pattern ‘not only … but also’ is used to present two qualities of a character, an action or an event.",
    "It is important to consider not only the relationship between diet and nutrition but also the influence of environmental factors on them.",
    "To put an extra emphasis, ‘not only’ is used at the beginning of a clause. After ‘not only’ comes an inversion of the order of the subject and the verb.",
    "Not only is she smart, but she is also very rich.\nNot only was it partly sunny, but it was also partly cloudy.",
  ],
  writing: [
    "Paragraph 1 includes an Introduction. Introduce your topic. Start with the opening lines to engage the reader’s interest. Give a hint of what is to follow.",
    "Paragraph 2 includes the Main Body which states your arguments for and your arguments against.",
    "Paragraph 3 includes a Conclusion. Refer back to the topic and summarise. Say why you find one side more convincing than the other.",
    "Begin each paragraph with the main idea and then develop this idea. For a new idea, begin a new paragraph.",
    "Opinion writing is academic writing. Therefore, don’t use an informal style (no contractions, colloquial words, or emotional language).",
  ],
} as const;

export const unit3Affixes = {
  Prefix: [
    ["un-", "‘not’ / opposite meaning", "unhealthy, unsaturated"],
    ["im-", "‘not’ / opposite meaning", "impolite, immature"],
    ["re-", "‘once more’ / ‘again’", "regain, reuse, resupply"],
    ["en-", "‘cause to be something’", "enrich, enforce, enslave"],
    ["dis-", "‘not’ / ‘none’", "disagree, disqualify"],
    ["mis-", "‘badly’ / ‘unfavourably’", "misjudge, mistrust"],
    ["de-", "‘privation’, ‘removal’", "deforestation, dehydration"],
  ],
  Suffix: [
    ["-y (adjective-forming)", "‘characterised by’", "healthy, easy"],
    ["-tious (adjective-forming)", "‘characterised by’", "infectious, ambitious"],
    ["-ed (adjective-forming)", "‘quality’ / ‘state’", "refined, processed"],
    [
      "-al (adjective-forming)",
      "‘pertaining to’ / ‘having the form or character of something’",
      "environmental, original",
    ],
    ["-ful (adjective-forming)", "‘full of’", "harmful, careful, joyful"],
    ["-tive (adjective-forming)", "‘tendency’ / ‘disposition’", "preventive, communicative"],
    ["-ly (adverb-forming)", "‘in a particular way’", "adversely, heavily, quickly"],
    ["-ness (noun-forming)", "‘a state of being’", "illness, happiness, kindness"],
    ["-tion (noun-forming)", "‘action’ / ‘quality’", "consumption, deforestation"],
    ["-ment (noun-forming)", "‘action’ / ‘state’", "nourishment, management"],
    ["-ity (noun-forming)", "‘state’ / ‘quality’", "biodiversity, curiosity"],
    [
      "-ant (noun-forming)",
      "‘something or someone that does something’",
      "pollutant, servant, assistant",
    ],
  ],
} as const;

export const unit3ReadingMy = [
  "စားသောက်ပုံဆိုတာ ကျွန်ုပ်တို့ ပုံမှန်စားသုံးတဲ့ အစားအစာတွေကို ဆိုလိုပါတယ်။ အာဟာရရရှိမှုဆိုတာ သက်ရှိတွေ ကြီးထွားပြီး ကျန်းမာဖို့ လိုအပ်တဲ့ အစာကို ရယူတဲ့ဖြစ်စဉ်ပါ။ နှစ်ခုစလုံးက ကျန်းမာရေး၊ စွမ်းအင်နဲ့ ကြီးထွားမှုအတွက် မရှိမဖြစ်လိုအပ်ပါတယ်။ အပင်တွေ ပေါက်နေတဲ့မြေဆီက အာဟာရရသလို ကျွန်ုပ်တို့လည်း စားတဲ့အစာကနေ ရပါတယ်။ ဒါကြောင့် ခန္ဓာကိုယ် အသက်ရှင်ဖို့ လိုတဲ့ အာဟာရဓာတ်အားလုံး ပါဝင်တဲ့ အစာကို စားဖို့လိုပါတယ်။ စားသောက်ပုံနဲ့ အာဟာရက ပတ်ဝန်းကျင်နဲ့လည်း နီးကပ်စွာ ဆက်စပ်လို့ အချင်းချင်းဆက်စပ်ပုံနဲ့ ပတ်ဝန်းကျင်ရဲ့ သက်ရောက်မှုကိုပါ ထည့်စဉ်းစားရပါတယ်။",
  "ခန္ဓာကိုယ်အတွက် မရှိမဖြစ်လိုတဲ့ အာဟာရတွေကို ကိုယ်စားတဲ့အစာထဲမှာ တွေ့နိုင်ပါတယ်။ အစာကို ကောက်နှံ၊ သစ်သီး၊ ဟင်းသီးဟင်းရွက်၊ နို့ထွက်ပစ္စည်း၊ တိရစ္ဆာန်ထွက်ပစ္စည်းနဲ့ ပဲအမျိုးမျိုး၊ ဆီဓာတ်ပါအစာတို့အဖြစ် ခွဲနိုင်ပါတယ်။ အဲဒီအစာတွေမှာ ကစီဓာတ်၊ ဗီတာမင်၊ သတ္တုဓာတ်၊ အမျှင်ဓာတ်၊ အသားဓာတ်နဲ့ အဆီဓာတ် ခြောက်မျိုးပါဝင်ပြီး ကျန်းမာရေးထိန်းသိမ်းရာမှာ အရေးကြီးပါတယ်။",
  "ဆန်၊ ဂျုံ၊ ပြောင်း၊ နှံစားသီးနှံ၊ ဘာလီနဲ့ ပြောင်းဖူးလို ကောက်နှံတွေက ကစီဓာတ်ပေးပြီး စွမ်းအင်ရစေပါတယ်။ သစ်သီးနဲ့ ဟင်းသီးဟင်းရွက်အလတ်တွေက သတ္တုဓာတ်၊ ဗီတာမင်နဲ့ အမျှင်ဓာတ် ပေးပါတယ်။ ပဲ၊ နို့ထွက်ပစ္စည်းနဲ့ အသား၊ ငါး၊ ဥလို တိရစ္ဆာန်ထွက်ပစ္စည်းတွေမှာ အသားဓာတ် ကြွယ်ဝပါတယ်။ ဟင်းရွက်ဆီ၊ ငါးနဲ့ တခြားပင်လယ်စာ၊ အခွံမာသီးနဲ့ အစေ့၊ ဥ၊ ဒိန်ချဉ်၊ နို့ စတာတွေက စွမ်းအင်ပေးတဲ့ အစားအစာတွေဖြစ်ပါတယ်။ (၁) ______",
  "ကျန်းမာရေးကောင်းဖို့ အစားအစာမျိုးစုံပါတဲ့ မျှတသော အစားအသောက်ကို စားဖို့ ဆရာဝန်တွေနဲ့ အာဟာရပညာရှင်တွေက အကြံပြုပါတယ်။ ဆိုလိုတာက သစ်သီး၊ ဟင်းသီးဟင်းရွက်နဲ့ ကောက်နှံ ပိုစားပြီး အဆီ၊ သကြားနဲ့ သွေးတွင်းအဆီဓာတ် တက်စေတဲ့ အစာတွေကို လျှော့စားဖို့ပါ။ အစာကို မျှတစွာ စားရင် (၂) ______။ မရှိမဖြစ်လိုတဲ့ အာဟာရဓာတ် မလုံလောက်တာက ကျန်းမာရေးမကောင်းရတဲ့ အဓိကအကြောင်းတစ်ခုပါ။ မျှတတဲ့ အစားအသောက်က ကိုယ်ခံအားကို ကောင်းစေပြီး ဖျားနာမှုကို ကာကွယ်ပေးနိုင်ပါတယ်။",
  "စာအုပ်အရ ကျန်းမာနေစေဖို့ အရေးကြီးတဲ့ အချက်တွေထဲမှာ ရောဂါကြိုတင်ကာကွယ်ရေးလည်း ပါပါတယ်။ အာဟာရပညာ တိုးတက်မှုတွေက ဗီတာမင် သို့မဟုတ် တခြား အာဟာရဖြည့်စွက်ပစ္စည်းတွေကို သုံးပြီး နာမကျန်းမှုကို ရင်ဆိုင်ဖို့ အကြံပြုထားတယ်လို့ ဖော်ပြပါတယ်။ အဓိက လိုအပ်တာက ပေါင်မုန့်ကိုယ်တိုင်ထက် ကစီဓာတ်၊ သစ်သီးနဲ့ ဟင်းသီးဟင်းရွက်ကိုယ်တိုင်ထက် ဗီတာမင်နဲ့ သတ္တုဓာတ်တွေ ဖြစ်ပါတယ်။ ဒါကြောင့် ကြိုတင်ကာကွယ်ရေးက ကျန်းမာရေးကို တစ်နည်းနည်းဖြင့် ကူညီတယ်လို့ ယူဆနိုင်ပါတယ်။",
  "တစ်ဖက်မှာ စက်ရုံပြုပြင်ထားတဲ့အစာ၊ သန့်စင်ပြုပြင်ထားတဲ့အစာနဲ့ သွေးတွင်းအဆီဓာတ်များစေတဲ့ အစာတချို့က မကောင်းပါဘူး။ ဆားရည်စိမ် အမဲသားနဲ့ စည်သွတ်အသား၊ ငါးလို ပြုပြင်ထားတဲ့အစာ အတော်များများကို စားဖို့ မသင့်ပါဘူး။ ဆိုဒီယမ်ဓာတ်များလို့ သွေးတိုးနဲ့ ဆက်နွှယ်ပါတယ်။ ထို့အပြင် ပြုပြင်ထားတဲ့အစာထဲက အရောင်နဲ့ အရသာတုတွေဟာ (၃) ______ ဓာတုပစ္စည်းတွေ ဖြစ်ပါတယ်။",
  "သန့်စင်ပြုပြင်ထားတဲ့အစာဆိုတာ မူလအာဟာရဓာတ်နဲ့ အမျှင်ဓာတ်တွေ ဖယ်ထုတ်ခံထားရတဲ့ အစာပါ။ ဥပမာ ဂျုံမှုန့်ဖြူ၊ ဆန်ဖြူ၊ စားပွဲတင်သကြားနဲ့ သစ်သီးသကြားဓာတ် အချိုးမြင့် ပြောင်းဖူးရည်တို့ ဖြစ်ပါတယ်။ ပြုပြင်ရင်း မရှိမဖြစ် အာဟာရဓာတ်တွေ ဆုံးရှုံးသွားလို့ ကျန်းမာရေးအတွက် မကောင်းပါဘူး။",
  "အကြော်၊ အဆီမထုတ်ထားတဲ့ နို့ထွက်ပစ္စည်းနဲ့ အနီရောင်အသားလို သွေးတွင်းအဆီဓာတ် တက်စေတဲ့ အစာတွေက နှလုံးရောဂါ ဖြစ်နိုင်ခြေ ပိုမြင့်တာနဲ့ ဆက်နွှယ်ပါတယ်။ ပြည့်ဝဆီပါလို့ ကျန်းမာရေးအတွက် မကောင်းပါဘူး။ ဒါကြောင့် ဆိုဒီယမ်၊ အဆီ၊ သကြားနဲ့ သွေးတွင်းအဆီဓာတ်များစေတဲ့ အစာတွေကို ရှောင်ဖို့ ဂရုစိုက်ရပါတယ်။",
  "အာဟာရဟာ ပတ်ဝန်းကျင်နဲ့ နီးကပ်စွာ ဆက်စပ်ပါတယ်။ နိုင်ငံ့အဖွဲ့အစည်းတွေနဲ့ ဒေသခံလူထုက ပတ်ဝန်းကျင်ကို မကာကွယ်နိုင်ရင် (၄) ______။ လူသားတွေ အစားအစာ မလုံခြုံမှုလည်း ကြုံရပါမယ်။ သစ်တောတွေက အကျိုးကျေးဇူးများစွာ ပေးပါတယ်။ ဇီဝမျိုးစုံမျိုးကွဲတွေ ခိုလှုံရာဖြစ်လို့ မှို၊ မျှစ်၊ အခွံမာသီး၊ ဘယ်ရီသီး၊ အရွက်နဲ့ ဥမြစ်တို့လို အစာတွေရဲ့ အကောင်းဆုံးရင်းမြစ် ဖြစ်ပါတယ်။ သစ်တောပြုန်းတီးရင် ဒေသခံအများအပြား ဇီဝမျိုးစုံမျိုးကွဲနဲ့ အာဟာရတွေ ဆုံးရှုံးရပါမယ်။",
  "ပတ်ဝန်းကျင်ပျက်စီးရတဲ့ အခြေခံအကြောင်းရင်းက ညစ်ညမ်းမှုပါ။ လေ၊ ရေနဲ့ မြေဆီ ညစ်ညမ်းစေတဲ့အရာတွေက အပင်၊ တိရစ္ဆာန်နဲ့ လူတွေကို ဆိုးကျိုး သက်ရောက်စေပါတယ်။ ပတ်ဝန်းကျင်ပျက်စီးမှုနဲ့ ဇီဝမျိုးစုံမျိုးကွဲ ဆုံးရှုံးမှုက စားသောက်ပုံ၊ အာဟာရတန်ဖိုးနဲ့ ကျန်းမာရေးကိုပါ ထိခိုက်ပါတယ်။ လတ်တလော အာဟာရသုတေသနတွေကြောင့် ပတ်ဝန်းကျင်ယိုယွင်းမှုက အာဟာရချို့တဲ့ခြင်း၊ ကူးစက်ရောဂါ စတဲ့ အာဟာရဆက်စပ် ကျန်းမာရေးပြဿနာတွေ ဖြစ်စေနိုင်တာ သိလာရပါတယ်။",
  "နိဂုံးချုပ်ရရင် စားသောက်ပုံနဲ့ အာဟာရက သက်ရှိအားလုံး အသက်ရှင်ရပ်တည်ဖို့ အခြေခံဖြစ်ပြီး ကျန်းမာရေးကောင်းဖို့ အဓိကကျပါတယ်။ ပတ်ဝန်းကျင်အခြေအနေနဲ့ ဆက်စပ်ပြီးလည်း စဉ်းစားရပါမယ်။ (၅) ______ အာဟာရပြည့်တဲ့ စားသောက်ပုံဟာ အစိုးရတွေရဲ့ ပတ်ဝန်းကျင်မူဝါဒအပေါ်လည်း မူတည်ပါတယ်။",
];
