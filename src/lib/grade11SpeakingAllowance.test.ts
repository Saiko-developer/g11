import { expect, it } from "vitest";
import { speakingSeconds, speakingTime } from "./grade11SpeakingAllowance";
it("uses server time and never adds time on resume or accepts a client clock as authority", () => {
  const received = 1000000;
  expect(speakingSeconds("2026-11-09T00:05:00Z", "2026-11-09T00:00:00Z", received, received)).toBe(
    300,
  );
  expect(speakingSeconds("2026-11-09T00:05:00Z", "2026-11-09T00:04:00Z", received, received)).toBe(
    60,
  );
  expect(
    speakingSeconds("2026-11-09T00:05:00Z", "2026-11-09T00:04:00Z", received, received + 61000),
  ).toBe(0);
  expect(speakingSeconds("bad", "bad", received, received)).toBe(0);
  expect(speakingTime(300)).toBe("5:00");
  expect(speakingTime(9)).toBe("0:09");
});
import { vi } from "vitest";
import {
  notifySpeakingAllowanceChanged,
  onSpeakingAllowanceChanged,
} from "./grade11SpeakingAllowance";
it("refreshes mounted quotas through a document event when cross-tab channels are unavailable", () => {
  const original = window.BroadcastChannel;
  window.BroadcastChannel = undefined as unknown as typeof BroadcastChannel;
  const callback = vi.fn();
  const cleanup = onSpeakingAllowanceChanged(callback);
  notifySpeakingAllowanceChanged();
  expect(callback).toHaveBeenCalledOnce();
  cleanup();
  notifySpeakingAllowanceChanged();
  expect(callback).toHaveBeenCalledOnce();
  window.BroadcastChannel = original;
});
