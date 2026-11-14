import { expect, it, vi } from "vitest";
import { createClassAudioBuffer } from "./class-audio-buffer";
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
it("starts once the first half is contiguous, while the last clip is still pending", async () => {
  const release = new Map<number, () => void>();
  let active = 0,
    peak = 0;
  const warm = vi.fn(
    (cursor: number) =>
      new Promise<void>((resolve) => {
        peak = Math.max(peak, ++active);
        release.set(cursor, () => {
          active--;
          resolve();
        });
      }),
  );
  const buffer = createClassAudioBuffer({
    start: 0,
    end: 16,
    warm,
    load: async () => new Blob(["audio"]),
  });
  const progress = vi.fn();
  let started = false;
  const opening = buffer.prepare(new AbortController().signal, progress).then(() => {
    started = true;
  });
  for (let i = 0; i < 7; i++) {
    release.get(i)!();
    await flush();
  }
  expect(started).toBe(false);
  release.get(7)!();
  await opening;
  expect(buffer.canPlay(0)).toBe(true);
  expect(buffer.isPrepared()).toBe(false);
  expect(peak).toBe(2);
  for (let i = 8; i < 15; i++) {
    await flush();
    release.get(i)!();
  }
  await flush();
  expect(progress).toHaveBeenLastCalledWith(15, 16);
  await buffer.prepare(new AbortController().signal, progress, 1);
  expect(buffer.canPlay(1)).toBe(true);
  release.get(15)!();
  await flush();
  expect(buffer.isPrepared()).toBe(true);
  buffer.dispose();
});
it("does not confuse any eight ready clips with the first eight playable clips", async () => {
  let releaseFirst: (() => void) | undefined;
  const buffer = createClassAudioBuffer({
    start: 0,
    end: 16,
    warm: async (cursor) => {
      if (cursor === 0)
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
    },
    load: async () => new Blob(),
  });
  let started = false;
  const first = buffer
    .prepare(new AbortController().signal, () => {})
    .then(() => {
      started = true;
    });
  await flush();
  expect(started).toBe(false);
  releaseFirst!();
  await first;
  expect(started).toBe(true);
  buffer.dispose();
});
it("keeps two workers, warms the remaining clips and reuses preparation", async () => {
  let active = 0,
    peak = 0;
  const warm = vi.fn(async () => {
    peak = Math.max(peak, ++active);
    await Promise.resolve();
    active--;
  });
  const load = vi.fn(async () => new Blob(["audio"]));
  const buffer = createClassAudioBuffer({ start: 16, end: 32, warm, load });
  const progress = vi.fn();
  await buffer.prepare(new AbortController().signal, progress);
  await flush();
  expect(peak).toBe(2);
  expect(warm).toHaveBeenCalledTimes(16);
  expect(buffer.isPrepared()).toBe(true);
  expect(load).not.toHaveBeenCalled();
  await buffer.prepare(new AbortController().signal, progress);
  expect(warm).toHaveBeenCalledTimes(16);
  buffer.dispose();
});
it("downloads only prepared clips ahead, reuses blobs and respects the class boundary", async () => {
  const load = vi.fn(async (cursor: number) => new Blob([String(cursor)]));
  const buffer = createClassAudioBuffer({ start: 0, end: 16, warm: async () => {}, load });
  await buffer.prepare(new AbortController().signal, () => {});
  await flush();
  await buffer.playback(0);
  expect(load.mock.calls.map((args) => args[0])).toEqual([0, 1, 2, 3]);
  await buffer.playback(1);
  await buffer.playback(1);
  expect(load.mock.calls.filter((args) => args[0] === 1)).toHaveLength(1);
  await buffer.playback(15);
  expect(load.mock.calls.some((args) => args[0] >= 16)).toBe(false);
  buffer.dispose();
  await expect(buffer.playback(15)).rejects.toThrow();
});
it("Pause before the halfway point stops scheduling and cannot cause late playback", async () => {
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
it("a tail preparation failure does not stop already-ready teaching, but never marks the failed clip ready", async () => {
  const buffer = createClassAudioBuffer({
    start: 0,
    end: 16,
    warm: async (cursor) => {
      if (cursor === 15) throw new Error("Provider unavailable");
    },
    load: async () => new Blob(),
  });
  await buffer.prepare(new AbortController().signal, () => {});
  await flush();
  await expect(buffer.prepare(new AbortController().signal, () => {}, 1)).resolves.toBeUndefined();
  await expect(buffer.prepare(new AbortController().signal, () => {}, 15)).rejects.toThrow(
    "Provider unavailable",
  );
  expect(buffer.isPrepared()).toBe(false);
  buffer.dispose();
});
it("fails startup promptly if the first half cannot be prepared", async () => {
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
  buffer.dispose();
});
