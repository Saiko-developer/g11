import { afterEach, expect, it, vi } from "vitest";
import { popupStreamError, popupThinkingOptions } from "./popup-tutor.server";
afterEach(() => vi.unstubAllEnvs());
it("keeps Gemini 3 thinking brief without applying unsupported settings to older models", () => {
  vi.stubEnv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash");
  expect(popupThinkingOptions()).toEqual({
    google: { thinkingConfig: { thinkingLevel: "low", includeThoughts: false } },
  });
  vi.stubEnv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash");
  expect(popupThinkingOptions()).toBeUndefined();
});
it("shows an honest service error without exposing billing payloads or pretending the teacher is ill", () => {
  const message = popupStreamError(new Error("402 secret provider payload"));
  expect(message).toContain("ချိတ်ဆက်မရ");
  expect(message).not.toMatch(/secret|credits|မသာ/);
  expect(popupStreamError(new DOMException("deadline", "TimeoutError"))).toContain("အချိန်မီ");
});
