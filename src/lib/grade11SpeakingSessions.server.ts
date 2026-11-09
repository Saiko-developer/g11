import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { z } from "zod";
const result = z.object({ ok: z.boolean() }).passthrough();
function db(request: Request) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient<Database>(process.env.SUPABASE_URL ?? "", key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: request.headers.get("authorization") ?? "", apikey: key } },
  });
}
export function grade11SpeakingFailure(reason: string) {
  const failures: Record<string, [number, string]> = {
    signin: [401, "AI စကားပြောရန် အကောင့်ကို ပြန်အတည်ပြုပါ။"],
    suspended: [403, "သင့်အကောင့်ကို ယာယီရပ်ဆိုင်းထားပါသည်။ ဆရာထံ ဆက်သွယ်ပါ။"],
    unit_limit: [429, "ဒီ Unit အတွက် ယနေ့ စကားပြောခွင့် ၂ ကြိမ် ပြည့်သွားပါပြီ။"],
    daily_unit_limit: [
      429,
      "ယနေ့အတွက် Unit ၂ ခု ရွေးချယ်လေ့ကျင့်ပြီးပါပြီ။ ရွေးထားသော Unit များမှာ ဆက်လေ့ကျင့်နိုင်ပါတယ်။",
    ],
    active_session: [
      409,
      "အခြားစကားပြောမှုတစ်ခုမှာ အချိန်ကျန်နေပါသည်။ အရင်စကားပြောမှုကို ဆက်လေ့ကျင့်ပါ သို့မဟုတ် အဆုံးသတ်ပါ။",
    ],
    busy: [409, "အခြားတောင်းဆိုမှုတစ်ခုကို ဆောင်ရွက်နေပါသည်။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။"],
    stale: [409, "စကားပြောအချက်အလက် ပြောင်းသွားပါပြီ။ မူလစကားပြောမှုကို ပြန်ဆက်ပါ။"],
    retry: [409, "ချိတ်ဆက်မှု မပြီးဆုံးပါ။ မူလစကားပြောမှုကို ပြန်စမ်းနိုင်ပါတယ်။"],
    expired: [410, "စကားပြောချိန် ၅ မိနစ် ပြည့်သွားပါပြီ။ လက်ကျန်အကြိမ်ရှိလျှင် အသစ်စနိုင်ပါတယ်။"],
    no_session: [410, "မူလစကားပြောမှု မရှိတော့ပါ။ အသစ် ပြန်စပါ။"],
    daily_request_limit: [
      429,
      "ယနေ့ စကားပြောတောင်းဆိုမှု ကန့်သတ်ချက် ပြည့်ပါပြီ။ မနက်ဖြန် ပြန်စမ်းပါ။",
    ],
    rate_limit: [429, "တောင်းဆိုမှု များလွန်းနေပါသည်။ တစ်မိနစ်ခန့် စောင့်ပြီး ပြန်စမ်းပါ။"],
    invalid: [400, "စကားပြောတောင်းဆိုမှု မမှန်ပါ။ စာမျက်နှာကို ပြန်ဖွင့်ပြီး စမ်းပါ။"],
  };
  const [status, message] = failures[reason] ?? [
    503,
    "Grade 11 စကားပြောစနစ် ပြင်ဆင်ရန် လိုနေပါသည်။ ဆရာထံ အကြောင်းကြားပါ။",
  ];
  return Response.json({ error: reason, message }, { status });
}
async function decode(task: () => PromiseLike<{ data: unknown; error: { code?: string } | null }>) {
  try {
    const { data, error } = await task();
    if (error) {
      console.error("[grade11-speaking] database error", { code: error.code });
      return grade11SpeakingFailure("speaking_setup_required");
    }
    const parsed = result.safeParse(data);
    if (!parsed.success) return grade11SpeakingFailure("speaking_setup_required");
    return parsed.data.ok
      ? parsed.data
      : grade11SpeakingFailure(
          typeof parsed.data.reason === "string" ? parsed.data.reason : "speaking_setup_required",
        );
  } catch {
    return grade11SpeakingFailure("speaking_setup_required");
  }
}
export function prepareGrade11Speaking(
  request: Request,
  body: { unit: number; exercise?: string; session?: string; revision?: number; finish?: boolean },
  requestId: string,
  claim: string,
) {
  return decode(() =>
    db(request).rpc("grade11_speaking_prepare", {
      p_unit: body.unit,
      p_exercise: body.exercise ?? null,
      p_session: body.session ?? null,
      p_request: requestId,
      p_claim: claim,
      p_operation: body.finish ? "finish" : body.session ? "turn" : "open",
      p_revision: body.revision ?? null,
    }),
  );
}
export function completeGrade11Speaking(
  request: Request,
  requestId: string,
  claim: string,
  success: boolean,
  reply: unknown,
  history: unknown,
) {
  return decode(() =>
    db(request).rpc("grade11_speaking_complete", {
      p_request: requestId,
      p_claim: claim,
      p_success: success,
      p_reply: reply as Json,
      p_history: history as Json,
    }),
  );
}
export function endGrade11Speaking(request: Request, session: string) {
  return decode(() => db(request).rpc("grade11_speaking_end", { p_session: session }));
}
export function validateGrade11Speaking(request: Request, session: string, unit: number) {
  if (
    !z.string().uuid().safeParse(session).success ||
    !Number.isInteger(unit) ||
    unit < 1 ||
    unit > 12
  )
    return Promise.resolve(grade11SpeakingFailure("invalid"));
  return decode(() =>
    db(request).rpc("grade11_speaking_validate", { p_session: session, p_unit: unit }),
  );
}
