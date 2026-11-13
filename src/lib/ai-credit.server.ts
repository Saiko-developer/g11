import { requireUser } from "./api-guard.server";

export const creditGuardEnabled = () => process.env.AI_CREDIT_GUARD_ENABLED === "true";
export type CreditOperation = "tutor" | "check" | "generate" | "speech" | "classroom";
const unavailable = () =>
  Response.json(
    { error: "credit_service_unavailable", message: "Credit စစ်ဆေးမရပါ။ ခဏနေ ပြန်စမ်းပါ။" },
    { status: 503 },
  );

/** Server-only reservation and settlement; browsers cannot mint refunds or alter balances. */
export async function withAiCredit(
  request: Request,
  operation: CreditOperation,
  run: () => Promise<Response>,
  required = false,
): Promise<Response> {
  if (!required && !creditGuardEnabled()) return run();
  const auth = await requireUser(request, { enforceAccountStatus: true });
  if (auth instanceof Response) return auth;
  const requestId = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))
    return Response.json({ error: "invalid_request_id" }, { status: 400 });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let reserved: { ok: boolean; reason?: string };
  try {
    const { data, error } = await supabaseAdmin.rpc(
      "reserve_ai_credit" as never,
      {
        p_user: auth.userId,
        p_request: requestId,
        p_operation: operation,
      } as never,
    );
    if (error || !data) return unavailable();
    reserved = data as typeof reserved;
  } catch {
    return unavailable();
  }
  if (!reserved.ok)
    return Response.json(
      {
        error: reserved.reason,
        message:
          "AI မေးခွင့် ကန့်သတ်ချက် ပြည့်သွားပါပြီ သို့မဟုတ် မူလတောင်းဆိုမှုကို ဆောင်ရွက်ပြီးပါပြီ။",
      },
      { status: reserved.reason === "duplicate" ? 409 : 429 },
    );
  let settled = false;
  const settle = async (success: boolean) => {
    if (settled) return;
    settled = true;
    try {
      const { error } = await supabaseAdmin.rpc(
        "settle_ai_credit" as never,
        {
          p_user: auth.userId,
          p_request: requestId,
          p_success: success,
        } as never,
      );
      if (error) console.error("[ai-credit] settlement pending", { requestId, code: error.code });
    } catch {
      console.error("[ai-credit] settlement pending", { requestId });
    }
  };
  try {
    const response = await run();
    if (!response.ok) {
      await settle(false);
      return response;
    }
    if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
      await settle(true);
      return response;
    }
    // AI SDK can report errors in an HTTP-200 SSE stream. Inspect bounded individual lines.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let tail = "";
    let failed = false;
    let deliveredText = false;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            await settle(cancelled ? deliveredText && !failed : !failed);
            controller.close();
            return;
          }
          tail += decoder.decode(value, { stream: true });
          const lines = tail.split("\n");
          tail = lines.pop()!.slice(-8192);
          for (const line of lines) {
            if (/"type"\s*:\s*"error"/.test(line)) failed = true;
            if (/"type"\s*:\s*"text-delta"/.test(line)) deliveredText = true;
          }
          controller.enqueue(value);
        } catch (error) {
          await settle(false);
          controller.error(error);
        }
      },
      async cancel(reason) {
        cancelled = true;
        try {
          await reader.cancel(reason);
        } finally {
          await settle(deliveredText && !failed);
        }
      },
    });
    return new Response(body, { status: response.status, headers: response.headers });
  } catch (error) {
    await settle(false);
    console.error("[ai-credit] request failed", {
      requestId,
      kind: error instanceof Error ? error.name : "unknown",
    });
    return Response.json(
      {
        error: "ai_unavailable",
        message: "AI မဖြေနိုင်သေးပါ။ မေးခွင့် ပြန်လွှတ်ခြင်းကို ဆောင်ရွက်ပေးနေပါသည်။",
      },
      { status: 503 },
    );
  }
}
