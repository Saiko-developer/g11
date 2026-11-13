type Options = {
  start: number;
  end: number;
  warm: (cursor: number, signal: AbortSignal) => Promise<void>;
  load: (cursor: number, signal: AbortSignal) => Promise<Blob>;
};
/** Shared server cache is warmed first; only a small rolling window lives in browser memory. */
export function createClassAudioBuffer({ start, end, warm, load }: Options) {
  const prepared = new Set<number>();
  const clips = new Map<number, Promise<Blob>>();
  const lifetime = new AbortController();
  let primed = false;
  const inRange = (cursor: number) => cursor >= start && cursor < end;
  function get(cursor: number) {
    if (!inRange(cursor)) return Promise.reject(new Error("Clip outside assigned class"));
    if (lifetime.signal.aborted) return Promise.reject(lifetime.signal.reason);
    const cached = clips.get(cursor);
    if (cached) return cached;
    const pending = load(cursor, lifetime.signal).catch((error) => {
      if (clips.get(cursor) === pending) clips.delete(cursor);
      throw error;
    });
    clips.set(cursor, pending);
    return pending;
  }
  function prefetch(cursor: number) {
    for (const key of clips.keys()) if (key < cursor - 1 || key > cursor + 3) clips.delete(key);
    for (let next = cursor; next < Math.min(end, cursor + 4); next++)
      void get(next).catch(() => {});
  }
  return {
    isPrepared: () => prepared.size === end - start,
    async prepare(signal: AbortSignal, onProgress: (ready: number, total: number) => void) {
      let cursor = start;
      let failed = false;
      onProgress(prepared.size, end - start);
      const worker = async () => {
        while (cursor < end && !failed) {
          if (signal.aborted || lifetime.signal.aborted)
            throw signal.reason ?? lifetime.signal.reason;
          const next = cursor++;
          if (prepared.has(next)) continue;
          try {
            await warm(next, signal);
            if (signal.aborted || lifetime.signal.aborted)
              throw signal.reason ?? lifetime.signal.reason;
            prepared.add(next);
            onProgress(prepared.size, end - start);
          } catch (error) {
            failed = true;
            throw error;
          }
        }
      };
      await Promise.all([worker(), worker()]);
    },
    async playback(cursor: number) {
      prefetch(cursor);
      const current = get(cursor);
      if (!primed) {
        await Promise.all([current, ...(inRange(cursor + 1) ? [get(cursor + 1)] : [])]);
        primed = true;
      }
      return current;
    },
    dispose() {
      lifetime.abort();
      clips.clear();
    },
  };
}
