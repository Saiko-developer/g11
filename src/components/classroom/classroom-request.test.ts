import { afterEach, expect, it, vi } from "vitest";
import { classroomRequest } from "./useClassroom";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("waits for another worker's clip and never treats a pending JSON response as audio", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ pending: true }, { status: 202 }))
      .mockResolvedValueOnce(new Response("wave", { headers: { "Content-Type": "audio/wav" } })),
  );
  const pending = classroomRequest(10, { action: "audio", cursor: 0 });
  await vi.advanceTimersByTimeAsync(2000);
  expect((await pending).headers.get("Content-Type")).toBe("audio/wav");
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("Pause cancels the wait instead of polling forever", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ pending: true }, { status: 202 })),
  );
  const controller = new AbortController();
  const pending = classroomRequest(10, { action: "audio", cursor: 0 }, controller.signal);
  const rejected = expect(pending).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(1);
  controller.abort();
  await rejected;
  await vi.advanceTimersByTimeAsync(10000);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("stops pending playback after two minutes with a useful message", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ pending: true }, { status: 202 })),
  );
  const pending = classroomRequest(10, { action: "audio", cursor: 0 });
  const rejected = expect(pending).rejects.toThrow("ခဏနားပြီး ပြန်စမ်းပါ");
  await vi.advanceTimersByTimeAsync(120000);
  await rejected;
  const calls = vi.mocked(fetch).mock.calls.length;
  await vi.advanceTimersByTimeAsync(10000);
  expect(fetch).toHaveBeenCalledTimes(calls);
});
