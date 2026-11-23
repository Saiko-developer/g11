import type { BilingualText, SupplementItem } from "./reviews";

type PoemTable = {
  instructions: BilingualText;
  headings?: readonly BilingualText[];
  rows: readonly (readonly [SupplementItem, SupplementItem])[];
};

type Poem = {
  author: BilingualText;
  titleMy: string;
  stanzas?: readonly BilingualText[];
  overview?: BilingualText;
  glossary?: readonly (readonly [term: string, ...BilingualText])[];
  preReading: readonly BilingualText[];
  illustration?: BilingualText;
  questions: readonly SupplementItem[];
  table?: PoemTable;
  writing: BilingualText;
  example?: BilingualText;
  points?: readonly BilingualText[];
  writingCount?: number;
};

export const textbookPoems: readonly Poem[] = [
  {
    author: ["Barbara A. Huff", "ဘာဘရာ အေ ဟပ်ဖ်"],
    titleMy: "စာကြည့်တိုက်",
    overview: [
      "Read the poem on textbook page 33. The speaker shows how reading turns an ordinary-looking library into a place where readers can travel, learn and imagine adventures.",
      "ကျောင်းသုံးစာအုပ် စာမျက်နှာ ၃၃ တွင် ကဗျာကို ဖတ်ပါ။ စာဖတ်ခြင်းက သာမန်အဆောက်အအုံတစ်ခုလို မြင်ရသော စာကြည့်တိုက်ကို ခရီးသွားနိုင်ရာ၊ သင်ယူနိုင်ရာနှင့် စွန့်စားခန်းများ စိတ်ကူးယဉ်နိုင်ရာ နေရာအဖြစ် ပြောင်းလဲပေးပုံကို ကဗျာက ဖော်ပြထားသည်။",
    ],
    glossary: [
      [
        "dune (n)",
        "A mound or hill of sand formed by the wind.",
        "လေတိုက်ရာမှ ဖြစ်ပေါ်လာသော သဲကုန်း",
      ],
      ["whopping (adj)", "Exceptionally large.", "အလွန် ကြီးမားသော"],
      [
        "pike (n)",
        "A large freshwater fish with sharp teeth.",
        "သွားထက်သော ရေချိုငါးကြီး တစ်မျိုး",
      ],
      ["calls (v)", "Invites or beckons.", "ဖိတ်ခေါ်သည်"],
      ["wonderment (n)", "A feeling of amazement and delight.", "အံ့ဩဝမ်းမြောက်မှု"],
    ],
    preReading: [
      ["Do you enjoy reading in a library?", "စာကြည့်တိုက်ထဲမှာ စာဖတ်ရတာ ကြိုက်သလား။"],
      [
        "Do you visit the library on your own or with friends?",
        "စာကြည့်တိုက်ကို တစ်ယောက်တည်း သွားသလား၊ သူငယ်ချင်းတွေနဲ့ သွားသလား။",
      ],
      ["How often do you visit it?", "ဘယ်နှကြိမ်လောက် သွားလေ့ရှိသလဲ။"],
      ["What kinds of books would you like to read?", "ဘယ်လိုစာအုပ်မျိုးတွေ ဖတ်ချင်သလဲ။"],
    ],
    questions: [
      [
        "What is the poem mainly about?",
        "ကဗျာ၏ အဓိကအကြောင်းက ဘာလဲ။",
        "It is about the adventures and discoveries that reading in a library makes possible.",
      ],
      [
        "What materials is the library building made from?",
        "စာကြည့်တိုက် အဆောက်အအုံကို ဘာပစ္စည်းတွေနဲ့ ဆောက်ထားသလဲ။",
        "It is made of stone, glass, marble, iron and concrete.",
      ],
      [
        "Name two activities you can imagine doing through books in a library.",
        "စာကြည့်တိုက်ရှိ စာအုပ်တွေကတစ်ဆင့် ကိုယ်တိုင် လုပ်နေသလို စိတ်ကူးနိုင်တဲ့ အရာနှစ်ခုကို ပြောပါ။",
        "You can imagine riding a camel and learning to bake a pie.",
      ],
      [
        "What places could a reader visit in the poet’s imagined world?",
        "ကဗျာဆရာမ ဖန်တီးထားသော စိတ်ကူးကမ္ဘာထဲမှာ ဘယ်နေရာတွေကို သွားနိုင်သလဲ။",
        "A reader can imagine visiting Rome, Siam and Nome.",
      ],
      [
        "Which fish could a reader imagine catching?",
        "ဘယ်ငါးမျိုးကို ဖမ်းနေသလို စိတ်ကူးနိုင်သလဲ။",
        "A reader could imagine catching an enormous pike.",
      ],
      [
        "What dogs could the speaker have in her imagined world?",
        "စိတ်ကူးကမ္ဘာမှာ ကဗျာပြောသူက ဘယ်လိုခွေးတွေ မွေးနိုင်သလဲ။",
        "She could have any dogs she likes.",
      ],
      [
        "How often does ‘wonderment’ appear, and what does the repetition emphasize?",
        "‘အံ့ဩဝမ်းမြောက်မှု’ ဟူသော စကားလုံး ဘယ်နှခါပါသလဲ။ ထပ်သုံးခြင်းက ဘာကို အလေးပေးသလဲ။",
        "It appears twice, emphasizing the delight and amazement books can offer.",
      ],
      [
        "What message about reading does the poet convey?",
        "စာဖတ်ခြင်းအကြောင်း ကဗျာဆရာမက ဘာသတင်းစကား ပေးချင်သလဲ။",
        "Books can open up a world of experiences beyond the walls of an ordinary library.",
      ],
    ],
    table: {
      instructions: [
        "Complete the phrases about activities a reader can discover through books.",
        "စာအုပ်တွေကတစ်ဆင့် လေ့လာနိုင်တဲ့ လုပ်ဆောင်ချက်တွေကို ဖော်ပြသော စကားစုများကို ဖြည့်ပါ။",
      ],
      rows: [
        [
          ["ride", "စီးသည်"],
          ["a camel / a train", "ကုလားအုတ်တစ်ကောင် / ရထားတစ်စင်း"],
        ],
        [
          ["(a) _____", "(က) _____", "sing"],
          ["songs", "သီချင်းများ"],
        ],
        [
          ["bake", "မုန့်ဖုတ်သည်"],
          ["(b) _____", "(ခ) _____", "a pie"],
        ],
        [
          ["(c) _____", "(ဂ) _____", "plant"],
          ["a tree", "သစ်ပင်တစ်ပင်"],
        ],
        [
          ["train", "လေ့ကျင့်ပေးသည်"],
          ["(d) _____", "(ဃ) _____", "a horse"],
        ],
        [
          ["catch", "ဖမ်းသည်"],
          ["(e) _____", "(င) _____", "a whopping pike;a pike"],
        ],
      ],
    },
    writing: [
      "List five more things to do in a library beyond the activities mentioned in the poem.",
      "ကဗျာထဲမှာ ဖော်ပြထားသည့် အရာများအပြင် စာကြည့်တိုက်မှာ လုပ်နိုင်သည့် နောက်ထပ် အရာငါးခုကို ရေးပါ။",
    ],
    example: [
      "For example, you could make friends at the library.",
      "ဥပမာ စာကြည့်တိုက်မှာ မိတ်ဆွေဖွဲ့နိုင်သည်။",
    ],
    writingCount: 5,
  },
  {
    author: ["Alexander Pope", "အလက်ဇန်းဒါး ပုပ်"],
    titleMy: "အေးချမ်းသောဘဝ",
    stanzas: [
      [
        `Happy the man, whose wish and care
A few paternal acres bound,
Content to breathe his native air,
In his own ground`,
        `ဖခင်ထံမှ အမွေရသော လယ်မြေအနည်းငယ်နှင့်
လိုအင်ဆန္ဒတွေ ပြည့်စုံနေသူ ပျော်ရွှင်ပေ၏။
ကိုယ့်မြေ၊ ကိုယ့်ရပ်ရွာမှာ
မွေးရပ်လေကို ရှူနေရရုံနှင့် ကျေနပ်သည်။`,
      ],
      [
        `Whose herds with milk, whose fields with bread,
Whose flocks supply him with attire;
Whose trees in summer yield him shade,
In winter fire`,
        `နွားအုပ်က နို့၊ လယ်မြေက ပေါင်မုန့်၊
သိုးအုပ်က ဝတ်စရာ ပေး၏။
သူ့သစ်ပင်တွေက နွေမှာ အရိပ်၊
ဆောင်းမှာ မီးဖိုဖို့ ထင်း ပေး၏။`,
      ],
      [
        `Blest, who can unconcern’dly find
Hours, days, and years slide soft away
In health of body, peace of mind,
Quiet by day,`,
        `ပူပန်မှုကင်းကင်း ဖြတ်သန်းနိုင်သူ မင်္ဂလာရှိ၏။
နာရီတွေ၊ နေ့ရက်တွေ၊ နှစ်တွေ တဖြည်းဖြည်း ကုန်လွန်သွား၏။
ကိုယ်ကျန်းမာ၍ စိတ်အေးချမ်းလျက်
နေ့ခင်းကို ငြိမ်သက်စွာ ဖြတ်သန်း၏။`,
      ],
      [
        `Sound sleep by night; study and ease,
Together mix’d; sweet recreation,
And innocence, which most does please
With meditation.`,
        `ညမှာ နှစ်ခြိုက်စွာ အိပ်ပျော်၏။
လေ့လာချိန်၊ အနားယူချိန်နှင့် ပျော်စရာ အပန်းဖြေမှုတို့ မျှတ၏။
အပြစ်ကင်းသော စိတ်ဖြင့် ဆင်ခြင်တွေးတောခြင်းက
အနှစ်သက်ဆုံး ပျော်ရွှင်မှုကို ပေး၏။`,
      ],
      [
        `Thus let me live, unseen, unknown;
Thus unlamented let me die;
Steal from the world, and not a stone
Tell where I lie.`,
        `ဤသို့ လူမသိ၊ သူမမြင်ဘဲ နေပါရစေ။
ဘယ်သူမျှ ဝမ်းမနည်းဘဲ ကွယ်လွန်ပါရစေ။
ကမ္ဘာလောကမှ တိတ်တဆိတ် ထွက်ခွာပြီး
ကျွန်ုပ် အိပ်စက်ရာကို အုတ်ဂူကျောက်တိုင်ပင် မညွှန်ပြပါစေနှင့်။`,
      ],
    ],
    glossary: [
      ["paternal (adj)", "related through the father", "ဖခင်ဘက်မှ ဆက်နွှယ်သော"],
      ["bound (verb)", "made secure by tying", "ချည်နှောင်၍ ခိုင်မြဲစေသည်"],
      ["attire (noun)", "clothes", "အဝတ်အစား"],
      ["unconcern’dly (adv)", "without any worry", "စိုးရိမ်ပူပန်မှု မရှိဘဲ"],
      [
        "recreation (noun)",
        "activity done for enjoyment",
        "ပျော်ရွှင်ရန် လုပ်သော အပန်းဖြေလှုပ်ရှားမှု",
      ],
      ["meditation (noun)", "engaging in contemplation or reflection", "ဆင်ခြင်တွေးတောခြင်း"],
      [
        "unlamented (adj)",
        "not mourned or regretted",
        "ဝမ်းနည်းပူဆွေးခြင်း၊ နှမြောတသခြင်း မခံရသော",
      ],
    ],
    preReading: [
      ["What is your opinion of a quiet life?", "အေးချမ်းသော ဘဝတစ်ခုအပေါ် သင့်အမြင်က ဘာလဲ။"],
      [
        "Which is quieter and more peaceful — living in a city or in the countryside? Why?",
        "မြို့မှာ နေထိုင်တာနဲ့ ကျေးလက်မှာ နေထိုင်တာ ဘယ်ဟာ ပိုငြိမ်သက်အေးချမ်းသလဲ။ ဘာကြောင့်လဲ။",
      ],
      [
        "What kind of people can enjoy peace of mind?",
        "ဘယ်လိုလူမျိုးက စိတ်အေးချမ်းမှုကို ခံစားနိုင်သလဲ။",
      ],
    ],
    questions: [
      [
        "What did the happy man possess in the first stanza?",
        "ပထမအပိုဒ်မှာ ပျော်ရွှင်သောသူက ဘာပိုင်ဆိုင်ခဲ့သလဲ။",
        "He possessed a few acres of land inherited from his father.",
      ],
      [
        "What things did the happy man get from his small piece of land?",
        "သူ့မြေကွက်ငယ်လေးကနေ ဘာတွေ ရခဲ့သလဲ။",
        "He got milk from his herds, bread from his fields, clothes from his flocks, and shade and firewood from his trees.",
      ],
      [
        "Who can enjoy good health and find inner peace?",
        "ဘယ်သူက ကျန်းမာစွာ နေနိုင်ပြီး စိတ်အေးချမ်းမှု ရနိုင်သလဲ။",
        "A person who is content with a simple life can enjoy good health and inner peace.",
      ],
      [
        "Why was the man able to get a sound sleep?",
        "သူ ဘာကြောင့် နှစ်နှစ်ခြိုက်ခြိုက် အိပ်ပျော်နိုင်ခဲ့သလဲ။",
        "He was able to sleep soundly because he was content and free from worry.",
      ],
      [
        "What kind of life did the man wish to live?",
        "သူက ဘယ်လိုဘဝမျိုး နေထိုင်ချင်သလဲ။",
        "He wished to live a quiet, simple life away from public attention.",
      ],
    ],
    table: {
      instructions: [
        "Complete the table. The first one is done for you as an example.",
        "ဇယားကို ဖြည့်ပါ။ ပထမတစ်ခုကို နမူနာအဖြစ် ဖြည့်ပေးထားသည်။",
      ],
      headings: [
        ["Possessions", "ပိုင်ဆိုင်သည့်အရာများ"],
        ["What they provide", "သူတို့ ပေးသည့်အရာများ"],
      ],
      rows: [
        [
          ["herds", "နွားအုပ်များ"],
          ["milk", "နို့"],
        ],
        [
          ["_____", "_____", "fields"],
          ["bread", "ပေါင်မုန့်"],
        ],
        [
          ["flocks", "သိုးအုပ်များ"],
          ["_____", "_____", "attire;clothes"],
        ],
        [
          ["_____", "_____", "trees"],
          ["shade and firewood", "အရိပ်နှင့် ထင်း"],
        ],
      ],
    },
    writing: [
      "Write a four-line verse with the rhyme scheme ABAB as given in the example below.",
      "အောက်ပါ နမူနာအတိုင်း ပထမစာကြောင်းနှင့် တတိယစာကြောင်း၊ ဒုတိယစာကြောင်းနှင့် စတုတ္ထစာကြောင်း ကာရန်ညီသော လေးကြောင်းကဗျာ ရေးပါ။",
    ],
    example: [
      `Let me study all for myself;
Undisturbed, let me work all alone;
Unknown, unheard let me learn all for myself;
Let not a soul know where I groan.`,
      `ကိုယ်တိုင် စာလေ့လာပါရစေ။
အနှောင့်အယှက်မရှိ တစ်ယောက်တည်း အလုပ်လုပ်ပါရစေ။
လူမသိ၊ အသံမကြားဘဲ ကိုယ်တိုင် သင်ယူပါရစေ။
ကျွန်ုပ် ညည်းတွားရာကို ဘယ်သူမျှ မသိပါစေနှင့်။`,
    ],
  },
  {
    author: ["Robert Frost", "ရောဘတ် ဖရော့စ်"],
    titleMy: "မလျှောက်ခဲ့သောလမ်း",
    illustration: [
      "Textbook illustration: Two paths fork through a woodland.",
      "စာအုပ်ပါ သရုပ်ဖော်ပုံမှာ သစ်တောထဲက လမ်းနှစ်သွယ် ခွဲထွက်သွားပုံ ဖြစ်သည်။",
    ],
    stanzas: [
      [
        `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;`,
        `အရွက်ဝါနေသော တောထဲ လမ်းနှစ်သွယ် ခွဲသွား၏။
ခရီးသွား တစ်ယောက်တည်း ဖြစ်၍ နှစ်လမ်းလုံး
မသွားနိုင်တာ စိတ်မကောင်းဘဲ အကြာကြီး ရပ်နေခဲ့၏။
တစ်လမ်းကို မြင်နိုင်သမျှ အဝေးထိ ကြည့်လိုက်ရာ
တောအောက်က ချုံနွယ်တွေကြား ကွေ့သွားသည်အထိ မြင်၏။`,
      ],
      [
        `Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,`,
        `ထို့နောက် ထပ်တူ လှပသော တခြားလမ်းကို ရွေးလိုက်၏။
မြက်တွေ ပေါက်နေပြီး လူသွားပေးဖို့ လိုသလို မြင်ရ၍
ထိုလမ်းကို ရွေးဖို့ ပိုသင့်တော်မည် ထင်ခဲ့၏။
တကယ်တော့ လူတွေ ဖြတ်သန်းခဲ့ကြရာမှာ
နှစ်လမ်းစလုံး အလားတူ နင်းရာပေါ်နေခဲ့၏။`,
      ],
      [
        `And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.`,
        `ထိုမနက်က နှစ်လမ်းစလုံးမှာ
ခြေရာကြောင့် မည်းမသွားသေးသော အရွက်တွေ ဖုံးနေ၏။
ပထမလမ်းကို နောက်တစ်နေ့အတွက် ချန်ထားလိုက်၏။
သို့ပေမဲ့ လမ်းတစ်လမ်းက နောက်တစ်လမ်းကို ဆက်ခေါ်သွားတတ်မှန်း သိ၍
ဒီနေရာကို ပြန်လာဖြစ်ပါ့မလား မသေချာခဲ့ပါ။`,
      ],
      [
        `I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`,
        `နှစ်ပေါင်းများစွာ ကြာတဲ့အခါ တစ်နေရာရာမှာ
သက်ပြင်းချရင်း ဒီအကြောင်းကို ပြောနေမည်။
တောထဲမှာ လမ်းနှစ်သွယ် ခွဲသွားကြတယ်၊ ကျွန်ုပ်ကတော့
လူသွားနည်းတဲ့ လမ်းကို ရွေးခဲ့တယ်။
ထိုရွေးချယ်မှုကပဲ အရာအားလုံးကို ပြောင်းလဲစေခဲ့တယ်။`,
      ],
    ],
    glossary: [
      [
        "diverge (verb)",
        "separate from another route and go in a different direction",
        "အခြားလမ်းမှ ခွဲထွက်၍ ဦးတည်ရာတစ်ခုသို့ သွားသည်",
      ],
      [
        "undergrowth (noun)",
        "a dense growth of shrubs under trees in a woodland",
        "တောထဲက သစ်ပင်တွေအောက်မှာ ထူထပ်စွာ ပေါက်နေသော ချုံနွယ်များ",
      ],
      ["grassy (adj)", "covered with grass", "မြက်ဖုံးလွှမ်းသော"],
      ["trodden (verb)", "pressed something down with your foot", "ခြေဖြင့် ဖိနင်းခဲ့သည်"],
      ["doubt (verb)", "be not certain about something", "တစ်စုံတစ်ရာကို မသေချာဖြစ်သည်"],
      [
        "sigh (noun)",
        "a long, deep audible breath expressing sadness, or relief, or tiredness",
        "ဝမ်းနည်းခြင်း၊ စိတ်သက်သာရာရခြင်း သို့မဟုတ် ပင်ပန်းခြင်းကို ဖော်ပြသော သက်ပြင်းသံ",
      ],
    ],
    preReading: [
      [
        "Look at the picture. What do you think the poem is about?",
        "ပုံကို ကြည့်ပါ။ ကဗျာက ဘာအကြောင်းဖြစ်မည် ထင်သလဲ။",
      ],
      [
        "Have you ever been in a situation in which you need to make a right decision? If so, what was it?",
        "မှန်ကန်တဲ့ ဆုံးဖြတ်ချက် ချရမယ့် အခြေအနေမျိုး ကြုံဖူးသလား။ ကြုံဖူးရင် ဘာအခြေအနေလဲ။",
      ],
      ["Have you ever travelled alone?", "တစ်ယောက်တည်း ခရီးသွားဖူးသလား။"],
    ],
    questions: [
      [
        "How many stanzas are there in the poem? How many lines are there in each stanza?",
        "ကဗျာမှာ အပိုဒ် ဘယ်နှပိုဒ် ပါသလဲ။ တစ်ပိုဒ်စီမှာ စာကြောင်း ဘယ်နှကြောင်း ပါသလဲ။",
        "There are four stanzas, with five lines in each stanza.",
      ],
      [
        "How many roads are mentioned in the poem? What is the poet’s dilemma?",
        "ကဗျာမှာ လမ်း ဘယ်နှလမ်း ပါသလဲ။ ကဗျာပြောသူ ဆုံးဖြတ်ရခက်သည့် အချက်က ဘာလဲ။",
        "Two roads are mentioned. The speaker is one traveler and must choose between them.",
      ],
      [
        "Where did these roads diverge?",
        "ဒီလမ်းနှစ်သွယ် ဘယ်နေရာမှာ ခွဲသွားသလဲ။",
        "They diverged in a yellow wood.",
      ],
      [
        "Which road did the poet take? Why?",
        "ကဗျာပြောသူက ဘယ်လမ်းကို ရွေးခဲ့သလဲ။ ဘာကြောင့်လဲ။",
        "He chose the second road, which at first seemed grassier and less worn.",
      ],
      [
        "What is the connotative meaning of the word ‘road’ used in the poem?",
        "ကဗျာမှာ သုံးထားတဲ့ ‘လမ်း’ ဟူသော စကားလုံးက ဘာကို တင်စားသလဲ။",
        "A road represents a choice or a direction one can take in life.",
      ],
      [
        "How did the poet know that the road was less travelled by?",
        "ဒီလမ်းကို လူသွားနည်းသည်ဟု ကဗျာပြောသူ ဘာကိုကြည့်ပြီး ထင်ခဲ့သလဲ။",
        "The grass made the road look less worn. He also observes that the two roads were about equally worn and both covered in untrodden leaves that morning.",
      ],
      [
        "What is the message of the poet in ‘The Road Not Taken’?",
        "‘မလျှောက်ခဲ့သောလမ်း’ ကဗျာက ဘာသတင်းစကား ပေးသလဲ။",
        "Our choices shape what happens next, and it can be hard to return to a path we left behind.",
      ],
    ],
    writing: [
      "Write a short paragraph about the choices you did not make in your life.",
      "သင့်ဘဝမှာ မရွေးချယ်ခဲ့သော အရာများအကြောင်း စာပိုဒ်တိုတစ်ပိုဒ် ရေးပါ။",
    ],
  },
  {
    author: ["Robert Louis Stevenson", "ရောဘတ် လူဝီ စတီဗင်ဆန်"],
    titleMy: "လေထန်သောညများ",
    stanzas: [
      [
        `Whenever the moon and stars are set,
Whenever the wind is high,
All night long in the dark and wet,
A man goes riding by.
Late in the night when the fires are out,
Why does he gallop and gallop about?`,
        `လနဲ့ ကြယ်တွေ ဝင်သွားတိုင်း၊
လေပြင်းတွေ တိုက်ခတ်တိုင်း၊
စိုစွတ်မှောင်မည်းတဲ့ ညတစ်လျှောက်လုံး
လူတစ်ယောက် မြင်းစီးပြီး ဖြတ်သွားတယ်။
ညနက်လို့ မီးတွေ ငြိမ်းကုန်တဲ့အချိန်
သူ ဘာကြောင့် မြင်းကို ဒုန်းစိုင်းပြီး ဟိုဟိုဒီဒီ သွားနေတာလဲ။`,
      ],
      [
        `Whenever the trees are crying aloud,
And ships are tossed at sea,
By, on the highway, low and loud,
By at the gallop goes he.
By at the gallop he goes, and then
By he comes back at the gallop again.`,
        `သစ်ပင်တွေ တဝေါဝေါ မြည်ဟည်းတိုင်း၊
ပင်လယ်ထဲမှာ သင်္ဘောတွေ လူးလှိမ့်တိုင်း၊
လမ်းမပေါ်မှာ နိမ့်ပြီး ကျယ်လောင်တဲ့ အသံနဲ့
သူ မြင်းကို ဒုန်းစိုင်းပြီး ဖြတ်သွားတယ်။
သူ ဒုန်းစိုင်းပြီး ဖြတ်သွားတယ်၊ ပြီးတော့
ဒုန်းစိုင်းရင်းပဲ ပြန်ဖြတ်လာတယ်။`,
      ],
    ],
    preReading: [
      ["Have you ever experienced a windy night?", "လေထန်တဲ့ညမျိုး ကြုံဖူးသလား။"],
      ["What did you do on the windy night?", "အဲဒီ လေထန်တဲ့ညမှာ ဘာလုပ်ခဲ့သလဲ။"],
      [
        "What did you see and hear during this time? How did you feel then?",
        "အဲဒီအချိန်မှာ ဘာတွေ မြင်ခဲ့၊ ကြားခဲ့သလဲ။ ဘယ်လို ခံစားခဲ့ရသလဲ။",
      ],
      ["What happened that windy night?", "အဲဒီ လေထန်တဲ့ညမှာ ဘာဖြစ်ခဲ့သလဲ။"],
    ],
    questions: [
      [
        "What is the poem about?",
        "ကဗျာက ဘာအကြောင်းလဲ။",
        "It describes a mysterious rider galloping past on a dark, windy night.",
      ],
      [
        "What is the man doing late in the night?",
        "ညနက်ချိန်မှာ အဲဒီလူက ဘာလုပ်နေတာလဲ။",
        "He is galloping about on horseback.",
      ],
      [
        "What is meant by ‘when the fires are out’?",
        "‘မီးတွေ ငြိမ်းကုန်တဲ့အခါ’ ဆိုတာ ဘာကို ဆိုလိုတာလဲ။",
        "The fires have died down or been put out, suggesting that it is late and most people are asleep.",
      ],
      [
        "What is the high wind hinting at?",
        "လေပြင်းတိုက်နေတာက ဘာကို အရိပ်အမြွက် ဖော်ပြသလဲ။",
        "It hints at stormy weather and helps create an uneasy mood.",
      ],
      [
        "Why are the trees crying aloud?",
        "သစ်ပင်တွေက ဘာကြောင့် ကျယ်လောင်စွာ အော်နေသလို ဖြစ်တာလဲ။",
        "The strong wind makes the trees and branches noisy. The poet describes them as if they were crying.",
      ],
      [
        "What happens to the ships at sea on a windy night?",
        "လေထန်တဲ့ညမှာ ပင်လယ်ထဲက သင်္ဘောတွေ ဘာဖြစ်သလဲ။",
        "They are tossed about by the wind and waves.",
      ],
      [
        "How many times is the word ‘gallop’ repeated? Why?",
        "‘ဒုန်းစိုင်းခြင်း’ ဟူသော စကားလုံး ဘယ်နှခါ ပါသလဲ။ ဘာကြောင့် ထပ်သုံးသလဲ။",
        "It appears five times. The repetition echoes the sound and rhythm of the horse’s hooves.",
      ],
      [
        "What is the rhyme scheme of the poem?",
        "ကဗျာမှာ ကာရန် ဘယ်လိုစပ်ထားသလဲ။",
        "Each stanza follows the rhyme scheme ABABCC.",
      ],
      [
        "What is a six-line stanza called?",
        "ခြောက်ကြောင်းပါသော ကဗျာတစ်ပိုဒ်ကို ဘယ်လို ခေါ်သလဲ။",
        "A six-line stanza is called a sestet.",
      ],
      [
        "What message does the poet want to give to the reader in the poem?",
        "ကဗျာဆရာက စာဖတ်သူကို ဘာသတင်းစကား ပေးချင်သလဲ။",
        "The poet shows how the sounds and force of a storm can make an ordinary landscape feel mysterious and unsettling.",
      ],
    ],
    writing: [
      "Write a four-line verse with the rhyme scheme ABAB as given in the example below.",
      "ပထမစာကြောင်းနှင့် တတိယစာကြောင်း၊ ဒုတိယစာကြောင်းနှင့် စတုတ္ထစာကြောင်း ကာရန်ညီသော လေးကြောင်းကဗျာ ရေးပါ။",
    ],
    points: [
      ["Where you went on a rainy day", "မိုးရွာတဲ့နေ့မှာ ဘယ်သွားခဲ့သလဲ။"],
      ["Why you went there", "ဘာကြောင့် အဲဒီကို သွားခဲ့သလဲ။"],
      ["What you did on that day", "အဲဒီနေ့မှာ ဘာလုပ်ခဲ့သလဲ။"],
      ["What happened then", "အဲဒီနောက် ဘာဖြစ်ခဲ့သလဲ။"],
      ["How you felt then", "အဲဒီအချိန်မှာ ဘယ်လို ခံစားခဲ့ရသလဲ။"],
    ],
  },
];
