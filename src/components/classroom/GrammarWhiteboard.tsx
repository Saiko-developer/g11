import { ArrowRight, Check, Lightbulb, ScanText } from "lucide-react";
import { grammarBoardCue, grammarFormulaParts } from "@/lib/classroom/grammar-board";
import { stepAt, type ReadingLesson } from "@/lib/classroom/types";

const terms =
  /\b(noun phrase|noun|appositive phrase|appositive|apposition|referent|subject|main verb|verb|singular|plural|identifying|extra information|comma|V-ing|V1|V2|V3|gerund|infinitive|auxiliary|tense|active|passive|relative pronoun|clause|My son|a musician|Aye Aye|U Tun Tun|our English teacher)\b/gi;
function FocusText({ text }: { text: string }) {
  return (
    <>
      {text.split(terms).map((part, i) =>
        i % 2 ? (
          <mark
            key={i}
            className="rounded bg-amber-200/15 px-1 py-0.5 font-semibold text-amber-100"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
function formulaTone(text: string) {
  if (text.trim().toLowerCase() === "not")
    return { color: "border-amber-300/30 bg-amber-300/10 text-amber-100", label: "အငြင်းပြ" };
  if (["U Tun Tun", "Finland"].includes(text))
    return { color: "border-sky-300/35 bg-sky-300/10 text-sky-100", label: "ဖော်ပြခံရသော နာမ်" };
  if (["our English teacher", "the land of a thousand lakes"].includes(text))
    return {
      color: "border-amber-300/35 bg-amber-300/10 text-amber-100",
      label: "ထပ်ဖော်ပြသော နာမ်စု",
    };
  if (/subject/i.test(text))
    return { color: "border-sky-300/30 bg-sky-300/10 text-sky-100", label: "ကတ္တား" };
  if (
    /^(?:am|is|are|was|were|do|does|did|have|has|had|been|can|could|will|would|shall|should|may|might|must|not|\s|\/)+$/i.test(
      text,
    )
  )
    return { color: "border-amber-300/30 bg-amber-300/10 text-amber-100", label: "ကူညီကြိယာ" };
  if (/verb|\bV[123]\b|V-ing|infinitive|participle/i.test(text))
    return { color: "border-rose-300/30 bg-rose-300/10 text-rose-100", label: "ကြိယာပုံစံ" };
  if (/noun|object|appositive/i.test(text))
    return {
      color: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
      label: "နာမ် / စကားစု",
    };
  return { color: "border-white/15 bg-white/5 text-emerald-50", label: "" };
}
function Formula({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Grammar formula">
      {grammarFormulaParts(text).map((part, i) => {
        if (["+", "→", "↔"].includes(part))
          return (
            <span key={i} aria-hidden="true" className="px-0.5 text-xl text-emerald-400">
              {part}
            </span>
          );
        const tone = formulaTone(part);
        return (
          <div key={i} className={`min-w-0 max-w-full rounded-xl border px-3 py-2 ${tone.color}`}>
            <p className="break-words font-mono text-sm leading-relaxed sm:text-base">{part}</p>
            {tone.label && <p className="mt-1 text-[10px] opacity-70">{tone.label}</p>}
          </div>
        );
      })}
    </div>
  );
}
const partColors = {
  noun: "border-sky-300/35 bg-sky-300/15 text-sky-100",
  modifier: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  subject: "border-sky-300/35 bg-sky-300/15 text-sky-100",
  appositive: "border-amber-300/40 bg-amber-300/15 text-amber-100",
  verb: "border-rose-300/40 bg-rose-300/15 text-rose-100",
  punctuation: "border-transparent text-amber-200",
  neutral: "border-transparent text-emerald-50",
};
export function GrammarWhiteboard({
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
  const cue = grammarBoardCue(lesson, cursor);
  const { stage } = stepAt(lesson, cursor);
  const formulas = cue.formulas ?? [];
  return (
    <article
      aria-label="Classroom whiteboard"
      className="min-w-0 overflow-hidden rounded-3xl border border-emerald-800 bg-emerald-950 text-emerald-50 shadow-xl"
    >
      <header className="border-b border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300">
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wider">
            <ScanText aria-hidden="true" className="h-4 w-4" />
            Grammar · သင်ထောက်ကူဘုတ်
          </span>
          <span className="tabular-nums">
            {completed} / {total}
          </span>
        </div>
        <ol aria-label="Teaching audio stages" className="mt-5 flex flex-wrap items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              aria-current={stage === i ? "step" : undefined}
              className={`flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${stage === i ? "bg-amber-200 font-semibold text-emerald-950" : "bg-white/5 text-emerald-200/60"}`}
            >
              <span className="tabular-nums">{i + 1}</span>
              {stage === i ? (
                cue.stage
              ) : i < stage ? (
                <Check aria-label="ယခင်အဆင့်" className="h-3 w-3" />
              ) : null}
            </li>
          ))}
        </ol>
        <h2 className="mt-4 text-xl font-bold leading-relaxed tracking-tight sm:text-2xl">
          {cue.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-loose text-emerald-100/80">
          <FocusText text={cue.focus} />
        </p>
      </header>
      <div
        key={cursor}
        className="space-y-5 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:p-7"
      >
        {formulas.length > 0 && (
          <section
            aria-label="Rule structure"
            className="space-y-4 rounded-2xl border border-emerald-700/60 bg-emerald-900/40 p-4 sm:p-5"
          >
            <h3 className="text-xs font-semibold tracking-wide text-emerald-300">
              ပုံစံကို အပိုင်းလိုက် ကြည့်မယ်
            </h3>
            {formulas.slice(0, 3).map((text) => (
              <Formula key={text} text={text} />
            ))}
            {formulas.length > 3 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-emerald-200">
                  အခြားသက်ဆိုင်သော ပုံစံများ ({formulas.length - 3})
                </summary>
                <div className="mt-4 space-y-4">
                  {formulas.slice(3).map((text) => (
                    <Formula key={text} text={text} />
                  ))}
                </div>
              </details>
            )}
          </section>
        )}
        {cue.parts && (
          <section
            aria-label="Sentence structure"
            className="rounded-2xl border border-white/15 bg-black/10 p-4 sm:p-5"
          >
            <h3 className="mb-4 text-xs font-semibold text-emerald-300">
              {cue.example ? "အသံထဲက ဥပမာ · အစိတ်အပိုင်းများ" : "နာမ်စုနဲ့ ဆက်နွှယ်ပုံကို ကြည့်မယ်"}
            </h3>
            <div className="flex flex-wrap items-start gap-x-2 gap-y-3">
              {cue.parts.map((part, i) => (
                <div key={i} className="min-w-0 max-w-full">
                  <p
                    className={`break-words rounded-lg border px-2 py-2 text-lg font-medium leading-relaxed ${partColors[part.role ?? "neutral"]}`}
                  >
                    {part.text}
                  </p>
                  {part.label && (
                    <p className="mt-2 max-w-48 text-xs leading-relaxed text-emerald-200/75">
                      {part.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        {cue.comparison && (
          <section aria-label="Grammar comparison" className="grid gap-3 sm:grid-cols-2">
            {cue.comparison.map((item, i) => (
              <div
                key={item.title}
                className={`rounded-2xl border p-4 ${i === 0 ? "border-sky-300/25 bg-sky-300/5" : "border-amber-300/30 bg-amber-300/5"}`}
              >
                <h3
                  className={`text-xs font-semibold ${i === 0 ? "text-sky-200" : "text-amber-200"}`}
                >
                  {item.title}
                </h3>
                <p className="mt-3 break-words text-lg font-semibold leading-loose">
                  <FocusText text={item.pattern} />
                </p>
                <p className="mt-3 text-sm leading-loose text-emerald-100/80">
                  <FocusText text={item.reason} />
                </p>
              </div>
            ))}
          </section>
        )}
        {cue.notes.length > 0 && (
          <section aria-label="Teaching notes" className="grid gap-3 sm:grid-cols-2">
            {cue.notes.map((note, i) => (
              <div
                key={`${note.label}:${i}`}
                className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-4"
              >
                <h3 className="text-xs font-semibold text-emerald-300">{note.label}</h3>
                {note.text.length > 160 ? (
                  <details className="mt-2 text-sm leading-loose">
                    <summary className="cursor-pointer">
                      <span className="line-clamp-3">
                        <FocusText text={note.text} />
                      </span>
                      <span className="mt-2 block text-xs text-emerald-300">
                        မှတ်စုအပြည့် ဖွင့်ကြည့်မယ်
                      </span>
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap border-t border-white/10 pt-3">
                      <FocusText text={note.text} />
                    </p>
                  </details>
                ) : (
                  <p className="mt-2 text-sm leading-loose">
                    <FocusText text={note.text} />
                  </p>
                )}
              </div>
            ))}
          </section>
        )}
        <aside className="flex items-start gap-3 rounded-xl border border-amber-200/20 bg-amber-200/[0.06] p-4">
          <Lightbulb aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
          <div>
            <p className="text-[11px] font-semibold text-amber-200">ဒီအချက်ကို စဉ်းစားကြည့်ပါ</p>
            <p className="mt-1 text-sm leading-loose">
              <FocusText text={cue.check} />
            </p>
          </div>
          <ArrowRight
            aria-hidden="true"
            className="mt-1 hidden h-4 w-4 shrink-0 text-amber-200 sm:block"
          />
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
