import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Headphones,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/components/AuthGate";
import { RequireSignIn } from "@/components/RequireSignIn";
import { SayaOwlAvatar } from "@/components/SayaOwlAvatar";
import { Button } from "@/components/ui/button";
import { AnswerTryBox } from "@/components/lesson/ExerciseKit";
import { teachingExamples } from "@/lib/classroom/teaching-dialogue";
import { getReadingLesson } from "@/lib/classroom/lessons";
import { readingFinished, spokenStepAt, type ReadingLesson } from "@/lib/classroom/types";
import { dailyAssignment, myanmarDay, studyPlanVersion } from "@/lib/classroom/study-plan";
import { onDemandReadingPilot } from "@/lib/classroom/pilot";
import { ReadingWhiteboard } from "./ReadingWhiteboard";
import { classroomRequest, useClassroom } from "./useClassroom";

type StudyPlan = ReturnType<typeof dailyAssignment> & {
  grade: 10 | 11;
  planVersion: string;
  lessonId: string;
  lessonVersion: string;
};
async function studyRequest(body?: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch("/api/study-plan", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Account study plan ကို ယခု ချိတ်ဆက်မရပါ။ ဆရာထံ အကြောင်းကြားပါ။");
  return (await response.json()).plan as StudyPlan | null;
}
export function DailyClassroom({ autoStart = false }: { autoStart?: boolean }) {
  const { session, ready } = useAuth();
  return (
    <DailyClassHome
      key={session?.user.id ?? "guest"}
      userId={session?.user.id}
      authReady={ready}
      autoStart={autoStart}
    />
  );
}
function DailyClassHome({
  userId,
  authReady,
  autoStart,
}: {
  userId?: string;
  authReady: boolean;
  autoStart: boolean;
}) {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [grade, setGrade] = useState<10 | 11>(10);
  const [error, setError] = useState("");
  const [room, setRoom] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const abort = new AbortController();
    void studyRequest(undefined, abort.signal)
      .then((data) => {
        if (!abort.signal.aborted) {
          setPlan(data);
          if (data && autoStart) setRoom(true);
        }
      })
      .catch((err) => {
        if (!abort.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [userId, autoStart]);
  const enroll = async () => {
    setLoading(true);
    setError("");
    try {
      setPlan(await studyRequest({ action: "enroll", grade }));
      if (autoStart) setRoom(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan unavailable");
    } finally {
      setLoading(false);
    }
  };
  const selectedLesson = getReadingLesson(plan?.grade ?? grade)!;
  const previewPlan: StudyPlan = {
    grade,
    planVersion: studyPlanVersion(selectedLesson),
    lessonId: selectedLesson.id,
    lessonVersion: selectedLesson.version,
    ...dailyAssignment(selectedLesson, [], myanmarDay()),
  };
  const activePlan = plan ?? previewPlan;
  if (room)
    return (
      <TeacherRoom
        key={`${selectedLesson.id}:${activePlan.session.index}:${userId ?? "guest"}`}
        lesson={selectedLesson}
        plan={activePlan}
        userId={userId}
        onExit={() => setRoom(false)}
        onFinished={setPlan}
      />
    );
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="flex items-center gap-4">
        <SayaOwlAvatar state="ready" size={80} />
        <div>
          <p className="text-sm font-semibold text-primary">Saya Owl · သင့်ရဲ့နေ့စဉ်ဆရာ</p>
          <h1 className="mt-2 text-3xl font-bold leading-relaxed">
            ဒီနေ့အတန်းအတွက် အဆင်သင့်ပဲလား?
          </h1>
        </div>
      </div>
      <p className="max-w-2xl text-base leading-loose text-muted-foreground">
        ဘာသင်ရမလဲဆိုတာ ဆရာဇီးကွက်က စီစဉ်ပေးမယ်။ သင်က နားထောင်ပြီး လိုက်လေ့လာရုံပါပဲ။
        နားမလည်တဲ့နေရာမှာ ဆရာကို ကြားဖြတ်မေးနိုင်ပါတယ်။
      </p>
      {!authReady || loading ? (
        <p role="status">သင့်အတန်းအစီအစဉ်ကို ပြင်ဆင်နေသည်…</p>
      ) : (
        <>
          {!plan && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">ပထမဆုံးအကြိမ် — သင့်အတန်းကို ရွေးပါ</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Account ထဲသိမ်းပြီးရင် နောက်နေ့တွေမှာ ပြန်ရွေးစရာ မလိုပါဘူး။
              </p>
              <div className="mt-4 flex gap-3" role="group" aria-label="Choose grade">
                {([10, 11] as const).map((g) => (
                  <Button
                    key={g}
                    variant={grade === g ? "default" : "outline"}
                    aria-pressed={grade === g}
                    onClick={() => setGrade(g)}
                  >
                    Grade {g}
                  </Button>
                ))}
              </div>
              {userId && !error && (
                <Button className="mt-4" onClick={() => void enroll()}>
                  ဒီအတန်းနဲ့ စာစသင်မယ်
                </Button>
              )}
              {!userId && (
                <RequireSignIn>
                  <span />
                </RequireSignIn>
              )}
            </section>
          )}
          {(plan || !userId || error) && (
            <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6">
              <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                <CalendarDays className="h-4 w-4" />
                Grade {activePlan.grade} · အတန်း {activePlan.session.index + 1}
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                {activePlan.allDone
                  ? "Reading အတန်းများ အားလုံးပြီးပါပြီ"
                  : activePlan.todayDone
                    ? "ဒီနေ့အတန်းပြီးပါပြီ — ပြန်လေ့လာမယ်"
                    : "ဒီနေ့ ဆရာသင်ပေးမယ့်အကြောင်း"}
              </h2>
              <p className="mt-3 text-lg">{selectedLesson.title}</p>
              <p className="mt-2 text-sm leading-loose text-muted-foreground">
                {activePlan.session.objective}
              </p>
              <Button
                size="lg"
                className="mt-5 min-h-14 gap-2 text-base"
                onClick={() => setRoom(true)}
              >
                <Play className="h-5 w-5" />
                {plan
                  ? activePlan.todayDone
                    ? "ဒီနေ့အတန်း ပြန်နားထောင်မယ်"
                    : "အတန်းစမယ်"
                  : "အတန်းပုံစံ ကြည့်မယ်"}
              </Button>
              {!plan && (
                <p className="mt-3 text-xs text-muted-foreground">
                  စာသားမူကြမ်းနမူနာပါ။ အသံနဲ့ Account အတန်းစနစ် အဆင်သင့်ဖြစ်ကြောင်း မဆိုလိုပါ။
                </p>
              )}
            </section>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <section className="rounded-2xl border border-border p-5">
        <h2 className="font-semibold">သင့် Study Plan</h2>
        <ol className="mt-4 space-y-3">
          {activePlan.classes.map((day) => (
            <li
              key={day.index}
              className={`flex gap-3 rounded-xl p-3 text-sm ${day.index === activePlan.session.index ? "bg-primary/10" : "bg-muted/40"}`}
            >
              <span className="shrink-0 font-semibold">အတန်း {day.index + 1}</span>
              <span>{day.objective}</span>
              {day.index < activePlan.completedClasses && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-loose text-muted-foreground">
          မလာနိုင်တဲ့နေ့မှာ သင်ခန်းစာကျော်မသွားပါဘူး။ နောက်တစ်ကြိမ်ဝင်လာရင် မပြီးသေးတဲ့အတန်းက
          ဆက်သင်မယ်။ Reading အပြည့်ပြီးမှ နားလည်မှုမေးခွန်းတွေ ဖြေရပါမယ်။
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          လက်ရှိပြင်ဆင်ထားသည် — Unit 1 Reading။ Vocabulary၊ Grammar၊ Writing၊ Listening၊ Speaking
          အတန်းများကို ဆရာစစ်ဆေးပြီးမှ ဆက်ထည့်မည်။
        </p>
      </section>
      <Link to="/" className="inline-block text-sm text-primary">
        စာအုပ်နဲ့ ကိုယ်တိုင်ဆက်လေ့လာရန် →
      </Link>
    </div>
  );
}

function TeacherRoom({
  lesson,
  plan,
  userId,
  onExit,
  onFinished,
}: {
  lesson: ReadingLesson;
  plan: StudyPlan;
  userId?: string;
  onExit: () => void;
  onFinished: (plan: StudyPlan | null) => void;
}) {
  const [guidedChecks, setGuidedChecks] = useState(false);
  const engine = useClassroom(
    lesson,
    userId,
    plan.session,
    guidedChecks,
    onDemandReadingPilot(lesson),
  );
  const { segment, step, narration } = spokenStepAt(lesson, engine.progress.cursor);
  const stage = engine.progress.cursor % 4;
  const [started, setStarted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(plan.todayDone || plan.allDone);
  const [completionError, setCompletionError] = useState("");
  const finishClaimed = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const completedSteps = Array.from(
    { length: plan.session.end - plan.session.start },
    (_, i) => i + plan.session.start,
  ).filter((i) => engine.progress.completed.includes(i)).length;
  const classDone =
    !reviewing &&
    engine.waitingAt === null &&
    completedSteps === plan.session.end - plan.session.start;
  useEffect(() => {
    if (reviewing && engine.passCompleted) setReviewing(false);
  }, [reviewing, engine.passCompleted]);
  const resumeRef = useRef(engine.resume);
  resumeRef.current = engine.resume;
  // Entering from the plan is the single start action; the teacher handles every subsequent step.
  useEffect(() => {
    if (!started && engine.ready && engine.published && userId && !plan.todayDone && !classDone) {
      setStarted(true);
      resumeRef.current();
    }
  }, [started, engine.ready, engine.published, userId, plan.todayDone, classDone]);
  useEffect(() => () => abort.current?.abort(), []);
  const finish = useCallback(async () => {
    if (!userId || completed || !classDone || finishClaimed.current) return;
    finishClaimed.current = true;
    try {
      await engine.flushProgress();
      const next = await studyRequest({ action: "finish", session: plan.session.index });
      setCompleted(true);
      onFinished(next);
    } catch (err) {
      setCompletionError(err instanceof Error ? err.message : "Class save failed");
      finishClaimed.current = false;
    }
  }, [userId, completed, classDone, engine, plan.session.index, onFinished]);
  useEffect(() => {
    if (classDone && !completed && !completionError) void finish();
  }, [classDone, completed, completionError, finish]);
  const ask = async () => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setAnswer("");
    engine.setError("");
    abort.current = new AbortController();
    try {
      const response = await classroomRequest(
        lesson.grade,
        { action: "ask", cursor: engine.progress.cursor, question },
        abort.current.signal,
      );
      setAnswer((await response.json()).answer);
    } catch (err) {
      if (!abort.current.signal.aborted)
        engine.setError(err instanceof Error ? err.message : "AI unavailable");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">
            Grade {lesson.grade} · အတန်း {plan.session.index + 1}
          </p>
          <h1 className="mt-1 text-xl font-bold">{lesson.title}</h1>
        </div>
        <Button
          variant="ghost"
          onClick={async () => {
            engine.pause();
            await engine.flushProgress();
            onExit();
          }}
        >
          ခဏနားမယ်
        </Button>
      </header>
      {lesson.teachingRevision && (
        <p className="text-sm leading-loose text-muted-foreground">
          သင်ကြားပုံအသစ် · မူလအတန်းမှတ်တမ်းများကို မဖျက်ဘဲ ဒီသင်ခန်းစာအတွက် မှတ်တမ်းသီးခြား
          သိမ်းမည်။
        </p>
      )}
      {engine.preparing && (
        <section
          role="status"
          aria-label="Class preparation"
          className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5"
        >
          <h2 className="font-semibold">အတန်းကို ပြင်ဆင်နေပါတယ်…</h2>
          <p className="text-sm leading-loose">
            ဒီအတန်းအသံတွေ အဆင်သင့်ဖြစ်ပြီးမှ ဆက်တိုက်သင်ပေးမယ်။ ပြင်ဆင်ပြီးသားအသံတွေကို
            ပြန်သုံးပါမယ်။
          </p>
          <progress
            className="h-3 w-full"
            aria-label="အတန်းအသံ အဆင်သင့်ဖြစ်မှု"
            value={engine.preparation.ready}
            max={engine.preparation.total}
          />
          <p className="text-sm">
            {Math.round((engine.preparation.ready / engine.preparation.total) * 100)}% ပြင်ဆင်ပြီး
          </p>
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 lg:flex-col lg:justify-start lg:py-9">
          <SayaOwlAvatar
            state={
              engine.playing
                ? "speaking"
                : engine.loading || busy
                  ? "thinking"
                  : asking
                    ? "listening"
                    : "ready"
            }
            size={100}
          />
          <div className="lg:text-center">
            <h2 className="font-bold">ဆရာဇီးကွက်</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {engine.playing
                ? "သင်ကြားနေသည်…"
                : engine.preparing
                  ? "အတန်းကို ပြင်ဆင်နေပါတယ်…"
                  : engine.loading
                    ? "အသံချိတ်ဆက်နေသည်…"
                    : asking
                      ? "သင့်မေးခွန်းကို နားထောင်နေပါတယ်"
                      : "အတူတူ လေ့လာကြမယ်"}
            </p>
          </div>
        </aside>
        {onDemandReadingPilot(lesson) ? (
          <ReadingWhiteboard
            lesson={lesson}
            cursor={engine.progress.cursor}
            completed={completedSteps}
            total={plan.session.end - plan.session.start}
            transcript={narration}
          />
        ) : (
          <article
            aria-label="Classroom whiteboard"
            className="relative min-h-[28rem] overflow-hidden rounded-3xl border-8 border-stone-700 bg-emerald-950 p-5 text-emerald-50 shadow-xl md:p-8"
          >
            <div className="mb-5 flex items-center justify-between border-b border-emerald-700/50 pb-3 text-xs text-emerald-200">
              <span>ဒီနေ့မှတ်စု · Sentence {Math.floor(engine.progress.cursor / 4) + 1}</span>
              <span>
                {completedSteps} / {plan.session.end - plan.session.start}
              </span>
            </div>
            <p
              className={`text-xl font-semibold leading-loose md:text-2xl ${stage === 0 && engine.playing ? "text-amber-200" : ""}`}
            >
              {segment.english}
            </p>
            {stage >= 1 && (
              <p
                lang="my"
                className={`mt-5 text-base leading-loose ${stage === 1 ? "text-amber-200" : "text-emerald-100"}`}
              >
                {segment.translation}
              </p>
            )}
            {stage >= 2 && (
              <div className="mt-5 rounded-xl border-l-4 border-amber-300 bg-emerald-900/60 p-4">
                <p className="mb-2 text-xs font-semibold text-amber-200">ဆရာရှင်းပြမယ်</p>
                <p lang="my" className="whitespace-pre-wrap text-base leading-loose">
                  {segment.explanation}
                </p>
              </div>
            )}
            {stage >= 3 && (
              <div className="mt-4 rounded-xl bg-black/15 p-4">
                <p className="mb-2 text-xs font-semibold text-amber-200">
                  Vocabulary / Grammar · ဘာကြောင့်လဲ?
                </p>
                <p lang="my" className="whitespace-pre-wrap text-base leading-loose">
                  {segment.reasoning}
                </p>
              </div>
            )}
            <div className="mt-7 flex items-start gap-2 border-t border-emerald-700/50 pt-4 text-sm leading-loose text-emerald-200">
              <Headphones className="mt-1 h-4 w-4 shrink-0" />
              <p aria-live="polite">
                {engine.playing
                  ? narration
                  : engine.waitingAt !== null || needsHelp
                    ? "မရှင်းသေးတဲ့အချက်ကို အတူပြန်ကြည့်ကြမယ်။"
                    : classDone
                      ? plan.session.closing
                      : plan.session.opening}
              </p>
            </div>
          </article>
        )}
      </div>
      {!engine.published && (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-loose text-amber-950"
        >
          ဆရာက ဒီသင်ခန်းစာကို ပြင်ဆင်အတည်ပြုနေဆဲပါ။ အတည်ပြုပြီးမှ အတန်းစနိုင်ပါမယ်။
        </p>
      )}
      {(engine.waitingAt !== null || needsHelp) && (
        <section
          aria-label="Teacher dialogue"
          className="rounded-2xl border border-primary/30 bg-card p-6"
        >
          <h2 className="font-semibold">ဒီဝါကျကို နားလည်ပြီလား?</h2>
          <p className="mt-3 leading-loose">
            မရှင်းသေးရင် ဆရာနဲ့ ပြန်ကြည့်ကြမယ်။ ဒါက အမှတ်ပေးမေးခွန်း မဟုတ်ပါဘူး။
          </p>
          {needsHelp && (
            <div role="status" className="mt-4 space-y-3 rounded-xl bg-muted p-4 leading-loose">
              <p>{segment.translation}</p>
              <p>{teachingExamples[segment.id]?.example ?? segment.english}</p>
              <p lang="my">
                {teachingExamples[segment.id]?.explanation ??
                  `${segment.explanation} ${segment.reasoning}`}
              </p>
              <p className="text-xs text-muted-foreground">
                ဖြည့်စွက်ရှင်းလင်းချက် စာသားပါ။ အသံအသစ် မထုတ်ပါ။ AI credit မသုံးပါ။
              </p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setNeedsHelp(true)}>
              ဆရာ၊ ထပ်ရှင်းပြပါ
            </Button>
            <Button
              onClick={() => {
                setNeedsHelp(false);
                if (engine.waitingAt === plan.session.end - 1) setReviewing(false);
                if (engine.waitingAt !== null) engine.continueTeaching();
                else engine.resume();
              }}
            >
              နားလည်ပြီ၊ ဆက်သင်မယ်
            </Button>
          </div>
        </section>
      )}
      <label className="flex items-center justify-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={guidedChecks}
          onChange={(event) => setGuidedChecks(event.target.checked)}
        />
        ဝါကျတစ်ကြောင်းပြီးတိုင်း နားလည်မှု စစ်ပြီးသင်မယ်
      </label>
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Button
          size="lg"
          disabled={
            !engine.published ||
            !userId ||
            !engine.ready ||
            busy ||
            asking ||
            needsHelp ||
            engine.waitingAt !== null
          }
          onClick={
            engine.playing || engine.loading
              ? engine.pause
              : () => {
                  setStarted(true);
                  if (classDone) {
                    setReviewing(true);
                    engine.restart();
                  } else engine.resume();
                }
          }
        >
          {engine.playing || engine.loading ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          {engine.playing || engine.loading
            ? "ခဏရပ်မယ်"
            : classDone
              ? "ဒီနေ့အတန်း အစက ပြန်သင်မယ်"
              : "ဆရာနဲ့ ပြန်ဆက်သင်မယ်"}
        </Button>
        <Button
          variant="outline"
          disabled={!engine.published || !userId || busy || engine.loading}
          onClick={() => {
            setNeedsHelp(false);
            engine.repeat();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          ပြန်ရှင်းပြပါ
        </Button>
        <Button
          variant="outline"
          disabled={busy || !engine.ready}
          onClick={() => {
            engine.pause();
            setNeedsHelp(true);
          }}
        >
          ဥပမာနဲ့ ထပ်ရှင်းပြပါ
        </Button>
        <Button
          variant="outline"
          disabled={!engine.published || !userId || busy}
          onClick={() => {
            engine.pause();
            setAsking(true);
          }}
        >
          <MessageCircle className="h-4 w-4" />
          ဆရာ၊ မေးချင်ပါတယ်
        </Button>
      </div>
      <p role="status" className="text-center text-xs text-muted-foreground">
        {engine.saveStatus}
      </p>
      {engine.error && (
        <p role="alert" className="text-sm text-destructive">
          {engine.error}
        </p>
      )}
      {asking && (
        <section className="rounded-2xl border border-primary/30 bg-card p-5">
          <label htmlFor="daily-question" className="font-semibold">
            ဆရာကို မေးပါ — သင်ခန်းစာ ခဏရပ်ထားပါတယ်
          </label>
          <textarea
            id="daily-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={busy}
            maxLength={1000}
            className="mt-3 min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            တိုက်ရိုက် AI မေးခွင့် ၁ ကြိမ် အသုံးပြုပါမည်။
          </p>
          <div className="mt-3 flex gap-2">
            <Button disabled={busy || !question.trim()} onClick={() => void ask()}>
              {busy ? "ဆရာဖြေနေသည်…" : "မေးမယ်"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setAsking(false);
                if (engine.waitingAt === null && !needsHelp) engine.resume();
              }}
            >
              သင်ခန်းစာ ပြန်ဆက်မယ်
            </Button>
          </div>
          {answer && (
            <p lang="my" className="mt-4 whitespace-pre-wrap text-sm leading-loose">
              {answer}
            </p>
          )}
        </section>
      )}
      {classDone && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-bold">ဒီနေ့အတန်းပြီးပါပြီ</h2>
          <p className="mt-3 leading-loose">{plan.session.closing}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {completed
              ? plan.session.index === plan.classes.length - 1
                ? "Reading အတန်းများ ပြီးပါပြီ။ နောက် skill ကို ဆရာအဆင်သင့်ပြင်ဆင်ပြီးမှ ဆက်သင်ပါမယ်။"
                : "ဒီနေ့အတန်းမှတ်တမ်း သိမ်းပြီးပါပြီ။ နောက်နေ့မှာ ဆရာက နောက်အတန်းကို ဆက်သင်ပေးမယ်။"
              : userId
                ? "အတန်းမှတ်တမ်း သိမ်းနေသည်…"
                : "နမူနာလေ့လာမှုဖြစ်လို့ Account ထဲ မသိမ်းပါ။"}
          </p>
          {completionError && (
            <>
              <p role="alert" className="mt-3 text-destructive">
                {completionError}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setCompletionError("");
                  void finish();
                }}
              >
                မှတ်တမ်း ပြန်သိမ်းမယ်
              </Button>
            </>
          )}
        </section>
      )}
      {readingFinished(lesson, engine.progress.completed) && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">ဖတ်စာအပြည့်ပြီးပြီ — နားလည်မှုကို စမ်းကြည့်မယ်</h2>
          <div className="mt-4 space-y-5">
            {lesson.questions.map((q) => (
              <div key={q.id}>
                <p className="mb-2 text-sm">{q.question}</p>
                <AnswerTryBox question={q.question} correct={q.answer} />
              </div>
            ))}
          </div>
        </section>
      )}
      <details className="rounded-xl border border-border p-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground">
          စာသားနမူနာနဲ့ ကိုယ်တိုင်လေ့လာရန်
        </summary>
        <p className="mt-3 text-xs text-muted-foreground">
          အသံအတန်းအစားထိုးမှု မဟုတ်ပါ။ နမူနာဖတ်ရှုခြင်းအတွက်သာ ဖြစ်ပါတယ်။
        </p>
        <Button className="mt-3" variant="outline" onClick={() => engine.move(1, true)}>
          ဖတ်ပြီး၊ နောက်တစ်ဆင့်
        </Button>
        <a href={`/classroom/${lesson.grade}`} className="ml-4 text-primary underline">
          စာအုပ်အပြည့်ကြည့်မယ်
        </a>
      </details>
    </div>
  );
}
