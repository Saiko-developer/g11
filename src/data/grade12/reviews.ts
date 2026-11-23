export type BilingualText = readonly [english: string, myanmar: string];
export type SupplementItem = readonly [
  ...BilingualText,
  answer?: string,
  choices?: readonly string[],
];

export type ReviewGroup = {
  instructions: BilingualText;
  items: readonly SupplementItem[];
  bank?: readonly BilingualText[];
  open?: boolean;
};

function reviewGroup(
  instructions: BilingualText,
  rows: string,
  bank?: readonly BilingualText[],
  open = false,
): ReviewGroup {
  return {
    instructions,
    bank,
    open,
    items: rows
      .trim()
      .split("\n")
      .map((row) => {
        const [english, myanmar, answer] = row.split("|");
        const choices = english.match(/\(([^()]+ \/ [^()]+)\)/)?.[1].split(/\s*\/\s*/);
        return [english, myanmar, answer, choices?.includes(answer) ? choices : undefined];
      }),
  };
}

export const textbookReviews = [
  [
    reviewGroup(
      ["Choose the correct answer.", "အဖြေမှန်ကို ရွေးပါ။"],
      `
An argument should be handled in a more constructive (manner / solution).|အငြင်းပွားမှုကို ပိုမို အပြုသဘောဆောင်သော (နည်းလမ်း / ဖြေရှင်းချက်) ဖြင့် ကိုင်တွယ်သင့်သည်။|manner
In some (cultures / traditions), it is not polite to ask someone how much he or she earns.|(ယဉ်ကျေးမှု / ရိုးရာဓလေ့) အချို့တွင် တစ်ပါးသူ၏ ဝင်ငွေကို မေးခြင်းသည် ယဉ်ကျေးမှုမရှိရာ ရောက်သည်။|cultures
It is (vital / possible) to be polite to your parents and teachers.|မိဘများနှင့် ဆရာများကို ယဉ်ကျေးစွာ ဆက်ဆံရန် (အလွန်အရေးကြီး / ဖြစ်နိုင်) သည်။|vital
We should (imitate / cultivate) good manners from our elders.|လူကြီးများထံမှ အမူအကျင့်ကောင်းများကို (အတုယူ / ပြုစုပျိုးထောင်) သင့်သည်။|imitate
Doctors are (responsible / knowledgeable) for the care and well-being of patients.|လူနာတို့၏ ပြုစုစောင့်ရှောက်မှုနှင့် ကျန်းမာချမ်းသာမှုအတွက် ဆရာဝန်များ (တာဝန်ရှိ / ဗဟုသုတရှိ) သည်။|responsible
When I got low marks, I became (depressed / relaxed) and stayed in bed for many hours.|အမှတ်နည်းသောအခါ (စိတ်ဓာတ်ကျ / စိတ်အေးလက်အေးဖြစ်) ပြီး အိပ်ရာထဲတွင် နာရီပေါင်းများစွာ နေခဲ့သည်။|depressed
After a long holiday, we felt (tired / relaxed) and ready to get back to work.|အားလပ်ရက်ရှည်ပြီးနောက် (ပင်ပန်း / စိတ်သက်သာ) ပြီး အလုပ်ပြန်လုပ်ရန် အသင့်ဖြစ်ခဲ့သည်။|relaxed
The mother keeps her son's room bright and (happy / cheerful) with beautiful curtains.|အမေက လှပသော လိုက်ကာများဖြင့် သား၏အခန်းကို လင်းလက်ပြီး (ပျော်ရွှင် / ရွှင်လန်းဖွယ်) ဖြစ်အောင် ထားသည်။|cheerful
I think it will be quite difficult to (accomplish / finish) your goal.|သင့်ရည်မှန်းချက်ကို (အောင်မြင်စွာ ရရှိ / အပြီးသတ်) ရန် အတော်ခက်မည်ဟု ထင်သည်။|accomplish
After a long walk in the forest, I sat down with (fatigue / boredom).|တောထဲတွင် ကြာကြာလမ်းလျှောက်ပြီးနောက် (ပင်ပန်းနွမ်းနယ် / ပျင်းရိ) သဖြင့် ထိုင်ချလိုက်သည်။|fatigue
As home-made burgers are (nutritional / nutritious), they are good for our health.|အိမ်လုပ် ဘာဂါများသည် (အာဟာရနှင့်ဆိုင် / အာဟာရပြည့်ဝ) သောကြောင့် ကျန်းမာရေးအတွက် ကောင်းသည်။|nutritious
The aim of the meeting is to find ways to prevent widespread (reforestation / deforestation) in the Amazon.|အစည်းအဝေး၏ ရည်ရွယ်ချက်မှာ အမေဇုန်ဒေသတွင် ကျယ်ပြန့်သော (သစ်တောပြန်စိုက်ပျိုးမှု / သစ်တောပြုန်းတီးမှု) ကို တားဆီးရန် နည်းလမ်းရှာဖွေဖို့ ဖြစ်သည်။|deforestation
The ozone layer blocks the (harmless / harmful) rays from the sun.|အိုဇုန်းလွှာက နေမှလာသော (အန္တရာယ်မရှိ / အန္တရာယ်ရှိ) သည့် ရောင်ခြည်များကို ကာကွယ်ပေးသည်။|harmful
Any (nutrition / diet) that does not provide enough nutrients should not be consumed.|အာဟာရဓာတ် အလုံအလောက်မရစေသည့် မည်သည့် (အာဟာရ / စားသောက်ပုံ) ကိုမဆို ရှောင်သင့်သည်။|diet
When she met the man she didn’t want to see at the party, she gave him (a genuine / an artificial) smile.|ပါတီတွင် မတွေ့ချင်သော အမျိုးသားနှင့် ဆုံသောအခါ သူမက (စစ်မှန်သော / ဟန်ဆောင်သော) အပြုံး ပြုံးပြလိုက်သည်။|an artificial
`,
    ),
    reviewGroup(
      [
        "Rewrite the sentences according to the instructions given in brackets.",
        "ကွင်းအတွင်း ပေးထားသော ညွှန်ကြားချက်အတိုင်း ဝါကျများကို ပြန်ရေးပါ။",
      ],
      `
I am looking for a secretary _____ (which / who) can use Microsoft Word and Excel well. (Choose the correct alternative.)|မိုက်ခရိုဆော့ဖ် ဝေါ့ဒ်နှင့် အက်ဆဲလ်ကို ကောင်းစွာ သုံးနိုင်သော အတွင်းရေးမှူးတစ်ဦးကို ရှာနေသည်။ (မှန်ကန်သည့် ဆက်စပ်နာမ်စားကို ရွေးပါ။)|who
Have you bought the snacks _____ (who / which) I asked you to buy from the market? (Choose the correct alternative.)|ဈေးထဲက ဝယ်ခိုင်းထားသော မုန့်တွေ ဝယ်ပြီးပြီလား။ (မှန်ကန်သည့် ဆက်စပ်နာမ်စားကို ရွေးပါ။)|which
I became friends with Thuta. His interests are the same as mine. (Join the sentences using suitable relative pronoun.)|သုတနှင့် ကျွန်ုပ် မိတ်ဆွေဖြစ်လာသည်။ သူ့စိတ်ဝင်စားမှုများက ကျွန်ုပ်နှင့် တူသည်။ (သင့်တော်သော ဆက်စပ်နာမ်စားဖြင့် ဆက်ပါ။)|I became friends with Thuta, whose interests are the same as mine.
The pop singer did not turn up. Kathy invited him to her birthday party. (Join the sentences using suitable relative pronoun.)|ပေါ့ပ်အဆိုတော် ရောက်မလာခဲ့ပါ။ ကေသီက သူ့ကို မွေးနေ့ပွဲသို့ ဖိတ်ထားသည်။ (သင့်တော်သော ဆက်စပ်နာမ်စားဖြင့် ဆက်ပါ။)|The pop singer whom Kathy invited to her birthday party did not turn up.;The pop singer who Kathy invited to her birthday party did not turn up.;The pop singer that Kathy invited to her birthday party did not turn up.
Mogok is a beautiful hill station. It is surrounded by mountain ranges on all sides. (Join the sentences using suitable relative pronoun.)|မိုးကုတ်သည် သာယာလှပသော တောင်ပေါ်မြို့ဖြစ်သည်။ ဘက်ပေါင်းစုံတွင် တောင်တန်းများ ဝန်းရံထားသည်။ (သင့်တော်သော ဆက်စပ်နာမ်စားဖြင့် ဆက်ပါ။)|Mogok is a beautiful hill station which is surrounded by mountain ranges on all sides.;Mogok is a beautiful hill station that is surrounded by mountain ranges on all sides.
My daughter won the first prize in the essay competition. She also won the first prize in the poem recitation competition. (Use ‘not only... but also’.)|ကျွန်ုပ်သမီးက စာစီစာကုံးပြိုင်ပွဲတွင် ပထမဆုရခဲ့သည်။ ကဗျာရွတ်ဆိုပြိုင်ပွဲတွင်လည်း ပထမဆုရခဲ့သည်။ (‘သာမက … ပါ’ ပုံစံ သုံးပါ။)|My daughter won the first prize not only in the essay competition but also in the poem recitation competition.
Japan is a developed country. It is also a super rich country. (Use ‘not only... but also’.)|ဂျပန်သည် ဖွံ့ဖြိုးပြီး နိုင်ငံဖြစ်သည်။ အလွန်ချမ်းသာသော နိုင်ငံလည်း ဖြစ်သည်။ (‘သာမက … ပါ’ ပုံစံ သုံးပါ။)|Japan is not only a developed country but also a super rich country.
The tourists enjoyed taking a ride in the bullet train. (Use ‘It is / It was ... who / that’.)|ခရီးသွားများက ကျည်ဆန်ရထား စီးရသည်ကို နှစ်သက်ခဲ့ကြသည်။ (အလေးပေး ဝါကျပုံစံ သုံးပါ။)|It was the tourists who enjoyed taking a ride in the bullet train.
She bought a mansion in the Golden Valley. (Use ‘It is / It was ... who / that’.)|သူမက ရွှေတောင်ကြားတွင် အိမ်ကြီးတစ်လုံး ဝယ်ခဲ့သည်။ (အလေးပေး ဝါကျပုံစံ သုံးပါ။)|It was in the Golden Valley that she bought a mansion.;It was a mansion that she bought in the Golden Valley.;It was she who bought a mansion in the Golden Valley.
I wrote poems because I enjoyed composing poems. (Use ‘It is / It was ... who / that’.)|ကဗျာစပ်ရတာကို နှစ်သက်သောကြောင့် ကဗျာများ ရေးခဲ့သည်။ (အလေးပေး ဝါကျပုံစံ သုံးပါ။)|It was because I enjoyed composing poems that I wrote poems.
An earthquake occurred on the remote island. It destroyed the whole village. (Join the sentences using Participle Phrase.)|ဝေးလံသော ကျွန်းတွင် ငလျင်လှုပ်ခဲ့သည်။ ရွာတစ်ခုလုံး ပျက်စီးခဲ့သည်။ (ကြိယာမှ ဆင်းသက်သော စကားစုဖြင့် ဆက်ပါ။)|An earthquake occurred on the remote island, destroying the whole village.
The children sang songs and danced very happily. They walked back home. (Join the sentences using Participle Phrase.)|ကလေးများက သီချင်းဆိုကာ ပျော်ရွှင်စွာ ကခုန်ခဲ့ကြသည်။ အိမ်သို့ လမ်းလျှောက်ပြန်ခဲ့ကြသည်။ (ကြိယာမှ ဆင်းသက်သော စကားစုဖြင့် ဆက်ပါ။)|Singing songs and dancing very happily, the children walked back home.;The children walked back home, singing songs and dancing very happily.
It’s getting late, I (can / must) go now. (Choose the correct option.)|နောက်ကျလာပြီ၊ အခု (သွားနိုင် / သွားရမည်)။ (အဖြေမှန်ကို ရွေးပါ။)|must
She said to me, “I’ll sing a song. (Can / Should) you dance?” (Choose the correct option.)|သူမက ‘ငါ သီချင်းဆိုမယ်။ မင်း က (နိုင်မလား / သင့်သလား)’ ဟု ကျွန်ုပ်ကို မေးသည်။ (အဖြေမှန်ကို ရွေးပါ။)|Can
`,
    ),
  ],
  [
    reviewGroup(
      [
        "Fill each blank with an appropriate word. The initial letters are given to help you.",
        "ကွက်လပ်တစ်ခုစီကို သင့်တော်သော စကားလုံးဖြင့် ဖြည့်ပါ။ အစစာလုံးများ ပေးထားသည်။",
      ],
      `
Sometimes in life, a w_____ lie is better than the truth.|ဘဝတွင် တစ်ခါတစ်ရံ _____ အလိမ်အညာက အမှန်ထက် ပိုကောင်းတတ်သည်။|white
When Nandar saw my gold watch, she was g_____ with envy.|နန္ဒာက ကျွန်ုပ်၏ ရွှေနာရီကို မြင်တော့ _____ မနာလို ဖြစ်သွားသည်။|green
My uncle lives in Putao and I only see him once in a b_____ moon.|ဦးလေးက ပူတာအိုမှာ နေပြီး သူနှင့် _____ မှ တစ်ခါလောက်သာ တွေ့ရသည်။|blue
A lot of fake things are sold on the b_____ market.|_____ ဈေးကွက်တွင် ပစ္စည်းအတုများစွာ ရောင်းချကြသည်။|black
I saw a dead rat on the street. It was really d_____.|လမ်းပေါ်တွင် ကြွက်သေတစ်ကောင် တွေ့ခဲ့သည်။ တကယ်ပင် _____ ဖွယ် ဖြစ်သည်။|disgusting
The boy felt f_____ as he could not solve the problem.|ပြဿနာကို မဖြေရှင်းနိုင်သဖြင့် ကောင်လေး _____ ဖြစ်ခဲ့သည်။|frustrated
The result of the game was s_____. The best team did not win.|ပွဲရလဒ်က _____ ဖွယ် ဖြစ်သည်။ အကောင်းဆုံးအသင်းက အနိုင်မရခဲ့ပါ။|surprising
R_____ vacuum cleaners have sensors that can detect the area where they need to pick dust.|_____ ဖုန်စုပ်စက်များတွင် ဖုန်စုပ်ရန် လိုအပ်သည့်နေရာကို ရှာဖွေနိုင်သော အာရုံခံကိရိယာများ ပါသည်။|Robotic
With the advent of u_____ spacecraft, human beings can explore the outer space much better than the last decade.|_____ အာကာသယာဉ်များ ပေါ်ပေါက်လာသဖြင့် လူသားတို့သည် အာကာသကို ယခင်ဆယ်စုနှစ်ကထက် ပိုကောင်းစွာ စူးစမ်းနိုင်သည်။|unmanned
Electronic g_____ such as wireless earbuds for mobile phones are fashionable and convenient to use.|လက်ကိုင်ဖုန်းသုံး ကြိုးမဲ့နားကြပ်ကဲ့သို့ အီလက်ထရွန်နစ် _____ များသည် ခေတ်မီပြီး သုံးရလွယ်ကူသည်။|gadgets
`,
    ),
    reviewGroup(
      [
        "Complete each sentence with an appropriate phrase in the box.",
        "ကွက်ထဲမှ သင့်တော်သော စကားစုဖြင့် ဝါကျတစ်ကြောင်းစီကို ဖြည့်ပါ။",
      ],
      `
My parents are not _____ me as they know that I can take care of myself.|ကိုယ့်ကိုယ်ကို စောင့်ရှောက်နိုင်မှန်း သိသဖြင့် မိဘများက ကျွန်ုပ်အတွက် _____ မဖြစ်ကြပါ။|worried about
Hla Hla is really _____ her trip to Ngapali as she has never been there before.|ငပလီကို တစ်ခါမျှ မရောက်ဖူးသောကြောင့် လှလှက ငပလီခရီးအတွက် တကယ် _____ နေသည်။|excited about
Aung Aung was not fully _____ the danger of going out late at night.|ညနက်မှ အပြင်ထွက်ခြင်း၏ အန္တရာယ်ကို အောင်အောင် အပြည့်အဝ _____ မရှိခဲ့ပါ။|aware of
Although some people want to play extreme sports, they are _____ getting hurt.|လူအချို့သည် စွန့်စားရသော အားကစားများကို လုပ်ချင်သော်လည်း ဒဏ်ရာရမည်ကို _____ ကြသည်။|scared of
Daw Mya was _____ herself for having let her emotions get out of control.|စိတ်ခံစားမှုကို မထိန်းနိုင်ခဲ့သောကြောင့် ဒေါ်မြသည် မိမိကိုယ်ကို _____ ခဲ့သည်။|embarrassed by
Our boss was very _____ the result of our group’s work. He said it was excellent.|အဖွဲ့၏ အလုပ်ရလဒ်ကို အကြီးအကဲက အလွန် _____ သည်။ သိပ်ကောင်းသည်ဟု သူပြောခဲ့သည်။|pleased with
`,
      [
        ["aware of", "သတိပြုမိသော"],
        ["scared of", "ကြောက်သော"],
        ["pleased with", "သဘောကျသော"],
        ["excited about", "စိတ်လှုပ်ရှားသော"],
        ["worried about", "စိုးရိမ်သော"],
        ["embarrassed by", "ရှက်ရွံ့သော"],
      ],
    ),
    reviewGroup(
      ["Choose the correct option.", "အဖြေမှန်ကို ရွေးပါ။"],
      `
(After / Although / Before / If) it was very dark, the children were still playing outside.|အလွန်မှောင်နေ (ပြီးနောက် / သော်လည်း / မတိုင်မီ / လျှင်) ကလေးများ အပြင်မှာ ကစားနေဆဲ ဖြစ်သည်။|Although
(Because / Unless / Although / Now that) it stops raining, we won’t go out.|မိုးတိတ် (သောကြောင့် / မတိတ်လျှင် / သော်လည်း / ပြီဖြစ်၍) ကျွန်ုပ်တို့ အပြင်မထွက်ပါ။|Unless
I opened the door (so as to / for / so that / because) my little cat could come in.|ကြောင်လေး အထဲဝင်နိုင် (ရန် / အတွက် / အောင် / သောကြောင့်) တံခါးဖွင့်လိုက်သည်။|so that
We were happy (when / while / where / how) we received the first prize.|ပထမဆုရသော (အချိန် / ကာလအတွင်း / နေရာ / နည်းလမ်း) တွင် ပျော်ခဲ့ကြသည်။|when
Marlar will go to the gym (after / while / unless / before) she has finished her chores.|မာလာက အိမ်မှုကိစ္စများ ပြီး (နောက် / နေစဉ် / မပြီးလျှင် / မတိုင်ခင်) အားကစားရုံသို့ သွားမည်။|after
My friend carries his laptop with him (whatever / wherever / whenever / however) he goes.|သူငယ်ချင်းက (ဘာလုပ်လုပ် / ဘယ်သွားသွား / ဘယ်အချိန်သွားသွား / ဘယ်လိုသွားသွား) လက်ပ်တော့ကို ယူသွားတတ်သည်။|wherever
`,
    ),
    reviewGroup(
      [
        "Rewrite the sentences using ‘no matter what / who / how / which / whether, etc.’",
        "‘ဘာပဲဖြစ်ဖြစ်၊ ဘယ်သူပဲဖြစ်ဖြစ်၊ ဘယ်လိုပဲဖြစ်ဖြစ်၊ ဘယ်ဟာပဲဖြစ်ဖြစ်၊ ဖြစ်သည်ဖြစ်စေ မဖြစ်သည်ဖြစ်စေ’ စသည့် ပုံစံများ သုံး၍ ပြန်ရေးပါ။",
      ],
      `
Your parents will treat you like a child if you like it or not.|သင် ကြိုက်သည်ဖြစ်စေ မကြိုက်သည်ဖြစ်စေ မိဘများက သင့်ကို ကလေးတစ်ယောက်လို ဆက်ဆံကြမည်။|No matter whether you like it or not, your parents will treat you like a child.
Even if he is young, he must be treated with respect.|သူ အသက်ငယ်သော်လည်း သူ့ကို လေးစားစွာ ဆက်ဆံရမည်။|No matter how young he is, he must be treated with respect.
I do not care what others think of me. I will not change my mind.|တခြားသူများက ကျွန်ုပ်ကို ဘယ်လိုထင်ထင် ဂရုမစိုက်ပါ။ စိတ်ကူးကို ပြောင်းမည်မဟုတ်ပါ။|No matter what others think of me, I will not change my mind.
It does not matter who you are. You need to wear your ID card on this campus.|သင် ဘယ်သူဖြစ်ဖြစ် အရေးမကြီးပါ။ ဤကျောင်းဝင်းထဲတွင် သက်သေခံကတ် ဝတ်ထားရမည်။|No matter who you are, you need to wear your ID card on this campus.
Even if I warn him many times, he will never listen to me.|သူ့ကို အကြိမ်ကြိမ် သတိပေးလည်း ကျွန်ုပ်ပြောသည်ကို ဘယ်တော့မှ နားထောင်မည်မဟုတ်ပါ။|No matter how many times I warn him, he will never listen to me.
Dad never complains about the food that mother cooks even if it is tasteless.|အမေချက်သည့် ဟင်း အရသာမရှိသော်လည်း အဖေက ဘယ်တော့မှ မညည်းညူပါ။|No matter how tasteless the food that mother cooks is, Dad never complains about it.
My friends will eat up whatever food I cook.|ကျွန်ုပ် ဘာဟင်းချက်ချက် သူငယ်ချင်းများက အကုန်စားကြမည်။|No matter what food I cook, my friends will eat it up.
`,
    ),
  ],
  [
    reviewGroup(
      [
        "Rewrite the following sentences using the linking words given in brackets.",
        "ကွင်းထဲမှ ဆက်စပ်စကားလုံးများကို သုံး၍ အောက်ပါ ဝါကျများကို ပြန်ရေးပါ။",
      ],
      `
She needs a job. She has to support her parents. (because)|သူမ အလုပ်တစ်ခု လိုသည်။ မိဘများကို ထောက်ပံ့ရမည်။ (အကြောင်းပြချက် ပြသော စကားလုံးကို သုံးပါ။)|She needs a job because she has to support her parents.
The water in the lake was contaminated with chemicals. Many villagers suffered from diarrhoea. (as a result)|ရေကန်ထဲကရေတွင် ဓာတုပစ္စည်းများ ရောနှောညစ်ညမ်းခဲ့သည်။ ရွာသားအများအပြား ဝမ်းလျှောခဲ့ကြသည်။ (အကျိုးဆက်အနေဖြင့်)|The water in the lake was contaminated with chemicals. As a result, many villagers suffered from diarrhoea.
His computer stopped working. It was attacked by a virus. (due to)|သူ့ကွန်ပျူတာ အလုပ်မလုပ်တော့ပါ။ ဗိုင်းရပ်စ် ဝင်ခဲ့သည်။ (ကြောင့်)|His computer stopped working due to a virus attack.;His computer stopped working due to being attacked by a virus.
La Wun passed the exam with flying colours. She got a Mac-book air laptop from her parents. (as a result of)|လဝန်း စာမေးပွဲကို ထူးထူးချွန်ချွန် အောင်ခဲ့သည်။ မိဘများထံမှ မက်ဘွတ်အဲ လက်ပ်တော့တစ်လုံး ရခဲ့သည်။ (အကျိုးဆက်အဖြစ်)|As a result of passing the exam with flying colours, La Wun got a Mac-book air laptop from her parents.;La Wun got a Mac-book air laptop from her parents as a result of passing the exam with flying colours.
The old woman got better. She took her medicine regularly. (as a consequence)|အဘွားအို နေကောင်းလာခဲ့သည်။ ဆေးကို ပုံမှန် သောက်ခဲ့သည်။ (အကျိုးဆက်အနေဖြင့်)|The old woman took her medicine regularly. As a consequence, she got better.
`,
    ),
    reviewGroup(
      [
        "Complete each sentence with an appropriate word. The initial letters are given to help you.",
        "ဝါကျတစ်ကြောင်းစီကို သင့်တော်သော စကားလုံးဖြင့် ဖြည့်ပါ။ အစစာလုံးများ ပေးထားသည်။",
      ],
      `
D_____ wastes such as old smartphones should be properly thrown away.|စမတ်ဖုန်းဟောင်းများကဲ့သို့သော _____ စွန့်ပစ်ပစ္စည်းများကို စနစ်တကျ စွန့်ပစ်သင့်သည်။|Digital
As cutting down trees is the root cause of global warming, we should prevent d_____.|သစ်ပင်ခုတ်ခြင်းသည် ကမ္ဘာကြီးပူနွေးမှု၏ အရင်းခံဖြစ်သောကြောင့် _____ ကို ကာကွယ်သင့်သည်။|deforestation
Although i_____ creates new job opportunities, it has bad effects on the environment.|_____ က အလုပ်အကိုင် အခွင့်အလမ်းသစ်များ ဖန်တီးပေးသော်လည်း ပတ်ဝန်းကျင်ကို ထိခိုက်စေသည်။|industrialisation;industrialization
By using solar power and wind power, we can reduce the use of f_____ fuels.|နေစွမ်းအင်နှင့် လေစွမ်းအင်အသုံးပြုခြင်းဖြင့် _____ လောင်စာအသုံးပြုမှုကို လျှော့ချနိုင်သည်။|fossil
U_____ results in loss of forests and loss of natural habitats.|_____ ကြောင့် သစ်တောများနှင့် သဘာဝနေထိုင်ရာများ ဆုံးရှုံးရသည်။|Urbanisation;Urbanization
Saving e_____ will save our fossil fuels and cut down on pollution.|_____ ချွေတာသုံးစွဲလျှင် ရုပ်ကြွင်းလောင်စာများ ချွေတာနိုင်ပြီး ညစ်ညမ်းမှု လျော့နည်းမည်။|energy
Burning fossil fuels such as coal e_____ carbon into the air.|ကျောက်မီးသွေးကဲ့သို့ ရုပ်ကြွင်းလောင်စာများ မီးရှို့ရာတွင် လေထုထဲသို့ ကာဗွန် _____ သည်။|emits
Using public transportation can help c_____ energy.|အများသုံး သယ်ယူပို့ဆောင်ရေးကို အသုံးပြုခြင်းဖြင့် စွမ်းအင် _____ ရာတွင် အထောက်အကူဖြစ်စေသည်။|conserve
`,
    ),
    reviewGroup(
      [
        "Complete the sentences with the correct form of the verbs in brackets.",
        "ကွင်းထဲရှိ ကြိယာများကို မှန်ကန်သော ပုံစံသို့ ပြောင်း၍ ဝါကျများကို ဖြည့်ပါ။",
      ],
      `
If we burn fossil fuels, the amount of CO₂ _____ (rise) in the atmosphere.|ရုပ်ကြွင်းလောင်စာများ မီးရှို့လျှင် လေထုထဲက ကာဗွန်ဒိုင်အောက်ဆိုက် ပမာဏ _____ မည်။ (မြင့်တက်သည်)|will rise;rises
If we _____ (not consume) fossil fuels for decades, the natural environment would not have been damaged.|ရုပ်ကြွင်းလောင်စာများကို ဆယ်စုနှစ်များစွာ _____ ခဲ့လျှင် သဘာဝပတ်ဝန်းကျင် ပျက်စီးခဲ့မည် မဟုတ်ပါ။ (မသုံးစွဲ)|had not consumed;hadn’t consumed
If you want to solve the environmental problems, renewable energy _____ (be) one of the best alternatives.|သဘာဝပတ်ဝန်းကျင် ပြဿနာများကို ဖြေရှင်းလိုလျှင် ပြန်လည်ပြည့်ဖြိုးမြဲ စွမ်းအင်သည် အကောင်းဆုံး အစားထိုးနည်းလမ်းတစ်ခု _____ သည်။ (ဖြစ်သည်)|is;will be
There _____ (not be) much environmental deterioration if we had not used fossil fuels.|ရုပ်ကြွင်းလောင်စာများ မသုံးခဲ့လျှင် သဘာဝပတ်ဝန်းကျင် ယိုယွင်းမှု သိပ် _____ ခဲ့ပါ။ (မရှိ)|would not have been;wouldn’t have been
If wind turbines _____ (install), they will be a threat to wildlife such as birds and bats in the local area.|လေတာဘိုင်များ _____ ပါက ဒေသတွင်း ငှက်နှင့် လင်းနို့ကဲ့သို့သော တောရိုင်းတိရစ္ဆာန်များအတွက် အန္တရာယ် ဖြစ်လာမည်။ (တပ်ဆင်သည်)|are installed
`,
    ),
    reviewGroup(
      ["Choose the correct option.", "အဖြေမှန်ကို ရွေးပါ။"],
      `
He invited all his friends (stay / to stay) with him during the weekend.|စနေ၊ တနင်္ဂနွေတွင် သူနှင့်အတူ တည်းခိုရန် သူငယ်ချင်းအားလုံးကို ဖိတ်ခေါ်ခဲ့သည်။|to stay
Doctor Sai wrote a book to advise teenagers (eat / to eat) healthy foods.|ဆယ်ကျော်သက်များကို ကျန်းမာရေးနှင့်ညီညွတ်သော အစားအစာများ စားရန် အကြံပေးသည့် စာအုပ်ကို ဆရာဝန်စိုင်း ရေးခဲ့သည်။|to eat
You shouldn’t let your kids (do / to do) whatever they like.|ကလေးတွေကို စိတ်ကြိုက် လုပ်ခွင့် မပေးသင့်ပါ။|do
The manager didn’t allow the children (play / to play) football next to the factory windows.|မန်နေဂျာက စက်ရုံပြတင်းပေါက်များဘေးတွင် ကလေးများကို ဘောလုံးကစားခွင့် မပေးခဲ့ပါ။|to play
I like him because he makes me (laugh / to laugh).|သူက ကျွန်ုပ်ကို ရယ်စေသောကြောင့် သူ့ကို သဘောကျသည်။|laugh
When I came in, I noticed him (draw / to draw) a picture of his wife.|အထဲသို့ ဝင်လာချိန်တွင် သူ့ဇနီးပုံကို သူ ဆွဲနေသည်ကို သတိထားမိခဲ့သည်။|draw
The teacher told us (participate / to participate) in the school concert.|ဆရာက ကျောင်းဖျော်ဖြေပွဲတွင် ပါဝင်ရန် ကျွန်ုပ်တို့ကို ပြောခဲ့သည်။|to participate
While sitting alone in the park, I saw a snake (crawl / to crawl) into a nearby bush.|ပန်းခြံတွင် တစ်ယောက်တည်း ထိုင်နေစဉ် မြွေတစ်ကောင် အနီးက ချုံထဲသို့ တွားဝင်သွားသည်ကို မြင်ခဲ့သည်။|crawl
`,
    ),
    reviewGroup(
      [
        "Write five sentences of your own using the following verbs.",
        "အောက်ပါ ကြိယာတစ်လုံးစီသုံးပြီး ကိုယ်တိုင် စုစုပေါင်း ငါးကြောင်း ရေးပါ။",
      ],
      `
Let|ခွင့်ပြုသည်
help|ကူညီသည်
make|လုပ်စေသည်
teach|သင်ပေးသည်
tell|ပြောသည်
`,
      undefined,
      true,
    ),
  ],
  [
    reviewGroup(
      [
        "Complete each sentence with the correct word given in the bracket.",
        "ကွင်းထဲမှ မှန်ကန်သော စကားလုံးဖြင့် ဝါကျတစ်ကြောင်းစီကို ဖြည့်ပါ။",
      ],
      `
This monthly newsletter is very (interactive / informative).|ဤလစဉ်သတင်းလွှာသည် အလွန် (အပြန်အလှန် ပါဝင်နိုင်သော / သိကောင်းစရာ ပြည့်ဝသော) သတင်းလွှာ ဖြစ်သည်။|informative
Arrange the chairs in a U-shape so that students can (interact / interpret) easily with one another.|ကျောင်းသားများ အချင်းချင်း လွယ်ကူစွာ (အပြန်အလှန် ဆက်ဆံ / အနက်ပြန်) နိုင်ရန် ကုလားထိုင်များကို ခွက်ပုံစံ စီပါ။|interact
Teachers use visual aid to make their lessons more interesting and (comprehensible / communicative).|သင်ခန်းစာများ ပိုစိတ်ဝင်စားဖွယ်နှင့် (နားလည်လွယ် / ပြောဆိုဆက်သွယ်နိုင်) စေရန် ဆရာများက မြင်သာသော သင်ထောက်ကူကို သုံးကြသည်။|comprehensible
This novel has been (translated / interpreted) into several languages as it attracts worldwide attention.|ဤဝတ္ထုသည် ကမ္ဘာတစ်ဝန်း စိတ်ဝင်စားမှု ရသဖြင့် ဘာသာစကားအမျိုးမျိုးသို့ (ဘာသာပြန် / အနက်ဖွင့်) ထားသည်။|translated
Dolphins produce sounds such as whistles and screeches to (communicate / interpret) with one another.|လင်းပိုင်များသည် အချင်းချင်း (ဆက်သွယ် / အနက်ဖွင့်) ရန် ဝီစီသံနှင့် စူးရှသော အော်သံများ ထုတ်ကြသည်။|communicate
A slum area where people are packed like sardines can lead to the outbreak of a flu (epidemic / pandemic).|လူများ ငါးသေတ္တာထဲက ငါးတွေလို ကြပ်သိပ်နေသော ဆင်းရဲသားရပ်ကွက်တွင် တုပ်ကွေး (ဒေသတွင်း ကူးစက်ရောဂါ / ကမ္ဘာ့ကပ်ရောဂါ) ဖြစ်ပွားနိုင်သည်။|epidemic
On hearing of her brother’s untimely death, she became (white-faced / black-faced) and fainted.|အစ်ကို အရွယ်မတိုင်မီ ကွယ်လွန်ကြောင်း ကြားရသောအခါ သူမ (မျက်နှာဖြူဖျော့ / မျက်နှာမည်း) သွားပြီး မေ့လဲခဲ့သည်။|white-faced
As he could not sleep well, the doctor (prescribed / described) him some sleeping pills.|ကောင်းကောင်း မအိပ်နိုင်သောကြောင့် ဆရာဝန်က သူ့ကို အိပ်ဆေးအချို့ (ညွှန်း / ဖော်ပြ) ခဲ့သည်။|prescribed
`,
    ),
    reviewGroup(
      ["Choose the correct alternative.", "အဖြေမှန်ကို ရွေးပါ။"],
      `
You should revise your lessons (to / in order not to / so that) be able to do well in the exam.|စာမေးပွဲကို ကောင်းစွာဖြေနိုင် (ရန် / မဖြေနိုင်ရန် / အောင်) သင်ခန်းစာများ ပြန်နွေးသင့်သည်။|to
I have made some sandwiches (so that / to / in order to) I can have them on the way.|လမ်းမှာ စားလို့ရ (အောင် / ရန် / ရည်ရွယ်၍) အသားညှပ်ပေါင်မုန့် တချို့ လုပ်ထားသည်။|so that
I set the alarm for 5 o’clock (to / in order not to / so as to) oversleep and miss the bus.|အိပ်ပျော်လွန်ပြီး ဘတ်စ်ကား လွတ် (ရန် / မသွားစေရန် / ဖို့) ငါးနာရီတွင် မြည်အောင် နှိုးစက်ထားခဲ့သည်။|in order not to
A ship carries life boats (to / so that / in order to) the crew and passengers can use them in case of emergency.|အရေးပေါ်အခါ သင်္ဘောသားနှင့် ခရီးသည်များ သုံးနိုင် (ရန် / အောင် / ရည်ရွယ်၍) သင်္ဘောပေါ်တွင် အသက်ကယ်လှေများ ထားသည်။|so that
We learn English (so as to / in order not to / so that) communicate with people around the world.|ကမ္ဘာတစ်ဝန်းရှိ လူများနှင့် ဆက်သွယ် (နိုင်ရန် / မဆက်သွယ်ရန် / နိုင်အောင်) အင်္ဂလိပ်စာ သင်ယူကြသည်။|so as to
`,
    ),
    reviewGroup(
      [
        "Fill each blank with a suitable relative pronoun or relative adverb.",
        "ကွက်လပ်တစ်ခုစီကို သင့်တော်သော ဆက်စပ်နာမ်စား သို့မဟုတ် ဆက်စပ်ကြိယာဝိသေသနဖြင့် ဖြည့်ပါ။",
      ],
      `
His parents encouraged him to pursue the specialisation _____ he chose.|သူ _____ ရွေးချယ်ထားသော အထူးပြုဘာသာရပ်ကို သင်ယူရန် မိဘများက အားပေးကြသည်။|that;which
The girl _____ you saw at the information desk is my sister.|စုံစမ်းရေးကောင်တာမှာ သင် တွေ့ခဲ့သော မိန်းကလေး _____ ကျွန်ုပ်၏ ညီမဖြစ်သည်။|whom;who;that
The water fountain _____ is in the centre of the garden is our favourite spot.|ဥယျာဉ်အလယ်မှာ ရှိသော ရေပန်း _____ ကျွန်ုပ်တို့ အကြိုက်ဆုံး နေရာဖြစ်သည်။|which;that
It is at the top of the mountain _____ we can have a good view of the city.|မြို့ကို ကောင်းစွာ မြင်နိုင်သည့် နေရာက တောင်ထိပ် _____ ဖြစ်သည်။|that
The reason _____ I work so hard is I want to be a software engineer.|အလွန် ကြိုးစားရသည့် အကြောင်းရင်း _____ ဆော့ဖ်ဝဲ အင်ဂျင်နီယာ ဖြစ်ချင်လို့ ဖြစ်သည်။|why;that
`,
    ),
    reviewGroup(
      [
        "Fill each blank with a suitable phrasal verb in the box.",
        "ကွက်ထဲက သင့်တော်သော စကားစုကြိယာဖြင့် ကွက်လပ်တစ်ခုစီကို ဖြည့်ပါ။",
      ],
      `
My old friends and I will _____ at a restaurant on New Year’s Eve.|နှစ်သစ်ကူးအကြိုညမှာ သူငယ်ချင်းဟောင်းများနှင့် စားသောက်ဆိုင်တစ်ဆိုင်၌ _____ မည်။|get together
Does this photo _____ any memories of the first day at school?|ဤဓာတ်ပုံက ပထမဆုံး ကျောင်းတက်ရက် အမှတ်တရများကို _____ သလား။|bring back
We used to _____ very often until last year, but now we are too busy to see each other.|မနှစ်အထိ မကြာခဏ _____ ခဲ့ကြသော်လည်း ယခု နှစ်ဖက်လုံး မအား၍ မတွေ့ကြတော့ပါ။|hang out
Is this the first time for the new waiter to _____ some complaints about the food?|စားပွဲထိုးအသစ်အတွက် အစားအသောက်ဆိုင်ရာ တိုင်ကြားချက်များကို _____ ရသည်မှာ ပထမဆုံးအကြိမ်လား။|deal with
He left work and a few years later, he _____ his own software company.|အလုပ်ထွက်ပြီး နှစ်အနည်းငယ်အကြာတွင် သူ ကိုယ်ပိုင် ဆော့ဖ်ဝဲကုမ္ပဏီ _____ ခဲ့သည်။|set up
`,
      [
        ["deal with", "ကိုင်တွယ်ဖြေရှင်းသည်"],
        ["hang out", "အတူ အချိန်ဖြုန်းသည်"],
        ["set up", "တည်ထောင်သည်"],
        ["bring back", "ပြန်လည် အမှတ်ရစေသည်"],
        ["get together", "စုဝေးတွေ့ဆုံသည်"],
      ],
    ),
  ],
] as const;
