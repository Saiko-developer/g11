import passages from "./unit2-passages.json";

export type TextbookItem = { text: string; answer?: string; choices?: readonly string[] };
export type TextbookExercise = { instruction: string; reference?: string; items: TextbookItem[] };

function items(
  texts: readonly string[],
  answers: readonly string[] = [],
  choices?: readonly string[],
): TextbookItem[] {
  return texts.map((text, index) => ({ text, answer: answers[index], choices }));
}
const trueFalse = ["True", "False"];
const synonyms = [
  "contentment",
  "wealthy",
  "outlook",
  "advantage",
  "feeling",
  "achieve",
  "jealous",
  "tiredness",
  "free and easy",
  "miserable",
];
const relativePhrases = [
  "opens the cupboard door",
  "Marlar sent to me",
  "can help me install the GPS application",
  "are paid a poor salary",
  "had saved their son from drowning",
  "interviewed me",
];

// Grade 12 textbook, printed pages 12–20. Answer values are suggested study answers.
export const unit2Reading = passages.reading;
export const unit2Exercises: Record<
  "reading" | "vocabulary" | "grammar" | "listening" | "speaking" | "writing",
  TextbookExercise[]
> = {
  reading: [
    {
      instruction: "Pre-reading",
      items: items([
        "When do you usually feel happy?",
        "What do you usually do if you are happy?",
        "What do you do if you are unhappy or if you are not in a good mood?",
      ]),
    },
    {
      instruction:
        "A. In pairs, find the bold-faced words in the passage that are similar in meaning to the following. There are two extra bold-faced words in the text.",
      items: items(
        [
          "causing a lot of anxiety and worry",
          "feeling of being sorry for someone who is in a bad situation",
          "feeling sad and disappointed especially because you have tried to achieve something but have failed",
          "feeling of happiness or satisfaction",
          "showing strong feelings of enthusiasm for something",
          "experience something, especially problems",
        ],
        ["stressful", "sympathy", "downhearted", "contentment", "passionate", "encounter"],
      ),
    },
    {
      instruction: "B. Complete each sentence with a suitable word from Exercise A.",
      items: items(
        [
          "We were disappointed by the results of the competition, but we were not ______.",
          "He has got many music albums in his room; he has a ______ interest in music.",
          "The mother had a ______ day with her naughty sons and this left her feeling exhausted.",
          "The sight of her son attending the graduation ceremony filled her with pride and ______.",
          "We felt ______ for the flood victims and so we donated food and money to them.",
          "He knew that he would ______ many unexpected difficulties in his work but he was determined not to give up easily.",
        ],
        ["downhearted", "passionate", "stressful", "contentment", "sympathy", "encounter"],
      ),
    },
    {
      instruction: "C. Give a full-sentence answer to each question below.",
      items: items([
        "How do you feel when you are in a peaceful state of mind?",
        "Which do you think is better – having a wide circle of friends and family or having a lot of money? Give your own reason(s).",
        "Which do you prefer – living with a large family or living on your own? Why?",
        "How do you feel after helping other people?",
        "What will happen to you if you are envious of someone?",
        "Explain how your mind and body are closely connected.",
        "How do you feel if you see a beautiful sunset while walking in a park?",
        "Do you agree with the statement “Money is the best way to find happiness”? Why or why not?",
        "What can improve your mood and make you more cheerful?",
        "What will happen to your body and mind when you practise meditation?",
      ]),
    },
  ],
  vocabulary: [
    {
      instruction: "A. In pairs, match the words in Column A with their synonyms in Column B.",
      items: items(
        [
          "accomplish",
          "relaxed",
          "satisfaction",
          "prosperous",
          "envious",
          "depressed",
          "attitude",
          "mood",
          "benefit",
          "fatigue",
        ],
        [
          "achieve",
          "free and easy",
          "contentment",
          "wealthy",
          "jealous",
          "miserable",
          "outlook",
          "feeling",
          "advantage",
          "tiredness",
        ],
        synonyms,
      ),
    },
    {
      instruction:
        "B. Fill each blank with an appropriate word from Column A in Exercise A. Change the word form if necessary.",
      items: items(
        [
          "A positive ______ is essential if you want to be successful in your career.",
          "After doing the household chores all morning, she was nearly dead with ______.",
          "Mission ______! We have done what we planned to do.",
          "“My son’s got high grades in the exam,” the man said to his friends with great ______.",
          "I hope that the decision we have made will be to the ______ of our project work.",
          "The students have been training hard for the whole month. They look ______ and confident before the match.",
          "She must have been ______ enough to live in such a grand house.",
          "The students were in a festive ______ after their team had won the championship.",
          "When I see people who have opportunities I don’t have, I sometimes get ______.",
          "He was very ______ and upset when he knew that he had lung cancer.",
        ],
        [
          "attitude",
          "fatigue",
          "accomplished",
          "satisfaction",
          "benefit",
          "relaxed",
          "prosperous",
          "mood",
          "envious",
          "depressed",
        ],
      ),
    },
    {
      instruction:
        "C. Rewrite the following sentences replacing the underlined words with the words given in the box.",
      reference: "constant · vital · cheerful · potential · crave · achieve",
      items: items(
        [
          "She felt homesick, but she attempted to appear **bright and happy**.",
          "When I travel by car, I usually keep up a **steady** speed of 50 mph.",
          "The teacher wants all her students to **accomplish** the assigned tasks.",
          "We need to take vitamins that are **essential** for good health.",
          "They have to identify **possible** problems before they start the project.",
          "Children always **long for** excitement when they go on a camping trip.",
        ],
        [
          "She felt homesick, but she attempted to appear cheerful.",
          "When I travel by car, I usually keep up a constant speed of 50 mph.",
          "The teacher wants all her students to achieve the assigned tasks.",
          "We need to take vitamins that are vital for good health.",
          "They have to identify potential problems before they start the project.",
          "Children always crave excitement when they go on a camping trip.",
        ],
      ),
    },
  ],
  grammar: [
    {
      instruction: "A. Fill each blank with an appropriate relative pronoun.",
      items: items(
        [
          "Have you returned the books ______ you borrowed from the library?",
          "She is one of the persons ______ have applied for a job as a receptionist.",
          "I haven’t replied to the e-mail ______ Zaw Zaw sent to me last week.",
          "My mother complained about the wrong goods ______ had been delivered to her.",
          "You should call the man ______ you will have to meet tomorrow.",
          "You must correct the mistakes ______ you have made in the essay.",
          "I like to see the manager ______ is in charge of the Marketing Department.",
          "A waiter is a person ______ job is to serve customers at their tables in a restaurant.",
          "People ______ are honest are always trusted.",
          "What is the name of the author ______ won the Myanmar National Literary Award in 2021?",
        ],
        [
          "which; that",
          "who; that",
          "which; that",
          "which; that",
          "whom; who; that",
          "which; that",
          "who; that",
          "whose",
          "who; that",
          "who; that",
        ],
      ),
    },
    {
      instruction:
        "B. Complete the sentences, using ‘who’ or ‘which’ and one of the appropriate items in the box.",
      reference: relativePhrases.join("\n"),
      items: items(
        [
          "The labourers ______ cannot live on it.",
          "The parents thanked the young man ______.",
          "I am looking for the key ______.",
          "I need to find someone ______.",
          "The person ______ asked some difficult questions.",
          "The letter ______ was very funny.",
        ],
        [
          "who are paid a poor salary",
          "who had saved their son from drowning",
          "which opens the cupboard door",
          "who can help me install the GPS application",
          "who interviewed me",
          "which Marlar sent to me",
        ],
      ),
    },
    {
      instruction:
        "C. Join the two sentences, using who, whose and that. Make changes where necessary.",
      reference:
        "I brought a dictionary. Nilar wanted it.\nI brought the dictionary that Nilar wanted.",
      items: items(
        [
          "Our principal wants to see an architect. He designed our school library.",
          "Win Win made a birthday cake. Nobody liked it.",
          "The woman spent the night at her friend’s house. Her flat was burgled.",
          "I met an old lady. She was one hundred and two years old.",
          "The factory closed down last week. It was built twenty years ago.",
          "The picture has been stolen. It is worth two million kyats.",
          "We found a shop. It sold old records.",
          "The police interrogated a man. His son had disappeared.",
        ],
        [
          "Our principal wants to see the architect who designed our school library.",
          "Win Win made a birthday cake that nobody liked.",
          "The woman whose flat was burgled spent the night at her friend’s house.",
          "I met an old lady who was one hundred and two years old.",
          "The factory that was built twenty years ago closed down last week.",
          "The picture that is worth two million kyats has been stolen.",
          "We found a shop that sold old records.",
          "The police interrogated a man whose son had disappeared.",
        ],
      ),
    },
    {
      instruction: "D. Join the two sentences, using who or which. Make changes where necessary.",
      reference:
        "We often visit Inya Lake. It is very good for walking exercise.\nWe often visit Inya Lake, which is very good for walking exercise.",
      items: items(
        [
          "U Aung Myint often shouts at his employees. He has a bad temper.",
          "We all climbed up the mountain except Mu Mu. She is afraid of heights.",
          "My new flat is on the ninth floor. It has a terrific view.",
          "My aunt is a bit deaf. She cannot hear the phone ringing.",
          "Nilar works in the advertising department. She is my close friend.",
          "The Nile runs through several countries. It is the longest river in the world.",
          "Polar bears live in the Arctic. They weigh up to 720 kilos.",
          "I want to introduce you to Daw Kathy. Her husband is a building contractor.",
        ],
        [
          "U Aung Myint, who has a bad temper, often shouts at his employees.",
          "We all climbed up the mountain except Mu Mu, who is afraid of heights.",
          "My new flat, which is on the ninth floor, has a terrific view.",
          "My aunt, who is a bit deaf, cannot hear the phone ringing.",
          "Nilar, who is my close friend, works in the advertising department.",
          "The Nile, which is the longest river in the world, runs through several countries.",
          "Polar bears, which live in the Arctic, weigh up to 720 kilos.",
          "I want to introduce you to Daw Kathy, whose husband is a building contractor.",
        ],
      ),
    },
  ],
  listening: [
    {
      instruction:
        "A. Listen to four students talking about what makes them happy. Then match the students (1–4) with the things (a–e) that make them happy. There is an extra.",
      items: items(
        ["Student 1", "Student 2", "Student 3", "Student 4"],
        [],
        [
          "spending time with friends",
          "going shopping",
          "playing sports",
          "spending time with family members",
          "having time off work",
        ],
      ),
    },
    {
      instruction:
        "B. Listen again and decide if each of the statements is True or False. Put a tick in the correct box.",
      items: items(
        [
          "Student 1 — He always plays football in the playground.",
          "Student 1 — His team never wins whenever they play.",
          "Student 2 — She likes to go out with friends and have a chat.",
          "Student 2 — She thinks eating out with friends is a way of reducing all the stress she has at school.",
          "Student 3 — He thinks that reading a good novel while drinking a cup of hot coffee makes him really satisfied.",
          "Student 3 — He often thinks about his work during weekends.",
          "Student 4 — She is disappointed when she cannot find the things she wants to buy.",
          "Student 4 — She always does the window shopping without buying anything.",
        ],
        [],
        trueFalse,
      ),
    },
  ],
  speaking: [
    {
      instruction:
        "C. In pairs, create a dialogue about what makes you happy, based on the following questions.",
      items: items([
        "When do you feel happiest?",
        "What things in your house make you happy?",
        "Are you happy right now? Why or why not?",
        "When did you last laugh a lot? Where were you at that time?",
      ]),
    },
    {
      instruction: "D. In pairs, practise the dialogue.",
      items: items(["Dialogue practice notes"]),
    },
  ],
  writing: [
    {
      instruction: "A. Say whether the following statements about ‘summary’ are True or False.",
      reference: "A summary:",
      items: items(
        [
          "is a short version of a longer text.",
          "does not have examples.",
          "includes extra information.",
          "contains all the key information from the original text.",
          "is sometimes longer than the original text.",
          "contains your opinions.",
          "expresses in a shorter or different way what someone has said or written.",
        ],
        ["True", "True", "False", "True", "False", "False", "True"],
        trueFalse,
      ),
    },
    {
      instruction: "B. Read the following text and underline the key points.",
      reference: passages.writing.join("\n\n"),
      items: items(["Key points"]),
    },
    {
      instruction: "C. Write a summary of the text (around 80 words) using the key points.",
      items: items(["Your summary"]),
    },
  ],
};

export const unit2References = {
  vocabulary: [
    "A synonym is one of two or more words in the same language which have the same or very nearly the same meaning.",
    "e.g. synonyms of ‘thin’ — slim, slender, skinny",
  ],
  grammar: [
    "A relative clause is used to modify or describe a noun or a pronoun. It starts with the following relative pronouns: who, whom, whose, which and that.",
    "a. A group of scientists who have examined a number of studies from across the world have suggested ten ways to achieve happiness.",
    "b. To reduce stress, many people practise meditation, which is also known as mindfulness.",
    "In sentence (a), the clause ‘who have examined a number of studies from across the world’ is a relative clause that identifies the subject ‘a group of scientists’.",
    "In sentence (b), the clause ‘which is also known as mindfulness’ adds extra information about the object ‘meditation’.",
    "Relative clauses are divided into two categories: defining and non-defining.",
    "A defining relative clause is used to identify a noun or a pronoun. Without the relative clause, the sentence would be incomplete.",
    "A defining relative clause does not have commas around it. e.g. The news that he told you is not true.",
    "A non-defining relative clause gives extra information about a noun or a pronoun. The sentence makes complete sense without the relative clause. So the relative clause could be omitted.",
    "A non-defining relative clause has commas around it. e.g. This movie, which I watched last night, has caught the attention of the media.",
    "Note: In non-defining clauses, we can use who, whom, whose and which. We do not use that.",
  ],
  writing: [
    "Read the text carefully two or three times until you have a clear idea of its general meaning.",
    "Note down the important points so that a summary can be written using these points.",
    "Illustrations, examples, repetitions and personal comments are not necessary.",
    "Use your own words. Do not copy from the text.",
  ],
} as const;

export const unit2VocabularyMy: Record<string, string> = {
  accomplish: "ပြီးမြောက်အောင် လုပ်ဆောင်သည်",
  relaxed: "စိတ်အေးလက်အေးဖြစ်သော",
  satisfaction: "ကျေနပ်မှု",
  prosperous: "ကြီးပွားချမ်းသာသော",
  envious: "မနာလိုသော",
  depressed: "စိတ်ဓာတ်ကျသော",
  attitude: "သဘောထား",
  mood: "စိတ်အခြေအနေ",
  benefit: "အကျိုးကျေးဇူး",
  fatigue: "ပင်ပန်းနွမ်းနယ်မှု",
};

export const unit2ReadingMy: Readonly<Partial<Record<number, string>>> = {
  0: "ပျော်ရွှင်မှုဆိုတာ ဘာလဲလို့ မေးလာရင် သင် ဘယ်လိုဖြေမလဲ။ ပြတ်သားတဲ့အဖြေတစ်ခု ထုတ်ဖို့ ခက်နိုင်ပါတယ်။ သင့်အဖြေက တခြားသူတွေရဲ့ အဖြေနဲ့ ကွာနိုင်ပါတယ်။ ပျော်ရွှင်မှုရဲ့ အဓိပ္ပာယ်ကလည်း အချိန်နဲ့အမျှ ပြောင်းလဲနိုင်ပါတယ်။ ဒီနေ့အမြင်နဲ့ မနက်ဖြန်အမြင် မတူနိုင်ပါဘူး။ ဒါကြောင့် ပုံသေမဟုတ်တဲ့ ပျော်ရွှင်မှုကို တိုင်းတာရခက်ပါတယ်။",
  1: "၂၀၁၆ ခုနှစ်ထုတ် မာရီယမ် ဝက်ဘ်စတာ အဘိဓာန်အရ ပျော်ရွှင်မှုဆိုတာ ကောင်းမွန်စွာ နေထိုင်နိုင်ပြီး ကျေနပ်ရောင့်ရဲနေတဲ့ အခြေအနေပါ။ စိတ်ပညာအရ စိတ်အေးချမ်းနေရင်၊ ဒါမှမဟုတ် စိတ်ဖိစီးစရာ တွေးစရာမရှိရင် သက်သောင့်သက်သာနဲ့ ပျော်ရွှင်ဖို့ ပိုများပါတယ်။ ကျောင်းသား၊ အလုပ်သမား၊ အိမ်ရှင်မ၊ အငြိမ်းစား ဘယ်သူပဲဖြစ်ဖြစ် ပျော်ရွှင်မှုက ပိုကောင်းတဲ့ ဘဝအရည်အသွေးကို ဆိုလိုပါတယ်။",
  2: "ကမ္ဘာတစ်ဝန်းက လေ့လာချက်အများအပြားကို ဆန်းစစ်ခဲ့တဲ့ သိပ္ပံပညာရှင်အဖွဲ့က ပျော်ရွှင်မှုရရှိဖို့ နည်းလမ်း ဆယ်ခု အကြံပြုထားပါတယ်။",
  4: "သူတစ်ပါးနဲ့ ကောင်းမွန်တဲ့ ဆက်ဆံရေးက လူတွေကို တကယ်ပျော်ရွှင်စေတယ်လို့ ယူဆဖို့ သင့်လျော်ပါတယ်။ မိသားစုနဲ့ သူငယ်ချင်း အသိုင်းအဝိုင်းကျယ်ပြန့်တာက ငွေအများကြီးရှိတာထက် ပိုပျော်စရာကောင်းပါတယ်။ မိသားစုကြီးပြီး ရင်းနှီးတဲ့သူငယ်ချင်းများသူတွေက တစ်ယောက်တည်းနေသူတွေထက် ပိုပျော်ကြပါတယ်။ တစ်ခါတလေ စိတ်မကြည်တာ၊ စိတ်ဓာတ်ကျတာ ရှိနိုင်ပါတယ်။ အဲဒီအချိန်မှာ သူငယ်ချင်းတွေနဲ့ တွေ့ဆုံတာ ဒါမှမဟုတ် မိသားစုနဲ့ အချိန်ဖြုန်းတာက စိတ်ဖိစီးမှုကို ပြေလျော့စေပါတယ်။ ပျော်ရွှင်တဲ့ မိသားစုဘဝနဲ့ မိတ်ဆွေကောင်းတွေက နာမကျန်းမှုကိုတောင် ကာကွယ်ပေးနိုင်တယ်လို့ အကြံပြုထားပါတယ်။",
  6: "တချို့လူတွေက အလုပ်အပေါ် စိတ်အားထက်သန်ပြီး ကိုယ်လုပ်နေတဲ့အရာကို ချစ်မြတ်နိုးကြပါတယ်။ အလုပ်မှာ စိတ်ကျေနပ်မှုနဲ့ အသက်မွေးဝမ်းကျောင်း အောင်မြင်မှုဟာ ပျော်ရွှင်မှုအတွက် အရေးကြီးပါတယ်။ ဥပမာ ကိုယ်တာဝန်ယူထားတဲ့ အလုပ်တွေကို ပြီးမြောက်နိုင်တဲ့အခါ သို့မဟုတ် ကိုယ်နှစ်သက်တဲ့အလုပ်ကို လုပ်ရင်း ကြီးပွားလာတဲ့အခါ ပျော်ရွှင်မှုရတတ်ပါတယ်။",
  8: "လူတိုင်းကို ကြင်နာစွာ ဆက်ဆံခြင်းက ပျော်ရွှင်မှုရဲ့ တခြားအဓိကအချက်တစ်ခုပါ။ ကြင်နာတဲ့ လုပ်ရပ်တွေက ကမ္ဘာကြီးကို ပိုပျော်ရွှင်စေနိုင်ပါတယ်။ နိုင်ငံအသီးသီးက စိတ်ပညာရှင်တွေရဲ့ လေ့လာချက်တွေအရ သူတစ်ပါးကို ကူညီတာက သူတို့အတွက် ကောင်းသလို သင့်ကိုယ်တိုင်လည်း ပိုပျော်စေပါတယ်။ စစ်တမ်းသစ်တစ်ခုအရ ရက်ရောသူတွေက ရက်ရောမှုမရှိသူတွေထက် ပိုပျော်ရွှင်ပြီး ပိုကျန်းမာပါတယ်။ လူတွေက ကျေးဇူးတင်စကားပြောပြီး တန်ဖိုးထားကြောင်း ပြတဲ့အခါ ရက်ရောသူတွေ စိတ်ထဲ နွေးထွေးကြည်နူးလာပါတယ်။",
  10: "ပျော်ရွှင်မှုကို အကြီးဆုံး တားဆီးတာက မနာလိုစိတ်ပါ။ ဒါဟာ သူတစ်ပါးရဲ့ အရည်အချင်း၊ ပိုင်ဆိုင်မှု၊ အခွင့်အလမ်းတွေကို ကိုယ်ရချင်တဲ့စိတ်ပါ။ ကျောင်းနဲ့ အလုပ်မှာ ကိုယ့်ထက် ပိုကောင်းနေသူတွေကို တွေ့ရပါမယ်။ အဲဒီအခါ ကိုယ့်ကိုယ်ကို သူများနဲ့ မနှိုင်းယှဉ်ဖို့ ကြိုးစားရင် ပိုပျော်လာပါမယ်။ မနာလိုသူတွေက ကိုယ့်ကိုယ်ကို နိမ့်ကျတယ်လို့ ခံစားရတာ၊ စိတ်ပျက်အားလျော့တာနဲ့ စိတ်ဓာတ်ကျတာတို့ ပိုကြုံတတ်ပါတယ်။ အကောင်းဆုံးက မနာလိုစိတ်နေရာမှာ စာနာစိတ် သို့မဟုတ် သူတစ်ပါးရဲ့ ပျော်ရွှင်မှုကို အတူဝမ်းမြောက်တဲ့စိတ် ထားဖို့ပါ။",
  12: "ကျန်းမာရေးကောင်းခြင်းကလည်း ပျော်ရွှင်မှုအတွက် အရေးပါပါတယ်။ ကျန်းမာသူတွေက မကျန်းမာသူတွေထက် ပိုပျော်တာကို ငြင်းလို့မရပါဘူး။ တကယ့်ပျော်ရွှင်မှုအတွက် ကိုယ်ရော စိတ်ပါ ကျန်းမာသန်စွမ်းဖို့ လိုပါတယ်။ ပျော်ရွှင်သူတွေရဲ့ ကိုယ်နဲ့စိတ် ကျန်းမာရေး ပိုကောင်းတတ်ပါတယ်။ စိတ်နဲ့ကိုယ်က နီးကပ်စွာ ဆက်စပ်နေပါတယ်။ စိတ်ဖိစီးရင် မောပန်းပြီး ကြွက်သားတွေ တင်းကျပ်တတ်ပါတယ်။ စိတ်ပျော်ရွှင်အေးချမ်းရင်တော့ စိတ်ခွန်အားနဲ့ ကိုယ်ခွန်အား ပိုတိုးလာတတ်ပါတယ်။",
  14: "ရောင့်ရဲကျေနပ်ခြင်းက ပျော်ရွှင်မှုရဲ့ သော့ချက်ပါ။ ကိုယ်ရှိတာကို လက်ခံသူတွေက အလုပ်အကိုင်အောင်မြင်မှုနဲ့ ငွေ ပိုများများ လိုချင်နေသူတွေထက် ပိုပျော်ပါတယ်။ ဘဝရဲ့ ရိုးရှင်းဆုံးအရာတွေက အရေးအကြီးဆုံးလို့ မကြာသေးခင် စစ်တမ်းတစ်ခုက ပြပါတယ်။ ပန်းခြံမှာ လမ်းလျှောက်တာ၊ လှပတဲ့ နေဝင်ချိန်ကြည့်တာ၊ သူငယ်ချင်းနဲ့ ညနေခင်းအတူရှိတာတို့လို ရိုးရှင်းတဲ့အရာတွေက ပျော်ရွှင်စေတတ်ပါတယ်။ သင့်တော်တဲ့ ပစ္စည်းဥစ္စာပိုင်ဆိုင်မှု လိုအပ်တာမှန်ပေမဲ့ လိုအပ်တာထက် ပိုလိုချင်ရင် လောဘနဲ့ စိတ်ပျက်မှု ဖြစ်လာပါတယ်။",
  16: "လူအများစုက ငွေဟာ ပျော်ရွှင်မှုရှာဖို့ အကောင်းဆုံးနည်းလို့ ယုံကြည်ပါတယ်။ သက်သောင့်သက်သာ နေထိုင်ဖို့ ငွေ အတိုင်းအတာတစ်ခုအထိ လိုပါတယ်။ ချမ်းသာသူတွေက ဈေးကြီးတဲ့အိမ်၊ ကားအသစ်၊ ရွက်လှေကြီးနဲ့ နာမည်ကြီးဒီဇိုင်နာဝတ်စုံတွေ ဝယ်နိုင်လို့ ပျော်ရွှင်တယ်လို့ ယူဆတတ်ပါတယ်။ တချို့လူတွေကတော့ ပျော်ရွှင်မှုဟာ ငွေအပေါ် မမူတည်ဘူးလို့ ထင်ပါတယ်။ ဒါပေမဲ့ ဘဝမှာ ပျော်ရွှင်မှုရဖို့ မျှော်လင့်ပြီး နည်းမျိုးစုံနဲ့ ချမ်းသာအောင် ကြိုးစားနေသူတွေ အများကြီးရှိပါတယ်။",
  18: "ဘဝမှာ ကောင်းတဲ့အပိုင်းနဲ့ ဆိုးတဲ့အပိုင်းတွေ ပါဝင်တယ်လို့ ဆိုလေ့ရှိပါတယ်။ ဘဝကို အကောင်းမြင်တာက ပျော်ရွှင်မှုရှာဖို့ နည်းကောင်းတစ်ခုပါ။ ကျောင်း ဒါမှမဟုတ် အလုပ်မှာ အခက်အခဲကြုံရင် စိတ်ပျက်အားလျော့နိုင်ပါတယ်။ အဲဒီအခါ ပြဿနာကို ရင်ဆိုင်ဖို့ အကောင်းမြင်စိတ် မွေးပါ။ ဆိုးတာ ဘာမှမဖြစ်တဲ့ဘဝကို ရှာမယ့်အစား ဘဝရဲ့ ဆိုးတဲ့အပိုင်းတွေနဲ့အတူ ရောင့်ရဲစွာ နေတတ်ဖို့ သင်ယူပါ။ ကြုံလာသမျှကို အကောင်းဘက်က တုံ့ပြန်ရင် ပျော်ရွှင်မှုကို တွေ့နိုင်ပါတယ်။",
  20: "တစ်ခါတလေ မကောင်းတဲ့အရာတွေကိုပဲ ပြန်တွေးနေလို့ စိတ်မကြည်တာ၊ စိတ်ပျက်တာ ဖြစ်နိုင်ပါတယ်။ အတိတ်က ကြည်နူးစရာဖြစ်ရပ်တွေကို ပြန်သတိရတာက စိတ်အခြေအနေ ပိုကောင်းပြီး ပိုရွှင်လန်းစေတယ်လို့ စိတ်ပညာရှင်အဖွဲ့က တွေ့ရှိပါတယ်။ ဥပမာ ကလေးဘဝက အပျော်ဆုံးအရာတစ်ခုကို တွေးပါ၊ ပျော်စရာဖြစ်ရပ်တွေရဲ့ ဓာတ်ပုံဟောင်းတွေကို ကြည့်ပါ၊ ဒါမှမဟုတ် တစ်ယောက်ယောက်ရဲ့ သတင်းကောင်းကို ကြားခဲ့တာ ပြန်သတိရပါ။ ဒီမှတ်ဉာဏ်တွေက စိတ်အခြေအနေကောင်းစေပြီး ပြုံးရယ်စေ၊ ကြည်နူးစေနိုင်ပါတယ်။",
  22: "ယနေ့ခေတ်မှာ အလုပ်နဲ့ဆက်စပ်တဲ့ စိတ်ဖိစီးမှုခံစားရနိုင်ပြီး ဆီးချိုနဲ့ နှလုံးရောဂါလို ပြင်းထန်တဲ့ ရောဂါတွေ ဖြစ်စေနိုင်ပါတယ်။ စိတ်ဖိစီးမှုလျှော့ဖို့ သတိကပ်ရှုမှတ်ခြင်းလို့လည်း ခေါ်တဲ့ တရားထိုင်ခြင်းကို လေ့ကျင့်ကြပါတယ်။ သန့်ရှင်းတဲ့ ကြမ်းပြင်မှာ ငြိမ်ငြိမ်ထိုင်ပြီး လက်ရှိအခိုက်အတန့်မှာ ကိုယ့်မှာ ဖြစ်ပျက်နေတာကို အာရုံစိုက်ပါ။ အတိတ်နဲ့ အနာဂတ်အကြောင်း မတွေးဘဲ လက်ရှိကိုသာ သတိထားပါ။ တရားထိုင်ခြင်းက ကိုယ်ခန္ဓာတင်းကျပ်မှု ပြေလျော့စေ၊ စိတ်ထဲက အဆိုးမြင်အတွေးတွေကို ရှင်းစေပြီး အတွင်းစိတ်အေးချမ်းမှု ပေးနိုင်ပါတယ်။",
  23: "လူတိုင်း ပျော်ရွှင်ရွှင်လန်းချင်ပေမဲ့ ပျော်ရွှင်မှုရသူ မများလှပါဘူး။ အထက်က နည်းလမ်းဆယ်ခုက ပျော်ရွှင်မှုကို အလွန်လိုလားနေသူတွေအတွက် အကျိုးရှိပါလိမ့်မယ်။ ပြန်ဖတ်ပြီး ကိုယ့်လိုအပ်ချက်နဲ့ ကိုက်ညီတဲ့နည်းကို ရွေးကျင့်ပါ။",
};

export const unit2SpeakingLines = unit2Exercises.speaking[0].items.map(({ text }, index) => ({
  id: `g12-u2-speaking-${index + 1}`,
  en: text,
  my: [
    "ဘယ်အချိန်မှာ အပျော်ဆုံးလဲ။",
    "အိမ်ထဲက ဘယ်အရာတွေက သင့်ကို ပျော်ရွှင်စေလဲ။",
    "အခု ပျော်နေသလား။ ဘာကြောင့်လဲ။",
    "နောက်ဆုံး အများကြီးရယ်ခဲ့တာ ဘယ်အချိန်လဲ။ အဲဒီအချိန်မှာ ဘယ်မှာရှိခဲ့သလဲ။",
  ][index],
  page: 19,
}));

export const unit2ReadingQuestionsMy = [
  [
    "သင် ပုံမှန်အားဖြင့် ဘယ်အချိန်မှာ ပျော်ရွှင်တတ်သလဲ။",
    "ပျော်တဲ့အခါ သင် ဘာလုပ်လေ့ရှိသလဲ။",
    "မပျော်တဲ့အခါ ဒါမှမဟုတ် စိတ်မကြည်တဲ့အခါ ဘာလုပ်သလဲ။",
  ],
  [
    "စိုးရိမ်ပူပန်မှု အများကြီး ဖြစ်စေသော",
    "အခြေအနေဆိုး ကြုံနေသူတစ်ယောက်ကို စိတ်မကောင်းဖြစ်ပေးသည့် ခံစားချက်",
    "အထူးသဖြင့် တစ်ခုခုအောင်မြင်ဖို့ ကြိုးစားပြီး မအောင်မြင်လို့ ဝမ်းနည်းစိတ်ပျက်သော",
    "ပျော်ရွှင်မှု သို့မဟုတ် ကျေနပ်မှု ခံစားချက်",
    "တစ်စုံတစ်ရာအပေါ် ပြင်းပြတဲ့ စိတ်အားထက်သန်မှုကို ပြသသော",
    "တစ်စုံတစ်ရာ၊ အထူးသဖြင့် ပြဿနာများကို ကြုံတွေ့သည်",
  ],
  [
    "ပြိုင်ပွဲရလဒ်ကို စိတ်ပျက်မိပေမဲ့ ကျွန်တော်တို့ ______ မဖြစ်ခဲ့ပါ။",
    "သူ့အခန်းထဲမှာ တေးသီချင်းခွေ အများကြီးရှိတယ်။ ဂီတကို ______ စိတ်ဝင်စားတယ်။",
    "အမေဟာ ဆိုးတဲ့သားတွေနဲ့ ______ နေ့တစ်နေ့ ကြုံခဲ့လို့ မောပန်းနွမ်းနယ်သွားတယ်။",
    "သား ဘွဲ့နှင်းသဘင် တက်တာမြင်တော့ သူမ ဂုဏ်ယူပြီး ______ ခံစားရတယ်။",
    "ရေဘေးသင့်သူတွေကို ______ ခံစားမိလို့ အစားအသောက်နဲ့ ငွေ လှူခဲ့ပါတယ်။",
    "အလုပ်မှာ မမျှော်လင့်ထားတဲ့ အခက်အခဲအများကြီး ______ မယ်ဆိုတာ သူသိပေမဲ့ လွယ်လွယ်နဲ့ လက်မလျှော့ဖို့ ဆုံးဖြတ်ထားတယ်။",
  ],
  [
    "စိတ်အေးချမ်းနေတဲ့အခါ ဘယ်လို ခံစားရသလဲ။",
    "မိသားစုနဲ့ မိတ်ဆွေအသိုင်းအဝိုင်း ကျယ်ပြန့်တာနဲ့ ငွေအများကြီးရှိတာ ဘယ်ဟာ ပိုကောင်းတယ်လို့ ထင်သလဲ။ ကိုယ့်အကြောင်းပြချက် ပေးပါ။",
    "မိသားစုကြီးနဲ့ နေတာနဲ့ တစ်ယောက်တည်း နေတာ ဘယ်ဟာ ပိုနှစ်သက်သလဲ။ ဘာကြောင့်လဲ။",
    "သူတစ်ပါးကို ကူညီပြီးတဲ့အခါ ဘယ်လို ခံစားရသလဲ။",
    "တစ်ယောက်ယောက်ကို မနာလိုရင် သင့်မှာ ဘာဖြစ်လာမလဲ။",
    "စိတ်နဲ့ ကိုယ်ခန္ဓာ ဘယ်လို နီးနီးကပ်ကပ် ဆက်စပ်နေသလဲ ရှင်းပြပါ။",
    "ပန်းခြံမှာ လမ်းလျှောက်ရင်း လှပတဲ့ နေဝင်ချိန်ကို မြင်ရင် ဘယ်လို ခံစားရမလဲ။",
    "ငွေက ပျော်ရွှင်မှုရှာဖို့ အကောင်းဆုံးနည်းဆိုတဲ့ အဆိုကို သဘောတူသလား။ ဘာကြောင့်လဲ။",
    "ဘယ်အရာက သင့်စိတ်အခြေအနေကို ပိုကောင်းစေပြီး ပိုရွှင်လန်းစေနိုင်သလဲ။",
    "တရားထိုင်တဲ့အခါ သင့်ကိုယ်နဲ့ စိတ်မှာ ဘာတွေ ဖြစ်လာမလဲ။",
  ],
];

export const unit2ComprehensionSamples = [
  "I feel relaxed and happy when I am in a peaceful state of mind.",
  "I think having a wide circle of friends and family is better because they can support me when I feel down.",
  "I prefer living with a large family because I enjoy spending time with them.",
  "I feel happier after helping other people.",
  "If I am envious of someone, I am more likely to feel inferior, dejected or depressed.",
  "When I feel stressed, I may experience fatigue and muscle tension. When I feel happy and calm, I may have more mental energy and physical vitality.",
  "I feel peaceful and happy when I see a beautiful sunset while walking in a park.",
  "I disagree because having money can make life comfortable, but simple pleasures and close relationships can also bring happiness.",
  "Thinking back to pleasant incidents can improve my mood and make me more cheerful.",
  "Meditation can ease the tension in my body, clear negative thoughts and give me a sense of inner peace and well-being.",
];
