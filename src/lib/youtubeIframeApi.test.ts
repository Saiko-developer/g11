import { afterEach, beforeEach, expect, it, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  delete window.YT;
  delete window.onYouTubeIframeAPIReady;
  document
    .querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')
    .forEach((s) => s.remove());
});
afterEach(() => {
  vi.useRealTimers();
  delete window.YT;
  delete window.onYouTubeIframeAPIReady;
});
it("shares one script and preserves another player's ready callback", async () => {
  const { loadYouTubeIframeApi } = await import("./youtubeIframeApi");
  const previous = vi.fn();
  window.onYouTubeIframeAPIReady = previous;
  const first = loadYouTubeIframeApi();
  const second = loadYouTubeIframeApi();
  expect(first).toBe(second);
  expect(
    document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]'),
  ).toHaveLength(1);
  window.YT = {
    Player: class {
      getCurrentTime() {
        return 0;
      }
      seekTo() {}
      playVideo() {}
      destroy() {}
    },
  };
  window.onYouTubeIframeAPIReady?.();
  await expect(first).resolves.toBe(window.YT);
  expect(previous).toHaveBeenCalledTimes(1);
  expect(window.onYouTubeIframeAPIReady).toBe(previous);
  expect(vi.getTimerCount()).toBe(0);
});
it("cleans up a timed-out load and allows a fresh retry", async () => {
  const { loadYouTubeIframeApi } = await import("./youtubeIframeApi");
  const first = loadYouTubeIframeApi();
  const check = expect(first).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(15000);
  await check;
  expect(
    document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]'),
  ).toHaveLength(0);
  const retry = loadYouTubeIframeApi();
  const failure = expect(retry).rejects.toThrow("could not load");
  document
    .querySelector('script[src="https://www.youtube.com/iframe_api"]')
    ?.dispatchEvent(new Event("error"));
  await failure;
  expect(vi.getTimerCount()).toBe(0);
});
