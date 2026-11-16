import { useEffect, useMemo, useRef, useState } from "react";
import type { SubtitleLine } from "@/data/unit1VideoSubtitles";
import {
  activeVideoSubtitle,
  clipVideoSubtitles,
  type UntimedVideoSubtitle,
} from "@/lib/grade11VideoSubtitles";
import { loadYouTubeIframeApi, type YouTubeVideoPlayer } from "@/lib/youtubeIframeApi";
const fmt = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function Grade11SubtitledVideo({
  videoId,
  title,
  subtitles,
  untimedTail,
  start = 0,
  end,
}: {
  videoId: string;
  title: string;
  subtitles: readonly SubtitleLine[];
  untimedTail?: UntimedVideoSubtitle;
  start?: number;
  end?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubeVideoPlayer | null>(null);
  const [duration, setDuration] = useState<number | undefined>();
  const cues = useMemo(() => {
    // The source's final cue has no supplied end. Only actual YouTube metadata may bound it.
    const complete =
      untimedTail && duration !== undefined && duration > untimedTail.start
        ? [...subtitles, { ...untimedTail, end: duration }]
        : subtitles;
    return clipVideoSubtitles(complete, start, end);
  }, [subtitles, untimedTail, duration, start, end]);
  const [time, setTime] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let broken = false;
    let initialized = false;
    let stoppedAtEnd = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let readyTimeout: ReturnType<typeof setTimeout> | undefined;
    const container = host.current;
    setTime(null);
    setDuration(undefined);
    setReady(false);
    setFailed(false);
    const fail = () => {
      if (cancelled) return;
      broken = true;
      clearInterval(poll);
      clearTimeout(readyTimeout);
      setFailed(true);
      setReady(false);
      setTime(null);
    };
    // Native playback must not depend on the caption API being reachable.
    const frame = document.createElement("iframe");
    const params = new URLSearchParams({
      autoplay: "0",
      controls: "1",
      playsinline: "1",
      rel: "0",
      enablejsapi: "1",
      origin: location.origin,
      start: String(start),
    });
    if (end !== undefined) params.set("end", String(end));
    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    frame.title = title;
    frame.width = "100%";
    frame.height = "100%";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    container?.replaceChildren(frame);
    loadYouTubeIframeApi()
      .then((api) => {
        if (cancelled || !container) return;
        const vars: Record<string, number | string> = {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          start,
          cc_load_policy: 0,
          origin: location.origin,
        };
        if (end !== undefined) vars.end = end;
        readyTimeout = setTimeout(fail, 15000);
        player.current = new api.Player(frame, {
          videoId,
          width: "100%",
          height: "100%",
          host: "https://www.youtube-nocookie.com",
          playerVars: vars,
          events: {
            onReady() {
              if (cancelled || broken || initialized) return;
              initialized = true;
              clearTimeout(readyTimeout);
              setReady(true);
              // The iframe URL already sets the clip start and autoplay=0.
              // Do not pause/seek here: the student may have already clicked native Play.
              poll = setInterval(() => {
                const p = player.current;
                if (!p) return;
                if (untimedTail) {
                  const sourceDuration = p.getDuration?.();
                  if (
                    sourceDuration !== undefined &&
                    Number.isFinite(sourceDuration) &&
                    sourceDuration > 0
                  )
                    setDuration(sourceDuration);
                }
                const seconds = p.getCurrentTime();
                if (!Number.isFinite(seconds)) return;
                if (end !== undefined && seconds >= end) {
                  if (!stoppedAtEnd) p.pauseVideo();
                  stoppedAtEnd = true;
                  setTime(end);
                  return;
                }
                stoppedAtEnd = false;
                setTime(seconds >= start ? seconds : null);
              }, 100);
            },
            onError: fail,
          },
        });
      })
      .catch(fail);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(readyTimeout);
      player.current?.destroy();
      player.current = null;
      container?.replaceChildren();
    };
  }, [videoId, title, start, end, attempt, untimedTail]);
  const activeIndex = time === null ? -1 : activeVideoSubtitle(cues, time);
  const active = activeIndex < 0 ? null : cues[activeIndex];
  const seek = (seconds: number) => {
    // Transcript entries are clipped, so seeking cannot jump outside the selected chapter.
    const target = Math.max(start, Math.min(seconds, end === undefined ? Infinity : end - 0.01));
    player.current?.seekTo(target, true);
    player.current?.playVideo();
    // Wait for actual getCurrentTime() instead of prematurely displaying the requested cue.
    setTime(null);
  };
  return (
    <div className="mt-3 space-y-3" aria-label={`${title} with Myanmar subtitles`}>
      <div className="relative aspect-video min-h-[202px] w-full overflow-hidden rounded-xl border border-border bg-muted">
        <div ref={host} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          onClick={() => {
            if (ready && player.current) {
              if (end !== undefined && player.current.getCurrentTime() >= end)
                player.current.seekTo(start, true);
              player.current.playVideo();
            } else {
              // Explicit user gesture: native playback still works when the caption API is blocked.
              const frame = host.current?.querySelector("iframe");
              if (frame) {
                const url = new URL(frame.src);
                url.searchParams.set("autoplay", "1");
                frame.src = url.href;
              }
            }
          }}
        >
          ▶ ဗီဒီယို ဖွင့်မယ်
        </button>
        {ready && (
          <button
            type="button"
            className="rounded-xl border px-4 py-3 text-sm"
            onClick={() => player.current?.pauseVideo()}
          >
            ⏸ ခဏရပ်မယ်
          </button>
        )}
      </div>
      {failed && (
        <div role="status" className="rounded-xl border p-3 text-sm">
          မြန်မာစာတန်းချိတ်ဆက်မှု မရသေးပါ။ Video ကို အပေါ်က Play ခလုတ် သို့မဟုတ် YouTube link မှ
          ဖွင့်နိုင်ပါတယ်။
          <button
            type="button"
            className="mt-2 block underline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            ပြန်ချိတ်မယ်
          </button>
        </div>
      )}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Myanmar video subtitle"
        className="min-h-24 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center"
      >
        {enabled && active ? (
          <>
            <p lang="my" className="text-base font-semibold leading-relaxed">
              {active.my}
            </p>
            {showEnglish && active.en && (
              <p lang="en" className="mt-2 text-sm text-muted-foreground">
                {active.en}
              </p>
            )}
          </>
        ) : (
          <p lang="my" className="text-sm text-muted-foreground">
            {!enabled
              ? "မြန်မာစာတန်း ပိတ်ထားသည်။"
              : failed
                ? "မြန်မာစာတန်းချိတ်ဆက်မှု မရသေးပါ။"
                : !ready
                  ? "Video ချိတ်ဆက်နေသည်…"
                  : time === null
                    ? "ဗီဒီယိုကို ဖွင့်လိုက်ရင် မြန်မာစာတန်း ပေါ်လာမည်။"
                    : end !== undefined && time >= end
                      ? "ရွေးထားသော ဗီဒီယိုအပိုင်း ပြီးပါပြီ။"
                      : "ဤအချိန်ပိုင်းအတွက် မြန်မာစာတန်း မရှိသေးပါ။"}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={enabled}
          className="rounded-full border px-3 py-2 text-xs"
          onClick={() => setEnabled((old) => !old)}
        >
          {enabled ? "မြန်မာစာတန်း ပိတ်မယ်" : "မြန်မာစာတန်း ဖွင့်မယ်"}
        </button>
        {cues.some((cue) => cue.en) && (
          <button
            type="button"
            aria-pressed={showEnglish}
            className="rounded-full border px-3 py-2 text-xs"
            onClick={() => setShowEnglish((old) => !old)}
          >
            English စာတန်း
          </button>
        )}
        <button
          type="button"
          aria-expanded={showScript}
          className="rounded-full border px-3 py-2 text-xs"
          onClick={() => setShowScript((old) => !old)}
        >
          စာသားအပြည့် ကြည့်မယ်
        </button>
      </div>
      {showScript && (
        <div className="rounded-xl border p-3">
          <p lang="my" className="mb-2 text-xs text-muted-foreground">
            အချိန်များသည် ဗီဒီယိုမူရင်းအချိန် ဖြစ်သည်။ စာကြောင်းနှိပ်၍ ပြန်ကြည့်နိုင်သည်။
          </p>
          <ol aria-label="Myanmar video transcript" className="max-h-80 space-y-1 overflow-y-auto">
            {cues.map((cue, i) => (
              <li key={`${cue.start}:${cue.end}`}>
                <button
                  type="button"
                  disabled={!ready}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className={`w-full rounded-lg p-3 text-left text-sm disabled:opacity-50 ${i === activeIndex ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-accent"}`}
                  onClick={() => seek(cue.start)}
                >
                  <span className="mr-2 font-mono text-xs text-primary">{fmt(cue.start)}</span>
                  <span lang="my">{cue.my}</span>
                  {showEnglish && cue.en && (
                    <span lang="en" className="mt-1 block text-xs text-muted-foreground">
                      {cue.en}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
