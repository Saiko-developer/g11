/** Provider configuration is independent from student credit/quota authorization. */
export const hasAiProvider = () =>
  !!(process.env.LOVABLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim());
export const providerUnavailable = () =>
  Response.json(
    {
      error: "ai_provider_unavailable",
      message:
        "AI ဝန်ဆောင်မှုကို ယခု ချိတ်ဆက်မရပါ။ ခဏနေ ပြန်စမ်းပါ သို့မဟုတ် Admin ထံ အကြောင်းကြားပါ။",
    },
    { status: 503 },
  );

export function providerFailure(): Error & { statusCode: number; code: string } {
  return Object.assign(
    new Error("AI provider unavailable. Please try again later or contact the administrator."),
    { statusCode: 503, code: "ai_provider_unavailable" },
  );
}
