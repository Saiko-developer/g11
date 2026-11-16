// Grade 11 loader; the established Grade 10 player and timing behavior remain untouched.
export type YouTubeVideoPlayer = {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
};
export type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      host: string;
      playerVars: Record<string, string | number>;
      events: { onReady(): void; onError(): void };
    },
  ) => YouTubeVideoPlayer;
};
let pending: Promise<YouTubeApi> | undefined;
export function loadYouTubeIframeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT as unknown as YouTubeApi);
  if (pending) return pending;
  pending = new Promise<YouTubeApi>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else resolve(window.YT as unknown as YouTubeApi);
    };
    const ready = () => {
      try {
        previous?.();
      } finally {
        finish(window.YT?.Player ? undefined : new Error("YouTube API unavailable"));
      }
    };
    const timeout = setTimeout(() => finish(new Error("YouTube API timed out")), 15000);
    window.onYouTubeIframeAPIReady = ready;
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => finish(new Error("YouTube API could not load"));
    document.head.appendChild(script);
  }).catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
