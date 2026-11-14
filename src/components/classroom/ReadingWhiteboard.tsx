import notes from "@/data/classroom/grade10-unit1-board-notes.json";
import { stepAt, type ReadingLesson } from "@/lib/classroom/types";

function HighlightedSentence({ text, phrases }: { text: string; phrases: string[] }) {
  const parts: { text: string; highlight: boolean }[] = [];
  let start = 0;
  while (start < text.length) {
    const matches = phrases
      .filter(Boolean)
      .map((phrase) => ({ phrase, index: text.indexOf(phrase, start) }))
      .filter((match) => match.index >= 0)
      .sort((a, b) => a.index - b.index || b.phrase.length - a.phrase.length);
    const match = matches[0];
    if (!match) {
      parts.push({ text: text.slice(start), highlight: false });
      break;
    }
    if (match.index > start) parts.push({ text: text.slice(start, match.index), highlight: false });
    parts.push({ text: match.phrase, highlight: true });
    start = match.index + match.phrase.length;
  }
  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="rounded bg-amber-200 px-1 text-emerald-950">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function ReadingWhiteboard({
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
  const { segment } = stepAt(lesson, cursor);
  const stage = cursor % 4;
  const entry = notes.find((item) => item.id === segment.id);
  const cue =
    (stage === 2 ? entry?.meaning : stage === 3 ? entry?.grammar : undefined) ??
    ((stage === 2 || stage === 3) && lesson.section && segment.notes
      ? { focus: segment.focus ?? [], notes: segment.notes, example: "", incorrect: undefined }
      : undefined);
  return (
    <article
      aria-label="Classroom whiteboard"
      className="min-w-0 rounded-3xl border-8 border-stone-700 bg-emerald-950 p-5 text-emerald-50 shadow-xl md:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-emerald-700/50 pb-3 text-xs text-emerald-200">
        <span>
          ဒီနေ့မှတ်စု · {lesson.section ? "Teaching point" : "Sentence"}{" "}
          {Math.floor(cursor / 4) + 1}
        </span>
        <span>
          {completed} / {total}
        </span>
      </div>
      <p lang="en" className="text-xl font-semibold leading-loose md:text-2xl">
        <HighlightedSentence text={segment.english} phrases={cue?.focus ?? segment.focus ?? []} />
      </p>
      {stage === 1 && (
        <p
          aria-label="Burmese translation"
          lang="my"
          className="mt-5 text-base leading-loose text-emerald-100"
        >
          {segment.translation}
        </p>
      )}
      {cue && (
        <section
          aria-label="Teaching notes"
          aria-live="polite"
          className="mt-6 space-y-4 rounded-xl border-l-4 border-amber-300 bg-emerald-900/60 p-4"
        >
          <h2 className="text-sm font-semibold text-amber-200">
            {stage === 2 ? "အဓိကအချက်" : "Grammar · မှတ်ထားမယ်"}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-base leading-loose">
            {cue.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          {cue.example && (
            <div className="space-y-2 border-t border-emerald-700/60 pt-3 text-sm leading-loose">
              <p>
                <span className="mr-2 font-semibold text-emerald-200">
                  {cue.incorrect ? "မှန်" : "ဥပမာ"}
                </span>
                {cue.example}
              </p>
              {cue.incorrect && (
                <p>
                  <span className="mr-2 font-semibold text-rose-200">မသုံးရ</span>
                  <span className="line-through decoration-rose-300">{cue.incorrect}</span>
                </p>
              )}
            </div>
          )}
        </section>
      )}
      <details className="mt-6 border-t border-emerald-700/50 pt-4 text-sm text-emerald-200">
        <summary className="cursor-pointer">ဆရာပြောစာသား ကြည့်မယ်</summary>
        <p lang="my" className="mt-3 whitespace-pre-wrap leading-loose">
          {transcript}
        </p>
      </details>
    </article>
  );
}
