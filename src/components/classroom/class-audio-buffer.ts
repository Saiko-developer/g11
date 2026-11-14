type Options = {
  start: number;
  end: number;
  warm: (cursor: number, signal: AbortSignal) => Promise<void>;
  load: (cursor: number, signal: AbortSignal) => Promise<Blob>;
};
/** Start after a contiguous half is ready; two workers finish the rest while the teacher speaks. */
export function createClassAudioBuffer({ start, end, warm, load }: Options) {
  const prepared = new Set<number>();
  const clips = new Map<number, Promise<Blob>>();
  const lifetime = new AbortController();
  const changes = new Set<() => void>();
  let warming: AbortController | null = null;
  let preparationError: unknown = null;
  let onProgress = (_ready: number, _total: number) => {};
  let started = false;
  let primed = false;
  const inRange = (cursor: number) => cursor >= start && cursor < end;
  const notify = () => {
    onProgress(prepared.size, end - start);
    for (const changed of changes) changed();
  };
  function stopPreparation() {
    warming?.abort();
    warming = null;
    for (const changed of changes) changed();
  }
  function startPreparation(from: number) {
    if (warming?.signal.aborted) warming = null;
    if (warming || preparationError || prepared.size === end - start) return;
    const task = new AbortController();
    warming = task;
    const signal = AbortSignal.any([task.signal, lifetime.signal]);
    const queue = [
      ...Array.from({ length: end - from }, (_, i) => i + from),
      ...Array.from({ length: from - start }, (_, i) => i + start),
    ].filter((i) => !prepared.has(i));
    let next = 0;
    const worker = async () => {
      while (next < queue.length && !signal.aborted) {
        const cursor = queue[next++];
        try {
          await warm(cursor, signal);
          if (signal.aborted) return;
          prepared.add(cursor);
          notify();
        } catch (error) {
          if (!signal.aborted) {
            preparationError = error;
            task.abort();
            notify();
          }
          return;
        }
      }
    };
    void Promise.all([worker(), worker()]).finally(() => {
      if (warming === task) warming = null;
      for (const changed of changes) changed();
    });
  }
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
    for (let next = cursor; next < Math.min(end, cursor + 4); next++) {
      // Downloads never race the warm workers into a second generation request.
      if (prepared.has(next)) void get(next).catch(() => {});
    }
  }
  return {
    isPrepared: () => prepared.size === end - start,
    canPlay: (cursor: number) => started && prepared.has(cursor),
    pausePreparation: stopPreparation,
    retryPreparation: (from = start) => {
      preparationError = null;
      if (started) startPreparation(from);
    },
    async prepare(
      signal: AbortSignal,
      progress: (ready: number, total: number) => void,
      from = start,
    ) {
      if (!inRange(from)) throw new Error("Clip outside assigned class");
      if (signal.aborted || lifetime.signal.aborted) throw signal.reason ?? lifetime.signal.reason;
      onProgress = progress;
      onProgress(prepared.size, end - start);
      const targetEnd = started ? from + 1 : from + Math.ceil((end - from) / 2);
      const usable = () =>
        Array.from({ length: targetEnd - from }, (_, i) => i + from).every((i) => prepared.has(i));
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          changes.delete(check);
          signal.removeEventListener("abort", abort);
          lifetime.signal.removeEventListener("abort", abort);
        };
        const abort = () => {
          cleanup();
          stopPreparation();
          reject(signal.reason ?? lifetime.signal.reason);
        };
        const check = () => {
          if (usable()) {
            started = true;
            cleanup();
            resolve();
          } else if (preparationError) {
            cleanup();
            reject(preparationError);
          }
        };
        changes.add(check);
        signal.addEventListener("abort", abort, { once: true });
        lifetime.signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted || lifetime.signal.aborted) abort();
        else {
          startPreparation(from);
          check();
        }
      });
    },
    async playback(cursor: number) {
      prefetch(cursor);
      const current = get(cursor);
      if (!primed) {
        await Promise.all([
          current,
          ...(inRange(cursor + 1) && prepared.has(cursor + 1) ? [get(cursor + 1)] : []),
        ]);
        primed = true;
      }
      return current;
    },
    dispose() {
      lifetime.abort();
      stopPreparation();
      clips.clear();
      changes.clear();
    },
  };
}
