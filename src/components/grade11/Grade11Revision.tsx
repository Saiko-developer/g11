import { useEffect, useRef, useState } from "react";
import { BookOpen, Languages } from "lucide-react";
import { ToggleReveal } from "@/components/lesson/ExerciseKit";
import { Textarea } from "@/components/ui/textarea";
import { Grade11QuestionAnswer } from "./Grade11QuestionAnswer";
import { Grade11AIReview } from "./Grade11AIReview";
import {
  G11_POEMS,
  G11_REVIEWS,
  G11_POEM_KEYS,
  G11_REVIEW_KEYS,
  grade11RevisionContext,
  type RevisionGroup,
  type RevisionItem,
} from "@/lib/grade11Revision";
import type { SourceAnswer } from "@/lib/grade11Answers";

function Emphasis({ item }: { item: RevisionItem }) {
  const target = item.highlights?.[0];
  const index = target ? item.question.indexOf(target) : -1;
  return index < 0 ? (
    item.question
  ) : (
    <>
      {item.question.slice(0, index)}
      <strong className="underline decoration-primary decoration-2 underline-offset-4">
        {target}
      </strong>
      {item.question.slice(index + target!.length)}
    </>
  );
}
function RevisionQuestion({
  item,
  answer,
  instructions,
  context,
  value,
  onChange,
  composition,
}: {
  item: RevisionItem;
  answer?: SourceAnswer;
  instructions: string;
  context: string;
  value: string;
  onChange: (value: string) => void;
  composition?: boolean;
}) {
  const writing = !!item.writing || !!composition;
  const semantic =
    answer?.kind === "suggested" || /\b(combine|rewrite|change|join|agree)\b/i.test(item.question);
  return (
    <li
      data-revision-question={item.id}
      className="min-w-0 rounded-xl border border-border bg-background p-4"
    >
      <p lang="en" className="whitespace-pre-line text-sm font-medium leading-relaxed">
        {!/^[a-e]\./.test(item.question) && `${item.number}. `}
        <Emphasis item={item} />
      </p>
      <p lang="my" className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {item.translationMy}
      </p>
      {item.sourceNote && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-950">{item.sourceNote}</p>
      )}
      {item.clues && (
        <ol className="mt-3 list-inside list-decimal space-y-1 rounded-lg bg-secondary p-3 text-sm">
          {item.clues.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ol>
      )}
      {item.example && (
        <p className="my-3 whitespace-pre-line rounded-lg bg-secondary p-3 text-sm">
          {item.example.english}
          <span lang="my" className="mt-2 block text-muted-foreground">
            {item.example.myanmar}
          </span>
        </p>
      )}
      <div className="mt-3">
        {writing ? (
          <>
            <Textarea
              aria-label={`Your answer: ${item.question}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={item.lineTarget ?? 6}
              maxLength={12000}
              placeholder="Write your own verse…"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {value.split(/\r?\n/).filter((line) => line.trim()).length} / {item.lineTarget ?? 6}{" "}
              lines · ကိုယ်ပိုင်ကဗျာကို ရေးပါ။
            </p>
            <Grade11AIReview
              question={item.question}
              instructions={instructions}
              context={context}
              answer={value}
              writing
              checkLabel="Check Answer"
            />
          </>
        ) : (
          <Grade11QuestionAnswer
            question={item.question}
            instructions={instructions}
            context={context}
            answerKey={answer}
            value={value}
            onChange={onChange}
            fullSentence={semantic || !answer}
            preferLocalMatch
          />
        )}
      </div>
    </li>
  );
}

/** Existing session draft pattern, with stable per-lesson/item keys for all eight supplements. */
function RevisionWorkspace({ number, poetry }: { number: number; poetry: boolean }) {
  const data = poetry ? G11_POEMS[number - 1] : G11_REVIEWS[number - 1];
  const poem = poetry ? G11_POEMS[number - 1] : null;
  const keys = (poetry ? G11_POEM_KEYS : G11_REVIEW_KEYS)[number - 1];
  const id = `${poetry ? "poem" : "review"}-${number}`;
  const context = grade11RevisionContext(id);
  const storageKey = `grade11:${id}:drafts:v1`;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const drafts = useRef<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let next: Record<string, string> = {};
    try {
      const raw: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
      if (raw && typeof raw === "object" && !Array.isArray(raw))
        next = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string"));
    } catch {
      /* Drafts stay usable without storage. */
    }
    drafts.current = next;
    setAnswers(next);
    setLoaded(true);
  }, [storageKey]);
  const update = (item: string, value: string) => {
    const next = { ...drafts.current, [item]: value };
    drafts.current = next;
    setAnswers(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Optional session drafts. */
    }
  };
  if (!data) return null;
  const tasks = data.groups.flatMap((g) => g.items);
  const done = tasks.filter((q) => answers[q.id]?.trim()).length;
  return (
    <div className="space-y-5" data-grade11-revision={id}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p>
          {poetry ? `Poem ${number}` : `Review ${number} · Units ${3 * number - 2}–${3 * number}`} ·
          စာမျက်နှာ {data.textbookPage}
        </p>
        <p aria-live="polite">
          {done} / {tasks.length} ဖြေဆိုထားသည်
        </p>
      </div>
      <nav aria-label="Revision exercises" className="flex flex-wrap gap-2">
        {data.groups.map((g) => (
          <a
            className="rounded-full border border-border px-3 py-2 text-sm hover:bg-secondary"
            key={g.code}
            href={`#${id}-${g.code}`}
          >
            {g.code === "Pre-reading" ? "Pre-reading" : `Exercise ${g.code}`}
          </a>
        ))}
      </nav>
      <div className={poem ? "grid min-w-0 items-start gap-6 lg:grid-cols-2" : "space-y-5"}>
        {poem && (
          <article className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <h2 className="text-2xl font-bold">{poem.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{poem.author}</p>
            <div className="mt-5 space-y-5">
              {poem.stanzas.map((stanza, i) => (
                <section
                  key={i}
                  aria-label={`Stanza ${i + 1}`}
                  className="rounded-xl bg-background p-3"
                >
                  {stanza.map((line, j) => (
                    <p key={j} lang="en" className="leading-loose">
                      {line.english}
                    </p>
                  ))}
                  <ToggleReveal
                    label="Translate Stanza"
                    hiddenLabel="Hide Burmese"
                    icon={Languages}
                  >
                    {stanza.map((line, j) => (
                      <p key={j} lang="my" className="leading-loose">
                        {line.myanmar}
                      </p>
                    ))}
                  </ToggleReveal>
                </section>
              ))}
            </div>
            <h3 className="mt-6 flex items-center gap-2 font-semibold">
              <BookOpen className="h-4 w-4" />
              Glossary
            </h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {poem.glossary.map((g) => (
                <div key={g.word} className="rounded-lg border border-border p-3 text-sm">
                  <dt className="font-bold">{g.word}</dt>
                  <dd className="mt-1">{g.meaning}</dd>
                  <dd lang="my" className="mt-1 text-muted-foreground">
                    {g.meaningMy}
                  </dd>
                </div>
              ))}
            </dl>
            {poem.sourceNote && (
              <p
                lang="my"
                className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-950"
              >
                {poem.sourceNote}
              </p>
            )}
          </article>
        )}
        <section className="min-w-0 space-y-5" aria-label="Revision questions">
          <p lang="my" className="text-xs leading-relaxed text-muted-foreground">
            မြန်မာပြန်သည် လေ့လာရန် အထောက်အကူဖြစ်သည်။ Reveal တွင်ပြသည့် အဖြေများသည်
            မူရင်းကိုအခြေခံသော အကြံပြုအဖြေများဖြစ်ပြီး တရားဝင်အဖြေလွှာ မဟုတ်ပါ။ အဓိပ္ပာယ်တူ
            အဖြေများကို လက်ခံစစ်ဆေးပါသည်။
          </p>
          <fieldset disabled={!loaded} className="space-y-5">
            <legend className="sr-only">Your answers</legend>
            {data.groups.map((group: RevisionGroup) => (
              <section
                id={`${id}-${group.code}`}
                key={group.code}
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <p className="text-xs font-semibold uppercase text-primary">{group.code}</p>
                <h3 className="mt-2 font-semibold">{group.instruction}</h3>
                <p lang="my" className="mt-2 text-sm text-muted-foreground">
                  {group.instructionMy}
                </p>
                {group.sourceNote && (
                  <p lang="my" className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-950">
                    {group.sourceNote}
                  </p>
                )}
                {group.wordBox && (
                  <div aria-label="Textbook word bank" className="mt-4 flex flex-wrap gap-2">
                    {group.wordBox.map((word, i) => (
                      <span
                        key={word}
                        className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                      >
                        {word}
                        {group.wordBoxMy?.[i] && (
                          <span lang="my" className="block text-xs">
                            {group.wordBoxMy[i]}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {group.example && (
                  <div className="mt-4 whitespace-pre-line rounded-lg bg-secondary p-3 text-sm">
                    <p>{group.example.english}</p>
                    <p lang="my" className="mt-2 text-muted-foreground">
                      {group.example.myanmar}
                    </p>
                  </div>
                )}
                <ol className="mt-4 space-y-4">
                  {group.items.map((item) => (
                    <RevisionQuestion
                      key={item.id}
                      item={item}
                      answer={keys[item.id]}
                      instructions={group.instruction}
                      context={context}
                      value={answers[item.id] ?? ""}
                      onChange={(value) => update(item.id, value)}
                      composition={poetry && number === 1 && group.code === "D"}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </fieldset>
        </section>
      </div>
    </div>
  );
}
export function Grade11ReviewView({ number = 1 }: { number?: number }) {
  return <RevisionWorkspace key={`review-${number}`} number={number} poetry={false} />;
}
export function Grade11PoemView({ number = 1 }: { number?: number }) {
  return <RevisionWorkspace key={`poem-${number}`} number={number} poetry />;
}
export function Grade11Review1View() {
  return <Grade11ReviewView number={1} />;
}
export function Grade11Poem1View() {
  return <Grade11PoemView number={1} />;
}
