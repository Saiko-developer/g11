import { Lightbulb, PenLine } from "lucide-react";
import { writingBoardCue } from "@/lib/classroom/writing-board";
import type { ReadingLesson } from "@/lib/classroom/types";

function Marked({ text, terms }: { text: string; terms: string[] }) {
  const relevant = terms.filter((term) => text.includes(term)).sort((a, b) => b.length - a.length);
  if (!relevant.length) return <>{text}</>;
  const escaped = relevant.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return (
    <>
      {text.split(new RegExp(`(${escaped.join("|")})`, "g")).map((part, i) =>
        relevant.includes(part) ? (
          <mark key={i} className="rounded bg-amber-200/20 px-1 font-semibold text-amber-100">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function WritingWhiteboard({
  lesson,
  cursor,
  completed,
  total,
  transcript,
}: {
  lesson: ReadingLesson;
  cursor: number;
  completed: number;
  total: number;
  transcript: string;
}) {
  const cue = writingBoardCue(lesson, cursor);
  return (
    <article
      aria-label="Classroom whiteboard"
      className="min-w-0 overflow-hidden rounded-3xl border border-emerald-800 bg-emerald-950 text-emerald-50 shadow-xl"
    >
      <header className="border-b border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300">
          <span className="flex items-center gap-2 font-semibold">
            <PenLine aria-hidden="true" className="h-4 w-4" /> Writing · သင်ထောက်ကူဘုတ်
          </span>
          <span className="tabular-nums">
            {completed} / {total}
          </span>
        </div>
        <h2 className="mt-4 break-words text-2xl font-bold leading-relaxed text-amber-100">
          {cue.title}
        </h2>
        <p className="mt-3 text-sm leading-loose text-emerald-200">{cue.task}</p>
        <ol
          aria-label="Writing teaching path"
          className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {["နားလည်", "အစီအစဉ်ချ", "Grammar ရွေး", "ရေးပြီးပြင်"].map((label, i) => (
            <li
              key={label}
              aria-current={cue.part === i ? "step" : undefined}
              className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${cue.part === i ? "border-amber-200/50 bg-amber-200/15 text-amber-100" : "border-white/10 text-emerald-200/60"}`}
            >
              <span className="mr-2">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </header>
      <div
        key={cursor}
        className="space-y-5 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:p-7"
      >
        <section aria-label="Current writing focus" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold leading-loose">{cue.label}</h3>
            <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-xs text-emerald-300">
              {cue.phase + 1} / 4
            </span>
          </div>
          <p className="mt-2 text-sm leading-loose text-emerald-100/80">{cue.focus}</p>
          {cue.terms.length > 0 && (
            <div aria-label="Terms in current audio" className="mt-4 flex flex-wrap gap-2">
              {cue.terms.map((term) => (
                <span
                  key={term}
                  className="max-w-full break-words rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-sm font-medium text-amber-100"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
        </section>
        <section aria-label="Writing support notes" className="grid gap-3 sm:grid-cols-2">
          {cue.items.map(({ note, active }, i) => (
            <div
              key={note}
              className={`min-w-0 rounded-xl border p-4 ${active ? "border-amber-200/35 bg-amber-200/[0.06]" : "border-white/10 bg-white/[0.03]"}`}
            >
              <p className="mb-2 text-[11px] font-semibold text-emerald-300">
                {cue.part === 1
                  ? `အစီအစဉ် ${i + 1}`
                  : cue.part === 2
                    ? "ပုံစံနဲ့ ရွေးရတဲ့အကြောင်း"
                    : `အချက် ${i + 1}`}
              </p>
              <p className="break-words text-sm leading-loose">
                <Marked text={note} terms={cue.terms} />
              </p>
            </div>
          ))}
        </section>
        <aside className="flex items-start gap-3 rounded-xl border border-sky-200/20 bg-sky-200/5 p-4">
          <Lightbulb aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-sky-200" />
          <div>
            <p className="text-xs font-semibold text-sky-200">ကိုယ်တိုင် စဉ်းစားကြည့်ပါ</p>
            <p className="mt-2 text-sm leading-loose">{cue.question}</p>
          </div>
        </aside>
        <details className="border-t border-white/10 pt-4 text-sm text-emerald-200">
          <summary className="cursor-pointer">ဆရာပြောစာသား ကြည့်မယ်</summary>
          <p lang="my" className="mt-3 whitespace-pre-wrap leading-loose">
            {transcript}
          </p>
        </details>
      </div>
    </article>
  );
}
