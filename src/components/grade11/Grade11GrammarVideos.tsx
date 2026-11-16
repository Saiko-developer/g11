import { useState } from "react";
import { Grade11SubtitledVideo } from "./Grade11SubtitledVideo";
import { GRADE11_VIDEO_SUBTITLES, GRADE11_VIDEO_SUBTITLE_TAILS } from "@/lib/grade11VideoSubtitles";
import { Play } from "lucide-react";
import videosByUnit from "@/data/grade11/grammarVideos.json";

type Video = {
  title: string;
  url: string;
  channel?: string;
  start?: number;
  end?: number;
  noteMy?: string;
};
const catalog = videosByUnit as Record<string, Video[]>;

function youtubeId(value: string) {
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : ["youtube.com", "www.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)
          ? (url.searchParams.get("v") ??
            url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1])
          : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Same video section pattern as Grade 10, with a separate Grade 11 catalog. */
export function Grade11GrammarVideos({ unit }: { unit: number }) {
  return <UnitGrammarVideos key={unit} unit={unit} />;
}

function UnitGrammarVideos({ unit }: { unit: number }) {
  const [active, setActive] = useState(0);
  const videos = catalog[String(unit)] ?? [];
  if (!videos.length) return null;
  const video = videos[Math.min(active, videos.length - 1)];
  const id = youtubeId(video.url);
  const start = Number.isSafeInteger(video.start) && video.start! >= 0 ? video.start! : 0;
  const end = Number.isSafeInteger(video.end) && video.end! > start ? video.end : undefined;
  const params = new URLSearchParams({ rel: "0", autoplay: "0" });
  if (start) params.set("start", String(start));
  if (end) params.set("end", String(end));
  const source = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
  const time = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <section
      className="mt-5 rounded-2xl border border-border bg-card p-5"
      aria-label="Grammar video explanation"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Play className="h-3.5 w-3.5" /> Video Lesson
      </div>
      {videos.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {videos.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={active === index}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${active === index ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm font-semibold">{video.title}</p>
      {video.channel && (
        <p className="mt-1 text-xs text-muted-foreground">{video.channel} · English</p>
      )}
      {(start > 0 || end) && (
        <p lang="my" className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
          ရွေးထားသောအပိုင်း · {time(start)}
          {end ? `–${time(end)} · ${time(end - start)}` : " မှစတင်မည်"}
        </p>
      )}
      {video.noteMy && (
        <p lang="my" className="mt-2 text-sm text-muted-foreground">
          {video.noteMy}
        </p>
      )}
      {id && GRADE11_VIDEO_SUBTITLES[id] ? (
        <Grade11SubtitledVideo
          key={`${id}:${start}:${end ?? ""}`}
          videoId={id}
          title={video.title}
          subtitles={GRADE11_VIDEO_SUBTITLES[id]}
          untimedTail={GRADE11_VIDEO_SUBTITLE_TAILS[id]}
          start={start}
          end={end}
        />
      ) : id ? (
        <div className="mt-2 aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <iframe
            key={`${id}:${start}:${end ?? ""}`}
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <p lang="my" className="mt-2 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          ဗီဒီယို မထည့်ရသေးပါ။
        </p>
      )}
      {id && !GRADE11_VIDEO_SUBTITLES[id] && (
        <p lang="my" className="mt-2 text-xs text-muted-foreground">
          ဤဗီဒီယိုအတွက် အချိန်ကိုက် မြန်မာစာတန်း မရရှိသေးပါ။
        </p>
      )}
      {id && (
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          YouTube မှာဖွင့်ကြည့်မယ် ↗
        </a>
      )}
    </section>
  );
}
