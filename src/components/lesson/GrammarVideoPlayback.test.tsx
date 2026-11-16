import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SyncedVideoPlayer } from "./SyncedVideoPlayer";
import { GrammarVideos } from "./GrammarVideos";
vi.mock("@/data/unitVideos", () => ({
  UNIT_VIDEOS: { 99: [{ id: "abcdefghijk", title: "Grammar test" }] },
}));
afterEach(() => {
  cleanup();
  delete window.YT;
});
it("keeps the Grade 10 synchronized player paused on initial load", async () => {
  const play = vi.fn();
  const pause = vi.fn();
  let options: {
    playerVars: { autoplay: number };
    events: { onReady(event: { target: { pauseVideo(): void } }): void };
  };
  window.YT = {
    Player: class {
      constructor(_el: HTMLElement, opts: unknown) {
        options = opts as typeof options;
      }
      getCurrentTime() {
        return 0;
      }
      seekTo() {}
      playVideo = play;
      pauseVideo = pause;
      destroy() {}
    },
  };
  render(<SyncedVideoPlayer youtubeId="abcdefghijk" title="Grammar test" subtitles={[]} />);
  await act(async () => {});
  expect(options!.playerVars.autoplay).toBe(0);
  act(() => options.events.onReady({ target: { pauseVideo: pause } }));
  expect(pause).toHaveBeenCalledTimes(1);
  expect(play).not.toHaveBeenCalled();
});
it("disables autoplay for the Grade 10 plain-iframe fallback", () => {
  const { container } = render(<GrammarVideos unit={99} />);
  const url = new URL(container.querySelector("iframe")!.src);
  expect(url.searchParams.get("autoplay")).toBe("0");
});
