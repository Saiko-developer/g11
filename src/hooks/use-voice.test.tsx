import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: m.error } }));
import { useSpeechSynthesis } from "./use-voice";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it("cancels an in-flight speech request on stop without an error toast", async () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init?.signal as AbortSignal;
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Cancelled", "AbortError")),
            { once: true },
          );
        }),
    ),
  );
  const hook = renderHook(() => useSpeechSynthesis());
  let pending: Promise<void>;
  act(() => {
    pending = hook.result.current.speak("Hello");
  });
  expect(signal?.aborted).toBe(false);
  act(() => hook.result.current.stop());
  await act(async () => {
    await pending!;
  });
  expect(signal?.aborted).toBe(true);
  expect(m.error).not.toHaveBeenCalled();
  expect(hook.result.current.speaking).toBe(false);
});
it("does not tell students to buy credits for a legacy provider 402", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("provider credits", { status: 402 })),
  );
  const hook = renderHook(() => useSpeechSynthesis());
  await act(async () => {
    await hook.result.current.speak("Hello");
  });
  await waitFor(() => expect(m.error).toHaveBeenCalled());
  expect(JSON.stringify(m.error.mock.calls)).not.toMatch(/ကုန်ဆုံး|ထပ်မံဖြည့်/);
});
