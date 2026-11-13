import { useCallback, useEffect, useRef, useState } from "react";
import { emptyProgress, type ClassroomProgress, type ReadingLesson } from "@/lib/classroom/types";

export async function classroomRequest(
  grade: number,
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/classroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grade, ...body }),
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.message ??
        (response.status === 409
          ? "အခြား tab မှ မှတ်တမ်းပြောင်းထားနိုင်ပါသည်။ Refresh လုပ်ပါ။"
          : "အတန်းဝန်ဆောင်မှု ချိတ်ဆက်မရပါ။ ပြန်စမ်းပါ။"),
    );
  }
  return response;
}
export function useClassroom(
  lesson: ReadingLesson,
  userId?: string,
  range?: { start: number; end: number },
  teacherDialogue = false,
) {
  const teacherDialogueRef = useRef(teacherDialogue);
  teacherDialogueRef.current = teacherDialogue;
  const startCursor = range?.start ?? 0;
  const endCursor = range?.end ?? lesson.segments.length * 4;
  const [progress, setProgress] = useState(() => ({ ...emptyProgress(), cursor: startCursor }));
  const current = useRef(progress);
  const revision = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [passCompleted, setPassCompleted] = useState(false);
  const [waitingAt, setWaitingAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const manualRef = useRef(manual);
  manualRef.current = manual;
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("Account ထဲ သိမ်းရန် Login ဝင်ပါ။");
  const [published, setPublished] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [contentHash, setContentHash] = useState("");
  const [ready, setReady] = useState(!userId);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const generation = useRef(0);
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const stale = useRef(false);
  const loadingRef = useRef(false);
  const playRef = useRef<(cursor: number, offset: number) => Promise<void>>(async () => {});
  const maxCursor = endCursor - 1;
  const totalSteps = lesson.segments.length * 4;
  const update = useCallback((next: ClassroomProgress) => {
    current.current = next;
    setProgress(next);
  }, []);
  const pause = useCallback(() => {
    generation.current++;
    controller.current?.abort();
    loadingRef.current = false;
    const a = audio.current;
    if (a) {
      a.pause();
      current.current = {
        ...current.current,
        offset: Number.isFinite(a.currentTime) ? a.currentTime : 0,
      };
    }
    setProgress(current.current);
    setPlaying(false);
    setLoading(false);
  }, []);
  const releaseAudio = useCallback(() => {
    if (audio.current) {
      audio.current.pause();
      audio.current.onended = null;
      audio.current.src = "";
      audio.current = null;
    }
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);
  const persist = useCallback(
    (next: ClassroomProgress) => {
      if (!userId || !ready || stale.current) return;
      setSaveStatus("သိမ်းနေသည်…");
      const snapshot = { ...next, completed: [...next.completed] };
      saveQueue.current = saveQueue.current.then(async () => {
        if (!active.current || stale.current) return;
        try {
          const response = await classroomRequest(lesson.grade, {
            action: "save",
            ...snapshot,
            revision: revision.current,
          });
          const data = await response.json();
          revision.current = data.revision;
          if (active.current) setSaveStatus("Account ထဲ သိမ်းပြီးပါပြီ။");
        } catch (err) {
          // Never overwrite a newer device's cursor with queued stale writes.
          stale.current = true;
          if (active.current) {
            pause();
            setSaveStatus("မသိမ်းရသေးပါ။ Refresh လုပ်ပြီး Account မှတ်တမ်း ပြန်ယူပါ။");
            setError(err instanceof Error ? err.message : "Save failed");
          }
        }
      });
    },
    [userId, ready, lesson.grade, pause],
  );
  const invalidatePlayback = useCallback(() => {
    generation.current++;
    controller.current?.abort();
  }, []);
  useEffect(() => {
    active.current = true;
    const abort = new AbortController();
    if (userId) {
      void (async () => {
        try {
          const response = await fetch(`/api/classroom?grade=${lesson.grade}`, {
            signal: abort.signal,
            cache: "no-store",
          });
          if (!response.ok)
            throw new Error("Account မှတ်တမ်း ချိတ်ဆက်မရပါ။ ယာယီ Manual Mode ဖြင့် ဖတ်နိုင်ပါတယ်။");
          const data = await response.json();
          if (!active.current) return;
          const p = data.progress as ClassroomProgress;
          const safe = {
            ...p,
            cursor:
              p.cursor >= startCursor && p.cursor <= maxCursor
                ? p.cursor
                : (Array.from({ length: endCursor - startCursor }, (_, i) => startCursor + i).find(
                    (i) => !p.completed.includes(i),
                  ) ?? startCursor),
            completed: p.completed.filter((i) => i >= 0 && i < totalSteps),
            offset: p.cursor >= startCursor && p.cursor <= maxCursor ? p.offset : 0,
          };
          revision.current = safe.revision;
          update(safe);
          setPublished(data.published);
          setAdmin(data.admin);
          setContentHash(data.contentHash);
          setSaveStatus("Account မှတ်တမ်း ပြန်ယူပြီးပါပြီ။");
          setReady(true);
        } catch (err) {
          if (active.current && !abort.signal.aborted) {
            setError(err instanceof Error ? err.message : "Load failed");
            setSaveStatus("Account ထဲ မသိမ်းနိုင်သေးပါ။");
            setManual(true);
          }
        }
      })();
    }
    return () => {
      active.current = false;
      abort.abort();
      invalidatePlayback();
      releaseAudio();
    };
  }, [
    userId,
    lesson.grade,
    maxCursor,
    startCursor,
    endCursor,
    totalSteps,
    update,
    releaseAudio,
    invalidatePlayback,
  ]);
  const complete = useCallback(
    (cursor: number) => {
      if (cursor === maxCursor) setPassCompleted(true);
      const p = current.current;
      const completed = [...new Set([...p.completed, cursor])].sort((a, b) => a - b);
      const next = { ...p, completed, cursor: Math.min(maxCursor, cursor + 1), offset: 0 };
      update(next);
      persist(next);
      return next;
    },
    [maxCursor, update, persist],
  );
  const playAt = useCallback(
    async (cursor: number, offset: number) => {
      if (!userId || !published || !ready || stale.current || loadingRef.current) return;
      const token = ++generation.current;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      releaseAudio();
      loadingRef.current = true;
      setLoading(true);
      setError("");
      try {
        const response = await classroomRequest(
          lesson.grade,
          { action: "audio", cursor },
          abort.signal,
        );
        const blob = await response.blob();
        if (token !== generation.current || !active.current) return;
        objectUrl.current = URL.createObjectURL(blob);
        const a = new Audio(objectUrl.current);
        audio.current = a;
        a.onloadedmetadata = () => {
          if (Number.isFinite(a.duration))
            a.currentTime = Math.min(offset, Math.max(0, a.duration - 0.05));
        };
        a.ontimeupdate = () => {
          if (audio.current === a) current.current = { ...current.current, offset: a.currentTime };
        };
        a.onended = () => {
          if (token !== generation.current) return;
          if (teacherDialogueRef.current && cursor % 4 === 3) {
            setWaitingAt(cursor);
            setPlaying(false);
            loadingRef.current = false;
            return;
          }
          const next = complete(cursor);
          setPlaying(false);
          loadingRef.current = false;
          if (!manualRef.current && cursor < maxCursor) void playRef.current(next.cursor, 0);
        };
        a.onerror = () => {
          if (token === generation.current) {
            setPlaying(false);
            setError("အသံဖွင့်မရပါ။ Repeat သို့မဟုတ် Manual Mode ကို သုံးပါ။");
          }
        };
        await a.play();
        if (token === generation.current) setPlaying(true);
        else a.pause();
      } catch (err) {
        if (token === generation.current && !abort.signal.aborted) {
          setError(err instanceof Error ? err.message : "Audio failed");
          setPlaying(false);
        }
      } finally {
        if (token === generation.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [userId, published, ready, lesson.grade, maxCursor, releaseAudio, complete],
  );
  playRef.current = playAt;
  const resume = () => {
    if (audio.current && !audio.current.ended && !loadingRef.current) {
      // Rebind ended token after pause invalidated any pending work.
      const cursor = current.current.cursor;
      const token = generation.current;
      audio.current.onended = () => {
        if (generation.current !== token || !active.current) return;
        if (teacherDialogueRef.current && cursor % 4 === 3) {
          setWaitingAt(cursor);
          setPlaying(false);
          return;
        }
        const next = complete(cursor);
        setPlaying(false);
        if (!manualRef.current && cursor < maxCursor) void playRef.current(next.cursor, 0);
      };
      void audio.current
        .play()
        .then(() => {
          if (generation.current === token && active.current) setPlaying(true);
        })
        .catch(() => setError("အသံဖွင့်ရန် ထပ်နှိပ်ပါ။"));
    } else void playAt(current.current.cursor, current.current.offset);
  };
  const move = (delta: number, markRead = false) => {
    setWaitingAt(null);
    pause();
    releaseAudio();
    if (markRead) complete(current.current.cursor);
    else {
      const next = {
        ...current.current,
        cursor: Math.max(startCursor, Math.min(maxCursor, current.current.cursor + delta)),
        offset: 0,
      };
      update(next);
      persist(next);
    }
  };
  const bookmark = () => {
    pause();
    persist(current.current);
  };
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => persist(current.current), 10000);
    return () => clearInterval(timer);
  }, [playing, persist]);
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === "hidden") {
        pause();
        persist(current.current);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [pause, persist]);
  return {
    progress,
    waitingAt,
    passCompleted,
    continueTeaching: () => {
      if (waitingAt === null) return;
      const cursor = waitingAt;
      setWaitingAt(null);
      releaseAudio();
      const next = complete(cursor);
      if (!manualRef.current && cursor < maxCursor) void playAt(next.cursor, 0);
    },
    restart: () => {
      setPassCompleted(false);
      pause();
      releaseAudio();
      setWaitingAt(null);
      update({ ...current.current, cursor: startCursor, offset: 0 });
      void playAt(startCursor, 0);
    },
    flushProgress: () => saveQueue.current,
    playing,
    loading,
    manual,
    error,
    saveStatus,
    ready,
    published,
    admin,
    contentHash,
    pause: bookmark,
    resume,
    move,
    setError,
    setPublished,
    repeat: () => {
      setWaitingAt(null);
      pause();
      releaseAudio();
      update({ ...current.current, offset: 0 });
      void playAt(current.current.cursor, 0);
    },
    toggleManual: () => {
      bookmark();
      setManual((v) => !v);
    },
  };
}
