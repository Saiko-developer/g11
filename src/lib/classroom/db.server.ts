import { createClient } from "@supabase/supabase-js";
export function classroomUserDb(request: Request) {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(process.env.SUPABASE_URL ?? "", key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: request.headers.get("authorization") ?? "", apikey: key } },
  });
}
export const classroomUnavailable = () =>
  Response.json(
    {
      error: "classroom_unavailable",
      message: "အတန်းစနစ် ပြင်ဆင်ရန် လိုနေပါသည်။ ဆရာထံ အကြောင်းကြားပါ။",
    },
    { status: 503 },
  );
export async function classroomAdmin(request: Request) {
  const { data, error } = await classroomUserDb(request).rpc("my_access");
  return !error && data?.is_admin === true;
}
