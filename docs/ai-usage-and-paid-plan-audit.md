# AI usage နှင့် paid plan စစ်ဆေးချက်

စစ်ဆေးသည့် repo: remix-of-project-launchpad-94 @ 71653bd။ ဤသည် source-code audit ဖြစ်ပြီး live database၊ billing၊ provider availability၊ usage durations ကို မတိုင်းတာထားပါ။ App behavior မပြောင်းထားပါ။ Grade 10 ဖိုင်များကို မပြင်ထားပါ။

## အဓိကတွေ့ရှိချက်

Paid plan လုပ်နိုင်သော်လည်း လက်ရှိ credit system ကို feature အားလုံးအတွက် အသုံးပြုခွင့်/ကုန်ကျစရိတ်စနစ်အဖြစ် မယူဆရပါ။ Login ရှိခြင်းနှင့် paid quota ရှိခြင်း မတူပါ။ Endpoints အချို့မှာ authentication သာစစ်ပြီး paid entitlement/usage မစစ်ပါ။

## AI အသုံးပြုမှု စာရင်းအပြည့်

| Feature / endpoint | ကုန်ကျသည့်အခါ | လက်ရှိ ထိန်းချုပ်မှု / ပြန်သုံးမှု |
|---|---|---|
| Saya Owl popup `/api/chat-home` | AI အဖြေတစ်ကြိမ်၊ အသံသုံးလျှင် STT/TTS သီးခြားထပ်ကုန် | `consume_tutor_message` ဖြင့် tutor count စစ်သည်။ Voice minutes မစစ်။ |
| Tutor/text chat `/api/chat` | အဖြေတစ်ကြိမ် | တူညီသော tutor count စစ်သည်။ |
| Grade 11 role play `/api/g11-roleplay` | စတင်သည့်အဖြေ၊ နောက်အဖြေများ၊ နောက်ဆုံး feedback၊ voice STT/TTS | Speaking session/turn RPCs သုံးသည်။ Monthly voice wallet မရှိ။ |
| Grade 10 role play `/api/roleplay` | အထက်ပါကဲ့သို့ | Shared speaking RPCs။ ဤ audit က ပြင်ရန်မဟုတ်ဘဲ စာရင်းသွင်းရန်သာ ဖတ်သည်။ |
| အသံထုတ်ခြင်း `/api/tts` | Grammar oral, popup, role play, model voice စသည်တို့၏ generated audio | Login စစ်သည်။ Tutor quota/paid minutes မစစ်။ Grade 11 Unit 1 authored grammar clips ကိုသာ best-effort shared cache ထည့်ထားသည်။ Units 2–12 နှင့် personal replies ကို မသိမ်းထား။ |
| အသံ → စာသား `/api/transcribe` | ကျောင်းသားအသံ clip တစ်ခုစီ | Login/input checks ရှိသည်။ Paid voice entitlement သို့မဟုတ် minutes wallet မစစ်။ |
| Hints `/api/answer-hint` | AI hint တောင်းခြင်း | Login စစ်သည်။ Tutor-count debit မရှိ။ |
| Grade 11 answers / writing `/api/g11-check` | AI check သို့မဟုတ် AI model answer တောင်းခြင်း | Login/input limits သာ။ Daily/monthly checking credit မရှိ။ |
| Grammar practice `/api/grammar-exercises` | လေ့ကျင့်ခန်းအသစ်ထုတ်ခြင်း | Login/input checks။ Per-user paid quota မရှိ။ |
| Practice questions `/api/exercises` | မေးခွန်းအသစ်ထုတ်ခြင်း | Login/input checks။ Per-user paid quota မရှိ။ |
| Exam questions `/api/exam` | Generate ခေါ်ခြင်း | Login/input checks။ Exam-credit debit မတွေ့။ Current UI caller မတွေ့သော်လည်း route ရှိနေသည်။ |
| Shared grammar bank `/api/grammar-questions` | POST batch အသစ်ထုတ်ခြင်း | GET က သိမ်းထားသောမေးခွန်းဖတ်သည်။ Lesson တစ်ခုလျှင် batch 30 × မေးခွန်း 10 သတ်မှတ်ထားသော်လည်း per-user plan quota မဟုတ်။ |
| Mock exam `/api/mock-exam` | စာမေးပွဲအသစ်ထုတ်ခြင်း | `exam_quota` စစ်သည်၊ recent matching saved paper ပြန်သုံးနိုင်သည်။ Generation အောင်ပြီးမှ record/debit လုပ်သဖြင့် concurrent requests အတွက် reservation မရှိ။ |
| Photo marking `/api/grade-exam` | အဖြေလွှာပုံများ AI ဖြင့်စစ်ခြင်း | Login နှင့် ပုံ 6 ပုံအများဆုံး။ User marking-credit debit မရှိ။ |
| Classroom marking `/api/auto-grade` | Submission ပြီးနောက်/ဆရာပြန်စစ်ခိုင်းခြင်း | Ownership/teacher checks၊ claim/lease နှင့် သိမ်းထားသော draft ရှိသည်။ Force re-grade အသစ်ထပ်ကုန်နိုင်။ Paid marking balance မရှိ။ |
| Scheduled marking `/api/public/cron-auto-grade` | Background job က pending paper စစ်ခြင်း | Cron authentication၊ batch 3၊ saved status/lease နှင့် circuit breaker ရှိသည်။ ကျောင်းသား button မနှိပ်ဘဲလည်း ကုန်နိုင်။ |
| Admin `checkAiStatus` server function | Admin က provider test လုပ်ခြင်း | Admin-only။ Lovable နှင့် configured direct Gemini test calls ကြောင့် provider usage ရှိနိုင်။ |

`src/lib/ai/responses.server.ts` တွင် generic AI helper ရှိသော်လည်း လက်ရှိ source တွင် caller မတွေ့ပါ။ Helper ရှိခြင်းကို လက်ရှိအသုံးစရိတ်ဟု မတွက်ထားပါ။

## AI မလိုသော အသုံးပြုမှု

- မူရင်း MP3 / subtitles ကို နားထောင်ခြင်း။
- Textbook text၊ ရေးပြီးသားဘာသာပြန်၊ grammar notes ကို ဖတ်ခြင်း။
- Known answer key နှင့် local Check Answer/Reveal Answer ပြုလုပ်ခြင်း။
- Browser microphone local recording/playback နှင့် key-based exercise checks။
- Cache hit ဖြစ်သည့် Unit 1 grammar audio။ Cache သည် eviction/cold region ကြောင့် ထပ်ထုတ်နိုင်သဖြင့် အမြဲ free ဟု မကတိပေးရပါ။

ယင်းတို့မှာ model call မရှိသော်လည်း hosting/storage/network ကုန်ကျစရိတ် ရှိနိုင်သည်။

## လက်ရှိ model / billing လမ်းကြောင်း

- Chat/JSON: default `google/gemini-3-flash-preview` via Lovable။ Environment overrides ရှိနိုင်သည်။
- TTS: default `google/gemini-2.5-flash-tts`; fallback `openai/gpt-4o-mini-tts`။ နှစ်ခုလုံး Lovable gateway ကို သုံးသည်။
- STT: default Burmese `google/gemini-3.5-transcribe`; English `openai/gpt-4o-transcribe`; environment override ရှိနိုင်သည်။
- Generated-paper photo marking: shared chat model။ Uploaded paper + marking guides: `openai/gpt-6-astra` ကို source တွင် hard-code လုပ်ထားသည်။ Model availability သို့မဟုတ် actual cost ကို live မစစ်ထားပါ။
- `GEMINI_API_KEY` ရှိလျှင် shared chat helper က direct Gemini fallback လုပ်နိုင်ပြီး ထိုအသုံးစရိတ်သည် ကိုယ်ပိုင် Google account ထဲသို့ ရောက်နိုင်သည်။ Lovable dashboard တစ်ခုတည်းနဲ့ provider အားလုံးကို မတိုင်းတာနိုင်ပါ။
- Role play တစ်ခုမှာ LLM + STT + TTS + final feedback ဖြစ်နိုင်သည်။ UI action တစ်ခု = model request တစ်ခု မဟုတ်ပါ။

## လက်ရှိ app credits သည် subscription မဟုတ်သေးပါ

Committed SQL အရ (live DB တွင် တူ/မတူ အတည်မပြုရသေး):

- Tutor: student 20/day၊ teacher 10/day၊ bonus counts သီးခြား။ Admin/approved scholarship unlimited ဖြစ်နိုင်သည်။ Free daily allowance ကို အရင်သုံးပြီး bonus ကို နောက်မှသုံးသည်။
- Speaking: unit တစ်ခုလျှင် 5 sessions/day၊ session 30-minute expiry၊ turns 20 အများဆုံး။ Teacher/admin/approved scholarship က session count မကန့်သတ်။ Tutor bonus ဝယ်ခြင်းက speaking minutes မဝယ်ပေးပါ။ Unit အလိုက် limit ဖြစ်ပြီး တစ်ဦးလျှင် တစ်နေ့စုစုပေါင်း မိနစ် 30 limit မဟုတ်ပါ။ Session သက်တမ်း 30 မိနစ်ရှိခြင်းသည် 30 မိနစ်စာ AI အသံကြာချိန်တွက်ခြင်း မဟုတ်ပါ။
- Exam generation: student 2/day၊ teacher 4/day၊ admin 1000/day၊ exam bonus သီးခြား။
- Current TopupPanel က manual transfer request → admin approval → count wallet ဖြစ်သည်။ Monthly subscription state၊ expiry၊ renewal၊ speaking wallet မရှိ။
- Fallback display prices 50 tutor counts / 1,000 MMK၊ 150 / 2,500 MMK၊ 5 exams / 1,500 MMK၊ 15 / 4,000 MMK ရှိသည်။ Live settings က အစားထိုးနိုင်သည်။ ဤဈေးများသည် measured AI cost အပေါ်တွက်ထားကြောင်း အထောက်အထား မရှိ။

## Paid plan မဖွင့်မီ လိုအပ်ချက်

1. Grade 11 paid AI routes အားလုံးအတွက် server-owned entitlement/usage checks ထည့်ရန်။ Shared endpoints မှာ caller က grade flag ပြောင်းရုံနဲ့ billing ကျော်မရအောင် စီမံရမည်။ Grade 10 behavior မပြောင်းရေးကို အရင်ဆုံး အတည်ပြုရမည်။
2. Feature အလိုက် message counts၊ speaking minutes၊ writing word limits၊ marking pages တို့ သီးခြားထားရန်။ Tutor count တစ်ခုကို Lovable credit တစ်ခုဟု မပြရန်။
3. Per-user ledger: user/grade/feature/request/session/provider/model၊ STT seconds၊ generated audio duration၊ reported input/output tokens၊ cache hit၊ status နှင့် billing cycle ကို မှတ်တမ်းတင်ရန်။ Provider usage မရသောနေရာကို unknown/estimated ဟု သိမ်းပြီး cost အတုမဖြည့်ရန်။ Raw private conversation/audio ကို shared cache ထဲ မသိမ်းရန်။
4. Atomic reservation → execute → finalize/refund၊ request idempotency နှင့် concurrent-request limits ထည့်ရန်။ App quota မရှိဘဲ provider call မခေါ်ရ။ Failed requests မှ provider charge ကျန်နိုင်ခြင်းကို operator budget တွင် ထည့်တွက်ရန်။
5. Voice allowance ကို server မှ ထိန်းရန်။ Browser timer တစ်ခုတည်းမသုံးရန်။ Page reload၊ multi-tab၊ direct API calls တို့ဖြင့် limit မကျော်နိုင်စေရန်။
6. Monthly plan activation/expiry/renewal နှင့် add-on wallet များ ထည့်ရန်။ Free users အတွက် AI trial ကို budget အတွင်း ကန့်သတ်ရန်။
7. Package ID၊ credits/minutes/price ကို server catalog မှ ဆုံးဖြတ်ရန်။ လက်ရှိ top-up request က browser ပို့သော credits/price ကို သိမ်းပြီး admin approve မှ wallet ထည့်သည်။ Request သည် payment အမှန်ဖြစ်ကြောင်း မဆိုလိုသဖြင့် payment reference၊ approved price နှင့် package ကို server/administrator မှ အတည်ပြုရမည်။
8. Grammar Units 2–12 အသံ ပြန်သုံးမှု တိုးချဲ့ရန်၊ photo marking/background jobs ကို သီးခြား paid allowance သို့မဟုတ် school budget ဖြင့် ထိန်းရန်။ Global alerts/caps သည် per-member Lovable build-credit limits နှင့် မတူပါ။
9. Live speaking migration/login/config ကို အရင်ပြေလည်စေပြီး paid customer flow ကို end-to-end စစ်ရန်။

## အကြံပြု plan ပုံစံ — မထည့်သွင်းရသေးသော နမူနာ

| Plan | အသုံးပြုခွင့် နမူနာ |
|---|---|
| Free | Textbook၊ original audio၊ notes၊ local exercises; ကန့်သတ် AI trial |
| Study | လစဉ် text AI messages 200 + writing checks 20 (word limit ပါ); live speaking မပါ |
| Speaking add-on | လစဉ် AI conversation 300 minutes; တစ်နေ့ 30-minute ceiling |
| Intensive add-on | လစဉ် 900 minutes; တစ်နေ့ 30-minute ceiling; longer calendar months တွင် monthly ceiling ဆက်သက်ရောက် |
| Teacher/School | Exam generation/marking allowances သီးခြား; class background marking သည် ယင်း budget မှ ကုန်ရန် |

ဤ counts များသည် ဆွေးနွေးရန်နမူနာဖြစ်ပြီး လက်ရှိ product entitlement သို့မဟုတ် အတည်ပြုဈေးနှုန်း မဟုတ်ပါ။ Unlimited voice plan မပေးသင့်ပါ။

100 daily users × 30 minutes × 30 days = monthly conversation 90,000 minutes ဖြစ်သည်။ Generated audio minutes၊ STT clip duration၊ conversation tokens တို့နှင့် မတူသဖြင့် API cost ကို conversation time တစ်ခုတည်းနဲ့ မဆုံးဖြတ်နိုင်ပါ။

10 students ကို one 30-minute session စီ၊ text/writing/photo-marking samples များနှင့် စမ်းပြီး feature တစ်ခုချင်း measured costs/latency/failures ကို တိုင်းတာပါ။ စာရှည်/ပုံများသောအလုပ်များ၊ ပြန်ကြိုးစားမှုနှင့် peak concurrency ကိုပါ စစ်ပါ။ Per-user per-feature average နှင့် expensive cases နှစ်မျိုးလုံးဖြင့် limits သတ်မှတ်ပါ။

လစဉ်အနည်းဆုံး net revenue per paying user = (AI + hosting + storage + support + payment fees + operating reserve) / paying users။ Daily active users 100 သည် paying subscribers 100 ဟု မဆိုလိုပါ။ Model costs သည် USD ဖြစ်ပြီး ဈေးကို MMK ဖြင့်ရောင်းမည်ဆိုလျှင် exchange-rate changes ကိုလည်း ထည့်တွက်ပါ။ Profit target ထည့်ပြီးမှ အတည်ဈေးသတ်မှတ်ပါ။

နောက်ဆုံး remote changes ကိုပါ fast-forward sync လုပ်ထားသည်။ `0003_document_speaking_sessions` migration သည် table comment ဖြစ်ပြီး AI quota logic ကို မပြောင်းပါ။ ထိုဖိုင်ရှိခြင်းတစ်ခုတည်းဖြင့် live migration apply ပြီးကြောင်း မအတည်ပြုထားပါ။

## Scope နှင့် နောက်အဆင့်

ဤ report သည် read-only source audit နှင့် plan proposal ဖြစ်သည်။ Subscription/charging implementation မပြောင်းထားပါ။ Live Lovable usage report၊ direct-provider billing၊ target backend schema နှင့် real student sessions မရှိသဖြင့် တကယ့်စရိတ်/အမြတ်ကို အာမမခံပါ။ AI feature လိုအပ်မှုအလိုက် ခွဲပြီး meter စနစ် → paid entitlements → payment activation → rollout ကို ဆက်လုပ်သင့်သည်။
