/** Browser cancellation can cross realms or be wrapped as a plain Error by fetch adapters. */
export function isClassroomCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: unknown; code?: unknown; message?: unknown };
  if (value.name === "TimeoutError") return false;
  if (value.name === "AbortError" || value.code === "ABORT_ERR") return true;
  return (
    typeof value.message === "string" &&
    /^(?:AbortError:\s*)?(?:signal is aborted without reason|The operation was aborted|This operation was aborted|The user aborted a request)[.!]?$/i.test(
      value.message.trim(),
    )
  );
}
export const CLASSROOM_PAUSED_NOTICE =
  "အတန်းကို ခဏရပ်ထားပါတယ်။ ပြန်ဆက်သင်မယ် ခလုတ်ကို နှိပ်နိုင်ပါတယ်။";
