import { Grade11UpperText } from "./Grade11UpperText";
import { Grade11AIReview } from "./Grade11AIReview";
import { Grade11UpperStudyNotes } from "./Grade11UpperStudyNotes";
import {
  UPPER_STUDY_NOTES,
  UPPER_ITEM_NOTES,
  upperRecordingAnswer,
  upperStudyContext,
} from "@/lib/grade11UpperStudy";
import { Grade11Unit7Lesson } from "./Grade11Unit7Lesson";
import { UPPER_STRUCTURES } from "@/lib/grade11UpperStructure";
import { Grade11GrammarQuestion } from "./Grade11GrammarExercise";
import grammarSupport from "@/data/grade11/grammarExerciseSupport.json";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ToggleReveal } from "@/components/lesson/ExerciseKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { isAnswerMatch } from "@/lib/answerMatch";
import {
  UPPER_UNITS,
  UPPER_KEYS,
  type UpperAnswer,
  type UpperGroup,
  type UpperItem,
  type UpperUnitNumber,
} from "@/lib/grade11Upper";
import type { G11SkillKind } from "@/data/grade11/syllabus";
import { Grade11GrammarExplanation } from "./Grade11GrammarExplanation";
import { Grade11GrammarVideos } from "./Grade11GrammarVideos";
import { Grade11SourceStructure } from "./Grade11SourceStructure";

export function Grade11UpperLesson({ unit, kind }: { unit: UpperUnitNumber; kind: G11SkillKind }) {
  if (unit === 7) return <Grade11Unit7Lesson kind={kind} />;
  return <UpperWorkspace key={`${unit}:${kind}`} unit={unit} kind={kind} />;
}

function UpperWorkspace({ unit, kind }: { unit: UpperUnitNumber; kind: G11SkillKind }) {
  const content = UPPER_UNITS[unit].skills[kind];
  const context = useMemo(() => upperStudyContext(unit, kind), [unit, kind]);
  const storageKey = `grade11:unit${unit}:${kind}:drafts:v1`;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const drafts = useRef<Record<string, string>>({});
  useEffect(() => {
    let restored: Record<string, string> = {};
    try {
      const data: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
      if (data && typeof data === "object" && !Array.isArray(data))
        restored = Object.fromEntries(
          Object.entries(data).filter(([, value]) => typeof value === "string"),
        );
    } catch {
      /* Storage is optional; the lesson remains usable. */
    }
    drafts.current = restored;
    setAnswers(restored);
    setLoaded(true);
  }, [storageKey]);
  const tasks = content.groups.flatMap((group) => group.items);
  const done = tasks.filter((item) => answers[item.id]?.trim()).length;
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
  return (
    <div className="mt-5 min-w-0 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground">
          Progress: {done} / {tasks.length} answered
        </p>
        <Progress
          aria-label="Answers completed"
          value={tasks.length ? (done / tasks.length) * 100 : 0}
          className="mt-2 h-2"
        />
      </div>
      {kind === "grammar" && (
        <>
          <Grade11GrammarVideos unit={unit} />
          <Grade11GrammarExplanation unit={unit} />
        </>
      )}
      <nav aria-label="Exercises" className="flex flex-wrap gap-2">
        {content.groups.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className="rounded-full border border-border bg-card px-3 py-2 text-sm hover:bg-primary/10"
          >
            {group.instruction === "Pre-reading"
              ? "Pre-reading"
              : (group.instruction.match(/^[A-F]\./)?.[0] ??
                (group.id.endsWith("plan") ? "Plan" : "Writing"))}
          </a>
        ))}
      </nav>
      <div
        className={`grid min-w-0 items-start gap-5 ${kind === "reading" ? "lg:grid-cols-2" : ""}`}
      >
        <div
          className={`min-w-0 ${kind === "reading" ? "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto" : ""}`}
        >
          <Grade11UpperText unit={unit} kind={kind} />
        </div>
        <section aria-label={`${kind} exercises`} className="min-w-0 space-y-5">
          <fieldset disabled={!loaded} className="min-w-0 space-y-5">
            <legend className="sr-only">Answers</legend>
            {content.groups.map((group) => (
              <section
                key={group.id}
                id={group.id}
                aria-labelledby={`${group.id}-title`}
                className="min-w-0 scroll-mt-28 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <h3
                  id={`${group.id}-title`}
                  lang="en"
                  className="border-b border-border pb-3 font-semibold"
                >
                  {group.instruction}
                </h3>
                <p lang="my" className="mt-2 text-sm leading-7 text-muted-foreground">
                  {group.instructionMy}
                </p>
                <Grade11UpperStudyNotes groupId={group.id} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Textbook {group.pages.length === 1 ? "page" : "pages"}{" "}
                  {group.pages.map((page) => page - 5).join(", ")}
                </p>
                {group.sourceRequired && kind !== "grammar" && (
                  <p lang="my" className="mt-2 rounded-lg bg-muted p-3 text-sm">
                    မူရင်းစာမျက်နှာရှိ မျဉ်းသားထားသော အပိုင်းကို ကြည့်၍ ဖြေပါ။
                  </p>
                )}
                {kind === "grammar" ? (
                  <div className="mt-3 space-y-3">
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
                      return (
                        <Grade11GrammarQuestion
                          key={item.id}
                          id={item.id}
                          question={item.prompt}
                          questionMy={item.promptMy ?? support.questionMy}
                          instructions={group.instruction}
                          answer={{ answer: support.answer }}
                          value={answers[item.id] ?? ""}
                          onChange={(value) => setAnswer(item.id, value)}
                          multiline={item.multiline ?? group.multiline ?? false}
                          semantic={support.semantic}
                          emphasis={support.emphasis}
                          context={support.context}
                        />
                      );
                    })}
                  </div>
                ) : group.table ? (
                  <div className="mt-3 max-w-full overflow-x-auto">
                    <table className="w-full min-w-[360px] table-fixed border-collapse text-sm">
                      <caption className="sr-only">{group.instruction}</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="w-[45%] border border-border p-2 text-left">
                            Textbook item
                          </th>
                          <th scope="col" className="border border-border p-2 text-left">
                            Your answer
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => (
                          <tr key={item.id}>
                            <th
                              scope="row"
                              lang="en"
                              className="break-words border border-border p-2 text-left align-top font-normal"
                            >
                              {item.prompt}
                            </th>
                            <td className="border border-border p-2 align-top">
                              <Question
                                unit={unit}
                                kind={kind}
                                context={context}
                                item={item}
                                group={group}
                                answer={UPPER_KEYS[unit][item.id]}
                                value={answers[item.id] ?? ""}
                                onChange={(value) => setAnswer(item.id, value)}
                                hidePrompt
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {group.items.map((item) => (
                      <Question
                        key={item.id}
                        unit={unit}
                        kind={kind}
                        context={context}
                        item={item}
                        group={group}
                        answer={UPPER_KEYS[unit][item.id]}
                        value={answers[item.id] ?? ""}
                        onChange={(value) => setAnswer(item.id, value)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </fieldset>
        </section>
      </div>
    </div>
  );
}

function Question({
  unit,
  kind,
  context,
  item,
  group,
  answer,
  value,
  onChange,
  hidePrompt = false,
}: {
  unit: UpperUnitNumber;
  kind: G11SkillKind;
  context: string;
  item: UpperItem;
  group: UpperGroup;
  answer?: UpperAnswer;
  value: string;
  onChange: (value: string) => void;
  hidePrompt?: boolean;
}) {
  const recordingAnswer = upperRecordingAnswer(unit, item.id);
  const resolvedAnswer =
    answer ?? (recordingAnswer ? { answer: recordingAnswer.answer, answerMy: null } : undefined);
  const labels = UPPER_STUDY_NOTES[group.id]?.choiceLabels;
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<boolean | null>(null);
  const multiline = item.multiline ?? group.multiline ?? false;
  const update = (text: string) => {
    onChange(text);
    setChecked(null);
  };
  const fieldLabel = `Your answer: ${item.prompt}`;
  return (
    <div
      data-question={item.id}
      className="min-w-0 space-y-2 rounded-xl border border-border bg-background p-3"
    >
      {!hidePrompt && (
        <p lang="en" className="whitespace-pre-line text-sm font-medium leading-relaxed">
          {item.prompt}
        </p>
      )}
      {UPPER_ITEM_NOTES[item.id] && (
        <p
          lang="my"
          className="rounded-lg border border-amber-300/50 bg-amber-50/30 p-3 text-sm leading-7"
        >
          {UPPER_ITEM_NOTES[item.id]}
        </p>
      )}
      {item.promptMy && (
        <div className="flex flex-wrap gap-2">
          <p lang="my" className="w-full text-sm leading-7 text-muted-foreground">
            {item.promptMy}
          </p>
          {group.structure && UPPER_STRUCTURES[item.id] && (
            <ToggleReveal label="Sentence Structure" icon={Sparkles}>
              <Grade11SourceStructure
                questionText={item.prompt.replace(/^\d+\.\s*/, "")}
                sentenceMy={item.promptMy}
                breakdown={UPPER_STRUCTURES[item.id]}
              />
            </ToggleReveal>
          )}
        </div>
      )}
      {item.choices ? (
        item.multiple ? (
          <fieldset disabled={revealed} className="space-y-2">
            <legend className="sr-only">{fieldLabel}</legend>
            {item.choices.map((choice) => (
              <label key={choice} lang="en" className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={value.split("\n").includes(choice)}
                  onChange={(event) => {
                    const values = new Set(value ? value.split("\n") : []);
                    if (event.target.checked) values.add(choice);
                    else values.delete(choice);
                    update(item.choices!.filter((option) => values.has(option)).join("\n"));
                  }}
                />
                {choice}
              </label>
            ))}
          </fieldset>
        ) : (
          <select
            aria-label={fieldLabel}
            disabled={revealed}
            value={value}
            onChange={(event) => update(event.target.value)}
            className="w-full min-w-0 rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="">Choose…</option>
            {item.choices.map((choice) => (
              <option key={choice} value={choice}>
                {labels?.[choice] ? `${choice}. ${labels[choice]}` : choice}
              </option>
            ))}
          </select>
        )
      ) : multiline ? (
        <Textarea
          aria-label={fieldLabel}
          rows={kind === "writing" && group.id.endsWith("composition") ? 12 : 3}
          maxLength={12000}
          disabled={revealed}
          value={value}
          onChange={(event) => update(event.target.value)}
          placeholder="Write your answer…"
        />
      ) : (
        <Input
          aria-label={fieldLabel}
          disabled={revealed}
          value={value}
          onChange={(event) => update(event.target.value)}
          placeholder="Type your answer here…"
        />
      )}
      {(item.wordTarget || (kind === "writing" && group.id.endsWith("composition"))) && (
        <p aria-live="polite" className="text-xs text-muted-foreground">
          Words: {value.trim().split(/\s+/).filter(Boolean).length} ·{" "}
          {item.wordTarget
            ? item.wordTarget[0] === item.wordTarget[1]
              ? `About ${item.wordTarget[0]}`
              : `${item.wordTarget[0]}–${item.wordTarget[1]}`
            : "Draft"}
        </p>
      )}
      {resolvedAnswer && (
        <div className="flex flex-wrap gap-2">
          {!multiline && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!value.trim() || revealed}
              onClick={() => setChecked(isAnswerMatch(value, resolvedAnswer.answer))}
            >
              Check Answer
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setRevealed((old) => !old);
              setChecked(null);
            }}
          >
            {revealed ? "Hide Answer" : "Reveal Answer"}
          </Button>
        </div>
      )}
      {(!resolvedAnswer || multiline) && (
        <Grade11AIReview
          question={item.prompt}
          instructions={`${group.instruction}\n${kind === "writing" && group.id.endsWith("composition") ? "Review the student’s own draft, its relevance to the textbook topic and use of given points. Explain how to improve; do not replace it with a finished essay." : "Accept valid paraphrases and personal responses where the task allows them."}`}
          context={context}
          answer={value}
          writing={kind === "writing" && group.id.endsWith("composition")}
          checkLabel="Check Answer"
          compact
        />
      )}
      {checked !== null && (
        <p
          role="status"
          lang="my"
          className={checked ? "text-sm text-emerald-700" : "text-sm text-rose-700"}
        >
          {checked ? "✅ မှန်ပါတယ်။" : "ထပ်စဉ်းစားပြီး ပြန်ဖြေကြည့်ပါ။"}
        </p>
      )}
      {revealed && resolvedAnswer && (
        <div className="rounded-lg bg-primary/5 p-3 text-sm">
          <p className="mb-2 text-xs font-medium text-primary">
            {recordingAnswer
              ? "Recording transcript · Suggested answer"
              : multiline
                ? "Source-derived suggested answer · အဓိပ္ပာယ်တူ ဖြေနိုင်ပါတယ်။"
                : "Source-derived answer"}
          </p>
          <p lang="en">Answer: {resolvedAnswer.answer}</p>
          {recordingAnswer && (
            <div className="mt-3 space-y-2 border-t border-border pt-2">
              <p lang="my" className="text-xs text-muted-foreground">
                အသံဖိုင်၏ အလိုအလျောက်ရေးကူးစာသားမှ လေ့လာရန်အဖြေ ဖြစ်သည်။ တရားဝင်အဖြေလွှာ မဟုတ်ပါ။
              </p>
              {recordingAnswer.cues.map((cue) => (
                <p key={cue.id} className="text-xs leading-relaxed">
                  {Math.floor(cue.start / 60)}:{String(Math.floor(cue.start % 60)).padStart(2, "0")}{" "}
                  · {cue.en}
                </p>
              ))}
            </div>
          )}
          {resolvedAnswer.answerMy && (
            <p lang="my" className="mt-2 text-muted-foreground">
              {resolvedAnswer.answerMy}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
