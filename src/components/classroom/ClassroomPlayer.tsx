import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { RequireSignIn } from "@/components/RequireSignIn";
import { AnswerTryBox } from "@/components/lesson/ExerciseKit";
import { Button } from "@/components/ui/button";
import { readingFinished, spokenStepAt, type ReadingLesson } from "@/lib/classroom/types";
import { isClassroomCancellation } from "@/lib/classroom/cancellation";
import { classroomRequest, useClassroom } from "./useClassroom";
import {
  Pause,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  BookOpen,
} from "lucide-react";

const labels = {
  english: "English sentence",
  translation: "မြန်မာဘာသာပြန်",
  explanation: "ဆရာရှင်းပြချက်",
  reasoning: "Vocabulary / Grammar — ဘာကြောင့်လဲ",
};
export function ClassroomPlayer({ lesson }: { lesson: ReadingLesson }) {
  const { session } = useAuth();
  return (
    <Player
      key={`${lesson.id}:${session?.user.id ?? "guest"}`}
      lesson={lesson}
      userId={session?.user.id}
    />
  );
}
function Player({ lesson, userId }: { lesson: ReadingLesson; userId?: string }) {
  const engine = useClassroom(lesson, userId);
  const { segment, step, narration: text } = spokenStepAt(lesson, engine.progress.cursor);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const askAbort = useRef<AbortController | null>(null);
  useEffect(() => () => askAbort.current?.abort(), []);
  const finished = readingFinished(lesson, engine.progress.completed);
  const ask = async () => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setAnswer("");
    engine.setError("");
    engine.setNotice("");
    askAbort.current = new AbortController();
    try {
      const response = await classroomRequest(
        lesson.grade,
        { action: "ask", cursor: engine.progress.cursor, question },
        askAbort.current.signal,
      );
      const data = await response.json();
      setAnswer(data.answer);
    } catch (err) {
      if (!askAbort.current.signal.aborted) {
        if (isClassroomCancellation(err))
          engine.setNotice("မေးခွန်းချိတ်ဆက်မှု ခဏရပ်သွားပါသည်။ ပြန်မေးနိုင်ပါတယ်။");
        else engine.setError(err instanceof Error ? err.message : "AI unavailable");
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Adaptive classroom · Grade {lesson.grade} · Unit 1
        </p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">{lesson.title}</h1>
        <p className="mt-3 text-sm leading-relaxed">
          English တစ်ကြောင်း → မြန်မာပြန် → ဆရာရှင်းပြ → Vocabulary/Grammar → နောက်တစ်ကြောင်း
        </p>
        {!engine.published && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            ဆရာစစ်ဆေးရန် မူကြမ်း — စာသားနမူနာကို ဖတ်နိုင်ပါတယ်။ ဆရာအတည်ပြုပြီးမှ အတန်းစနိုင်ပါမယ်။
          </p>
        )}
        {!userId && (
          <RequireSignIn>
            <span />
          </RequireSignIn>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Paragraph {segment.paragraph} · Sentence {Math.floor(engine.progress.cursor / 4) + 1}{" "}
              / {lesson.segments.length}
            </span>
            <span>
              {engine.progress.completed.length} / {lesson.segments.length * 4} steps
            </span>
          </div>
          <progress
            className="mt-3 h-2 w-full accent-primary"
            aria-label="Reading progress"
            value={engine.progress.completed.length}
            max={lesson.segments.length * 4}
          />
          <p className="mt-6 text-xs font-semibold text-primary">{labels[step]}</p>
          <p
            lang={step === "english" ? "en" : "my"}
            className="mt-3 whitespace-pre-wrap text-xl leading-loose"
            aria-live="polite"
          >
            {text}
          </p>
          {step !== "english" && (
            <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
              {segment.english}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => engine.move(-1)}
              disabled={engine.progress.cursor === 0 || busy}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={engine.playing || engine.loading ? engine.pause : engine.resume}
              disabled={!engine.published || !engine.ready || !userId || busy}
            >
              {engine.playing || engine.loading ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {engine.loading ? "ပြင်ဆင်နေသည်…" : engine.playing ? "Pause" : "Resume / Play"}
            </Button>
            <Button
              variant="outline"
              onClick={engine.repeat}
              disabled={!engine.published || !userId || busy || engine.loading}
            >
              <RotateCcw className="h-4 w-4" />
              Repeat
            </Button>
            <Button
              variant="outline"
              onClick={() => engine.move(1)}
              disabled={engine.progress.cursor === lesson.segments.length * 4 - 1 || busy}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={engine.manual}
              onChange={engine.toggleManual}
              disabled={busy}
            />
            Manual Mode — ကိုယ်တိုင်တစ်ဆင့်ချင်း သင်မယ်
          </label>
          {engine.manual && (
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => engine.move(1, true)}
              disabled={busy}
            >
              <BookOpen className="h-4 w-4" />
              ဖတ်ပြီး၊ နောက်တစ်ဆင့်
            </Button>
          )}
          <p className="mt-4 text-xs text-muted-foreground" role="status">
            {engine.saveStatus}
          </p>
          {engine.notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {engine.notice}
            </p>
          )}
          {engine.error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {engine.error}
            </p>
          )}
        </article>
        <aside className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">ဆရာဇီးကွက်ကို မေးမယ်</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            မေးချိန်မှာ သင်ခန်းစာကို ခဏရပ်ထားပေးမယ်။ ပြီးရင် Resume နှိပ်ပြီး မူလနေရာက
            ပြန်ဆက်နိုင်ပါတယ်။
          </p>
          {!asking ? (
            <Button
              variant="outline"
              disabled={!userId || !engine.published}
              onClick={() => {
                engine.pause();
                setAsking(true);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Ask Teacher
            </Button>
          ) : (
            <>
              <label className="block text-sm" htmlFor="classroom-question">
                ဒီဝါကျနဲ့ပတ်သက်ပြီး မေးပါ
              </label>
              <textarea
                id="classroom-question"
                className="min-h-28 w-full rounded-lg border border-input bg-background p-3 text-sm"
                maxLength={1000}
                value={question}
                disabled={busy}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                မေးခွင့် ၁ ကြိမ် အသုံးပြုမည်။ မအောင်မြင်ရင် ပြန်လွှတ်ပေးပါမည်။
              </p>
              <Button disabled={busy || !question.trim()} onClick={() => void ask()}>
                {busy ? "ဖြေနေသည်…" : "မေးမယ်"}
              </Button>
              {answer && (
                <p className="whitespace-pre-wrap text-sm leading-loose" lang="my">
                  {answer}
                </p>
              )}
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setAsking(false);
                  engine.resume();
                }}
              >
                သင်ခန်းစာ ပြန်ဆက်မယ်
              </Button>
            </>
          )}
        </aside>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Reading comprehension</h2>
        {!finished ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Reading passage အပြည့်အစုံရဲ့ အဆင့်အားလုံးပြီးမှ မေးခွန်းတွေ ဖွင့်ပေးပါမယ်။ Next ဖြင့်
            ကျော်ကြည့်ရုံနဲ့ ပြီးဆုံးကြောင်း မမှတ်ပါဘူး။
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              လေ့ကျင့်ရန်မေးခွန်းများ — တရားဝင်အမှတ်ပေးစာမေးပွဲ မဟုတ်ပါ။
            </p>
            {lesson.questions.map((q) => (
              <div key={q.id}>
                <p className="mb-2 text-sm">{q.question}</p>
                <AnswerTryBox correct={q.answer} question={q.question} />
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          ဒီနမူနာမှာ Reading ကိုသာ သင်ကြားပါသည်။ Unit တစ်ခုလုံးပြီးမှပေးမည့် Homework ကို
          မထုတ်ပေးသေးပါ။
        </p>
      </section>
    </div>
  );
}
