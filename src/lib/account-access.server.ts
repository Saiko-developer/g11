/** Uses an existing caller-owned RPC, so this guard also works before new migrations apply. */
export async function requireActiveAccount(request: Request): Promise<Response | null> {
  const unavailable = () =>
    Response.json(
      {
        error: "account_service_unavailable",
        message: "အကောင့်အခြေအနေ စစ်ဆေးမရပါ။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။",
      },
      { status: 503 },
    );
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/my_access`, {
      method: "POST",
      signal: request.signal,
      headers: {
        Authorization: request.headers.get("authorization") ?? "",
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (response.status === 401) {
      const detail = (await response.json().catch(() => null)) as {
        message?: string;
        code?: string;
      } | null;
      if (
        /invalid[_ ]api[_ ]key|no api key|missing api key/i.test(
          `${detail?.code ?? ""} ${detail?.message ?? ""}`,
        )
      )
        return unavailable();
      return Response.json(
        { error: "signin", message: "အကောင့်ကို ပြန်အတည်ပြုပါ။" },
        { status: 401 },
      );
    }
    if (!response.ok) return unavailable();
    const access = (await response.json()) as { status?: unknown } | null;
    if (access?.status === "suspended")
      return Response.json(
        {
          error: "account_suspended",
          message: "သင့်အကောင့်ကို ယာယီရပ်ဆိုင်းထားပါသည်။ ဆရာထံ ဆက်သွယ်ပါ။",
        },
        { status: 403 },
      );
    return access?.status === "active" ? null : unavailable();
  } catch {
    return unavailable();
  }
}
