/** Environment false is an emergency stop; otherwise an admin can activate bounded live questions. */
export async function classroomLiveEnabled() {
  if (process.env.CLASSROOM_LIVE_AI_ENABLED === "false") return false;
  if (process.env.CLASSROOM_LIVE_AI_ENABLED === "true") return true;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("classroom_live_settings" as never)
    .select("live_enabled")
    .eq("id", true)
    .maybeSingle();
  return !error && (data as { live_enabled?: boolean } | null)?.live_enabled === true;
}
