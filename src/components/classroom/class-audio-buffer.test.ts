import { expect, it, vi } from "vitest";
import { createClassAudioBuffer } from "./class-audio-buffer";
it("warms the entire assigned class with two workers and reuses completed preparation", async () => {
  let active = 0,
    peak = 0;
  const warm = vi.fn(async (_cursor: number, _signal: AbortSignal) => {
    peak = Math.max(peak, ++active);
    await Promise.resolve();
    active--;
  });
  const load = vi.fn(async () => new Blob(["audio"]));
  const buffer = createClassAudioBuffer({ start: 16, end: 32, warm, load });
  const progress = vi.fn();
  await buffer.prepare(new AbortController().signal, progress);
  expect(peak).toBe(2);
  expect(warm).toHaveBeenCalledTimes(16);
  expect(warm.mock.calls.map((args) => args[0])).toEqual(
    Array.from({ length: 16 }, (_, i) => i + 16),
  );
  expect(progress).toHaveBeenLastCalledWith(16, 16);
  expect(buffer.isPrepared()).toBe(true);
  expect(load).not.toHaveBeenCalled();
  await buffer.prepare(new AbortController().signal, progress);
  expect(warm).toHaveBeenCalledTimes(16);
  buffer.dispose();
});
it("downloads ahead, reuses the next clip and never fetches tomorrow's class", async () => {
  const load = vi.fn(async (cursor: number, _signal: AbortSignal) => new Blob([String(cursor)]));
  const buffer = createClassAudioBuffer({ start: 0, end: 16, warm: async () => {}, load });
  await buffer.playback(0);
  expect(load.mock.calls.map((args) => args[0])).toEqual([0, 1, 2, 3]);
  await buffer.playback(1);
  await buffer.playback(1);
  expect(load.mock.calls.filter((args) => args[0] === 1)).toHaveLength(1);
  await buffer.playback(15);
  expect(load.mock.calls.some((args) => args[0] >= 16)).toBe(false);
  buffer.dispose();
  expect(load.mock.calls[0][1].aborted).toBe(true);
  await expect(buffer.playback(15)).rejects.toThrow();
});
it("Pause stops preparation from scheduling further requests", async () => {
  const controller = new AbortController();
  const warm = vi.fn(async () => {
    controller.abort(new Error("Paused"));
  });
  const buffer = createClassAudioBuffer({ start: 0, end: 16, warm, load: async () => new Blob() });
  await expect(buffer.prepare(controller.signal, () => {})).rejects.toThrow("Paused");
  expect(warm).toHaveBeenCalledTimes(1);
  expect(buffer.isPrepared()).toBe(false);
  buffer.dispose();
});
it("a failed preparation is not silently skipped or marked ready", async () => {
  const buffer = createClassAudioBuffer({
    start: 0,
    end: 16,
    warm: async () => {
      throw new Error("Provider unavailable");
    },
    load: async () => new Blob(),
  });
  await expect(buffer.prepare(new AbortController().signal, () => {})).rejects.toThrow(
    "Provider unavailable",
  );
  expect(buffer.isPrepared()).toBe(false);
  buffer.dispose();
});
