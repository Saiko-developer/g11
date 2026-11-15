import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Grade11AIReview } from "./Grade11AIReview";
import { Grade11QuestionAnswer } from "./Grade11QuestionAnswer";
import { Grade11SourceAnswer } from "./Grade11SourceAnswer";
import { Grade11StudyNotes } from "./Grade11StudyNotes";
import { Grade11GrammarExplanation } from "./Grade11GrammarExplanation";
import { Grade11GrammarVideos } from "./Grade11GrammarVideos";
import { Grade11GrammarQuestion } from "./Grade11GrammarExercise";
import { UPPER_UNITS, UPPER_KEYS } from "@/lib/grade11Upper";
import { UNIT7_TEXT, UNIT7_NOTES, unit7Reference } from "@/lib/grade11Unit7";
import grammarSupport from "@/data/grade11/grammarExerciseSupport.json";
import type { G11SkillKind } from "@/data/grade11/syllabus";

export function Grade11Unit7Lesson({ kind }: { kind: G11SkillKind }) {
  return <Unit7Workspace key={kind} kind={kind} />;
}
function Unit7Workspace({ kind }: { kind: G11SkillKind }) {
  const content = UPPER_UNITS[7].skills[kind];
  const storageKey = `grade11:unit7:${kind}:drafts:v1`;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const drafts = useRef<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let restored: Record<string, string> = {};
    try {
      const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
      if (value && typeof value === "object" && !Array.isArray(value))
        restored = Object.fromEntries(
          Object.entries(value).filter(([, v]) => typeof v === "string"),
        );
    } catch {
      /* Storage is optional. */
    }
    drafts.current = restored;
    setAnswers(restored);
    setLoaded(true);
  }, [storageKey]);
  const setAnswer = (id: string, value: string) => {
    const next = { ...drafts.current, [id]: value };
    drafts.current = next;
    setAnswers(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* In-memory fallback. */
    }
  };
  const tasks = content.groups.flatMap((g) => g.items);
  const done = tasks.filter((q) => answers[q.id]?.trim()).length;
  const context = unit7Reference(kind);
  const translations = UNIT7_TEXT.questionTranslations as Record<string, string>;
  return (
    <div className="mt-5 min-w-0 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground">
          Progress: {done} / {tasks.length} answered
        </p>
        <Progress
          aria-label="Answers completed"
          className="mt-2 h-2"
          value={(done / tasks.length) * 100}
        />
      </div>
      {kind === "grammar" && (
        <>
          <Grade11GrammarVideos unit={7} />
          <Grade11GrammarExplanation unit={7} />
        </>
      )}
      <div
        className={
          kind === "reading" ? "grid min-w-0 items-start gap-5 lg:grid-cols-2" : "min-w-0 space-y-5"
        }
      >
        {kind === "reading" ? (
          <article
            aria-label="Unit 7 reading passage"
            className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-primary">Systems and Organs of the Human Body</h2>
            {UNIT7_TEXT.reading.map((b) =>
              b.t === "h" ? (
                <header key={b.id} className="border-t border-border pt-4">
                  <h3 className="font-bold text-primary">{b.x}</h3>
                  <p lang="my" className="mt-1 text-sm text-muted-foreground">
                    {b.my}
                  </p>
                </header>
              ) : (
                <div key={b.id} className="space-y-3">
                  <p lang="en" className="text-base leading-loose">
                    {b.x}
                  </p>
                  <p
                    lang="my"
                    className="border-l-2 border-primary/25 pl-3 text-sm leading-loose text-muted-foreground"
                  >
                    {b.my}
                  </p>
                </div>
              ),
            )}
          </article>
        ) : kind !== "listening" ? (
          <Grade11StudyNotes blocks={UNIT7_NOTES[kind]} />
        ) : null}
        <section aria-label={`${kind} exercises`} className="min-w-0 space-y-5">
          <fieldset disabled={!loaded} className="min-w-0 space-y-5">
            <legend className="sr-only">Answers</legend>
            {content.groups.map((group) => (
              <section
                key={group.id}
                data-exercise={group.id}
                className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <header className="border-b border-border pb-3">
                  <h3 className="font-semibold leading-relaxed">
                    {kind === "writing"
                      ? "Thuta listened to a short talk on ‘Fatty liver disease’ by a doctor. "
                      : ""}
                    {group.instruction}
                  </h3>
                  <p lang="my" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {group.instructionMy}
                  </p>
                </header>
                {group.id === "7-functions" && (
                  <div className="rounded-xl bg-primary/5 p-3 text-sm">
                    <span className="font-semibold">Organ → Function(s)</span>
                    <p className="mt-2">1. eye → to see</p>
                    <p lang="my" className="mt-1 text-muted-foreground">
                      ပေးထားသောနမူနာ · မျက်စိ → မြင်ရန်
                    </p>
                  </div>
                )}
                {group.items.map((item) => {
                  const support = (
                    grammarSupport.items as Record<
                      string,
                      {
                        questionMy: string;
                        answer: string;
                        semantic?: boolean;
                        emphasis?: string;
                        context?: string;
                      }
                    >
                  )[item.id];
                  if (kind === "grammar")
                    return (
                      <Grade11GrammarQuestion
                        key={item.id}
                        id={item.id}
                        question={item.prompt}
                        questionMy={support.questionMy}
                        instructions={group.instruction}
                        answer={{ answer: support.answer }}
                        value={answers[item.id] ?? ""}
                        onChange={(v) => setAnswer(item.id, v)}
                        multiline
                      />
                    );
                  if (kind === "vocabulary")
                    return (
                      <HomonymQuestion
                        key={item.id}
                        row={UNIT7_TEXT.vocabulary.find((r) => r.id === item.id)!}
                        answer={UPPER_KEYS[7][item.id].answer}
                        value={answers[item.id] ?? ""}
                        onChange={(v) => setAnswer(item.id, v)}
                      />
                    );
                  const listeningKey = (
                    UNIT7_TEXT.listeningAnswers as Record<
                      string,
                      { answer: string; answerMy: string }
                    >
                  )[item.id];
                  return (
                    <article
                      key={item.id}
                      data-question={item.id}
                      className="min-w-0 space-y-3 rounded-xl border border-border bg-background p-4"
                    >
                      <p lang="en" className="font-medium leading-relaxed">
                        {item.prompt}
                      </p>
                      <p lang="my" className="text-sm leading-loose text-muted-foreground">
                        {item.promptMy ?? translations[item.id] ?? group.instructionMy}
                      </p>
                      {kind === "reading" && group.id !== "7-pre" ? (
                        <Grade11QuestionAnswer
                          question={item.prompt}
                          instructions={group.instruction}
                          context={context}
                          answerKey={
                            UPPER_KEYS[7][item.id]
                              ? {
                                  ...UPPER_KEYS[7][item.id],
                                  answerMy: UPPER_KEYS[7][item.id].answerMy ?? undefined,
                                }
                              : undefined
                          }
                          value={answers[item.id] ?? ""}
                          onChange={(v) => setAnswer(item.id, v)}
                          fullSentence
                        />
                      ) : kind === "listening" ? (
                        <Grade11SourceAnswer
                          question={item.prompt}
                          instructions={group.instruction}
                          correct={listeningKey.answer}
                          correctMy={listeningKey.answerMy}
                          value={answers[item.id] ?? ""}
                          onChange={(v) => setAnswer(item.id, v)}
                        />
                      ) : (
                        <>
                          <Textarea
                            aria-label={`Your answer: ${item.prompt}`}
                            rows={kind === "writing" ? 12 : 3}
                            maxLength={12000}
                            value={answers[item.id] ?? ""}
                            onChange={(e) => setAnswer(item.id, e.target.value)}
                            placeholder="Write your answer…"
                          />
                          {kind === "writing" && (
                            <p className="text-xs text-muted-foreground">
                              Words:{" "}
                              {answers[item.id]?.trim().split(/\s+/).filter(Boolean).length ?? 0}
                            </p>
                          )}
                          <Grade11AIReview
                            question={item.prompt}
                            instructions={group.instruction}
                            context={context}
                            answer={answers[item.id] ?? ""}
                            writing={kind === "writing"}
                            checkLabel={
                              group.id === "7-pre" ? "Check Answer with AI" : "Check Answer"
                            }
                          />
                        </>
                      )}
                    </article>
                  );
                })}
              </section>
            ))}
          </fieldset>
        </section>
      </div>
    </div>
  );
}
function HomonymQuestion({
  row,
  answer,
  value,
  onChange,
}: {
  row: (typeof UNIT7_TEXT.vocabulary)[number];
  answer: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [checked, setChecked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const correct = row.options.find((o) => o.value === answer)!;
  const sourceNote = (UNIT7_TEXT.transcriptionNotes as Record<string, string>)[row.id];
  const parts = row.sentence.split(new RegExp(`(${row.word})`, "gi"));
  return (
    <article
      data-question={row.id}
      className="min-w-0 space-y-3 rounded-xl border border-border bg-background p-4"
    >
      <p lang="en" className="font-medium leading-loose">
        {row.id.split("-").at(-1)}.{" "}
        {parts.map((part, i) =>
          part.toLowerCase() === row.word.toLowerCase() ? (
            <strong key={i} className="rounded bg-primary/10 px-1 text-primary">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
      <p lang="my" className="text-sm leading-loose text-muted-foreground">
        {row.my}
      </p>
      {sourceNote && (
        <p
          lang="my"
          className="rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground"
        >
          {sourceNote}
        </p>
      )}
      <fieldset className="grid gap-2" disabled={revealed}>
        <legend className="sr-only">Meaning of {row.word}</legend>
        {row.options.map((o) => (
          <label
            key={o.value}
            className={`flex items-start gap-3 rounded-xl border p-3 ${value === o.value ? "border-primary/40 bg-primary/5" : "border-border"}`}
          >
            <input
              type="radio"
              className="mt-1"
              name={row.id}
              value={o.value}
              checked={value === o.value}
              onChange={() => {
                onChange(o.value);
                setChecked(null);
              }}
            />
            <span className="min-w-0 text-sm leading-relaxed">
              ({o.value}) {o.en}
              <span lang="my" className="mt-2 block text-muted-foreground">
                {o.my}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!value || revealed}
          onClick={() => setChecked(value)}
        >
          Check Answer
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRevealed((v) => !v)}>
          {revealed ? "Hide Answer" : "Reveal Answer"}
        </Button>
      </div>
      {checked === value && (
        <p
          role="status"
          className={value === answer ? "text-sm text-primary" : "text-sm text-destructive"}
        >
          {value === answer ? "✅ မှန်ပါတယ်။" : "ဝါကျထဲက အဓိပ္ပာယ်ကို ပြန်စဉ်းစားကြည့်ပါ။"}
        </p>
      )}
      {revealed && (
        <div className="rounded-lg bg-primary/5 p-3 text-sm">
          <p>
            Answer: ({answer}) {correct.en}
          </p>
          <p lang="my" className="mt-2 text-muted-foreground">
            {correct.my}
          </p>
        </div>
      )}
    </article>
  );
}
