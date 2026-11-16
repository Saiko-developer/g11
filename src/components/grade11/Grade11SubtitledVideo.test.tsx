import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Grade11SubtitledVideo } from "./Grade11SubtitledVideo";
const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/lib/youtubeIframeApi", () => ({ loadYouTubeIframeApi: mocks.load }));
let time = 0;
let duration = 0;
let options: { playerVars: Record<string, number>; events: { onReady(): void; onError(): void } };
const seek = vi.fn();
const play = vi.fn();
const pause = vi.fn();
const destroy = vi.fn();
const cues = [
  { start: 30, end: 38, en: "First", my: "ပထမစာတန်း" },
  { start: 40, end: 45, en: "Second", my: "ဒုတိယစာတန်း" },
  { start: 46, end: 60, en: "Third", my: "တတိယစာတန်း" },
];
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  time = 0;
  duration = 0;
  mocks.load.mockResolvedValue({
    Player: class {
      constructor(_el: HTMLElement, opts: typeof options) {
        options = opts;
      }
      getCurrentTime() {
        return time;
      }
      getDuration() {
        return duration;
      }
      seekTo = seek;
      playVideo = play;
      pauseVideo = pause;
      destroy = destroy;
    },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function setup() {
  const view = render(
    <Grade11SubtitledVideo
      videoId="abcdefghijk"
      title="Test"
      subtitles={cues}
      start={34}
      end={50}
    />,
  );
  await act(async () => {});
  act(() => options.events.onReady());
  return view;
}
function clock(seconds: number) {
  act(() => {
    time = seconds;
    vi.advanceTimersByTime(100);
  });
}
it("uses source time without synthetic subtitle delay; handles pause, gaps, backwards seeks and end", async () => {
  await setup();
  expect(options.playerVars).toMatchObject({ start: 34, end: 50 });
  expect(seek).toHaveBeenCalledWith(34, true);
  expect(play).not.toHaveBeenCalled();
  const caption = screen.getByRole("status", { name: "Myanmar video subtitle" });
  clock(34);
  expect(within(caption).getByText("ပထမစာတန်း")).toBeVisible();
  act(() => vi.advanceTimersByTime(5000));
  expect(within(caption).getByText("ပထမစာတန်း")).toBeVisible(); // paused: source clock stays still
  clock(38);
  expect(within(caption).queryByText("ပထမစာတန်း")).toBeNull();
  clock(40);
  expect(within(caption).getByText("ဒုတိယစာတန်း")).toBeVisible();
  clock(35);
  expect(within(caption).getByText("ပထမစာတန်း")).toBeVisible();
  clock(50);
  expect(pause).toHaveBeenCalled();
  expect(within(caption).queryByText("တတိယစာတန်း")).toBeNull();
});
it("keeps transcript times absolute and waits for actual playback clock after a transcript seek", async () => {
  await setup();
  fireEvent.click(screen.getByRole("button", { name: "စာသားအပြည့် ကြည့်မယ်" }));
  const transcript = screen.getByRole("list", { name: "Myanmar video transcript" });
  expect(within(transcript).getByText("0:34")).toBeVisible();
  fireEvent.click(within(transcript).getByRole("button", { name: /0:40/ }));
  expect(seek).toHaveBeenLastCalledWith(40, true);
  expect(play).toHaveBeenCalledTimes(1);
  expect(
    within(screen.getByRole("status", { name: "Myanmar video subtitle" })).queryByText(
      "ဒုတိယစာတန်း",
    ),
  ).toBeNull();
  clock(40);
  expect(
    within(screen.getByRole("status", { name: "Myanmar video subtitle" })).getByText("ဒုတိယစာတန်း"),
  ).toBeVisible();
});
it("destroys the previous player and prevents old callbacks from affecting a new topic", async () => {
  const view = await setup();
  const oldReady = options.events.onReady;
  view.unmount();
  expect(destroy).toHaveBeenCalledTimes(1);
  act(() => oldReady());
  expect(vi.getTimerCount()).toBe(0);
});
it("allows captions to be hidden and restores the current cue when enabled", async () => {
  await setup();
  clock(40);
  fireEvent.click(screen.getByRole("button", { name: "မြန်မာစာတန်း ပိတ်မယ်" }));
  expect(screen.queryByText("ဒုတိယစာတန်း")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "မြန်မာစာတန်း ဖွင့်မယ်" }));
  expect(screen.getByText("ဒုတိယစာတန်း")).toBeVisible();
});
it("shows a recoverable connection failure without keeping a misleading old caption", async () => {
  await setup();
  clock(34);
  act(() => options.events.onError());
  expect(screen.queryByText("ပထမစာတန်း")).toBeNull();
  expect(screen.getByRole("button", { name: "ပြန်ချိတ်မယ်" })).toBeVisible();
  act(() => options.events.onReady());
  expect(vi.getTimerCount()).toBe(0);
});

it("bounds an otherwise untimed final cue only with the actual video duration", async () => {
  render(
    <Grade11SubtitledVideo
      videoId="abcdefghijk"
      title="Tail test"
      subtitles={cues.slice(0, 2)}
      start={34}
      untimedTail={{ start: 50, en: "Goodbye", my: "နောက်မှတွေ့မယ်" }}
    />,
  );
  await act(async () => {});
  act(() => options.events.onReady());
  clock(50);
  expect(screen.queryByText("နောက်မှတွေ့မယ်")).toBeNull(); // Metadata absent: do not invent an end.
  duration = 60;
  clock(50);
  expect(screen.getByText("နောက်မှတွေ့မယ်")).toBeVisible();
  clock(60);
  expect(screen.queryByText("နောက်မှတွေ့မယ်")).toBeNull();
});
