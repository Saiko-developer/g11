import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { RequireSignIn } from "@/components/RequireSignIn";
import { Button } from "@/components/ui/button";
import { SayaOwlAvatar } from "@/components/SayaOwlAvatar";
import {
  UNIT_SKILLS,
  getUnitLesson,
  skillLabels,
  unitActivities,
  unitHomework,
  validUnitActivity,
  type UnitSkill,
} from "@/lib/classroom/unit-course";
import { spokenStepAt, type ReadingLesson } from "@/lib/classroom/types";
import { isClassroomCancellation } from "@/lib/classroom/cancellation";
import { ReadingWhiteboard } from "./ReadingWhiteboard";
import { classroomRequest, useClassroom } from "./useClassroom";

import { courseRequest, type CourseState } from "@/lib/classroom/unit-course-request";
type UnitClassroomProps = { grade: 10 | 11; unit: number; skill?: UnitSkill; autoStart: boolean };
export function UnitClassroom(props: UnitClassroomProps) {
  const { session } = useAuth();
  return (
    <UnitCourse
      key={`${session?.user.id ?? "guest"}:${props.grade}:${props.unit}:${props.skill ?? "resume"}`}
      {...props}
      userId={session?.user.id}
    />
  );
}
function UnitCourse({
  grade,
  unit,
  skill,
  autoStart,
  userId,
}: UnitClassroomProps & { userId?: string }) {
  const [course, setCourse] = useState<CourseState | null>(null);
  const [selected, setSelected] = useState<UnitSkill | "homework">(skill ?? "reading");
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const supported = grade === 10 && unit === 1;
  useEffect(() => {
    setCourse(null);
    setError("");
    if (!userId || !supported) {
      setLoading(false);
      return;
    }
    const abort = new AbortController();
    setLoading(true);
    void courseRequest(undefined, abort.signal)
      .then((data) => {
        if (abort.signal.aborted) return;
        setCourse(data);
        setSelected(skill ?? data.sections.find((s) => !s.completed)?.skill ?? "homework");
      })
      .catch((err) => {
        if (!abort.signal.aborted)
          setError(
            isClassroomCancellation(err)
              ? "ချိတ်ဆက်မှု ခဏရပ်သွားပါသည်။ ပြန်စမ်းနိုင်ပါတယ်။"
              : err.message,
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [userId, supported, skill, retry]);
  if (!supported)
    return (
      <section className="space-y-4 py-8">
        <h1 className="text-2xl font-bold">
          Grade {grade} · Unit {unit}
        </h1>
        <p>
          ဒီ Unit ရဲ့ Saya Owl Teaching ကို စစ်ဆေးပြင်ဆင်နေဆဲပါ။ Self-study ကို ဆက်လေ့လာနိုင်ပါတယ်။
        </p>
        <a
          className="text-primary underline"
          href={grade === 11 ? `/grade-11/unit-${unit}` : "/#lessons"}
        >
          Self-study ဖွင့်မယ်
        </a>
      </section>
    );
  return (
    <div className="space-y-5 py-6">
      <header className="flex items-center gap-4">
        <SayaOwlAvatar state="ready" size={64} />
        <div>
          <p className="text-sm text-primary">Grade 10 · Unit 1 · Saya Owl Teaching</p>
          <h1 className="text-2xl font-bold">Language: Skill, Tool, Form, and Function</h1>
          <a href="/#lessons" className="text-sm text-primary underline">
            Self-study ပြန်သွားမယ်
          </a>
        </div>
      </header>
      <p className="text-sm leading-loose text-muted-foreground">
        မပြီးသေးတဲ့ section က ဆက်သင်ပါမယ်။ ကိုယ်အဆင်ပြေသလောက် ဆက်သင်နိုင်ပြီး section ခြောက်ခုလုံး
        သင်ကြားလေ့ကျင့်ပြီးမှ Exam Practice Homework အပ်ပေးပါမယ်။
      </p>
      <nav aria-label="Unit teaching sections" className="flex flex-wrap gap-2">
        {UNIT_SKILLS.map((s) => (
          <Button
            key={s}
            variant={selected === s ? "default" : "outline"}
            aria-pressed={selected === s}
            onClick={() => setSelected(s)}
          >
            {skillLabels[s]}
            {course?.sections.find((r) => r.skill === s)?.completed ? " ✓" : ""}
          </Button>
        ))}
        <Button
          variant={selected === "homework" ? "default" : "outline"}
          aria-pressed={selected === "homework"}
          onClick={() => setSelected("homework")}
        >
          Homework {course?.homework ? "✓" : "🔒"}
        </Button>
      </nav>
      {!userId && (
        <RequireSignIn>
          <span />
        </RequireSignIn>
      )}
      {loading ? (
        <p role="status">သင့် Unit မှတ်တမ်း ပြန်ယူနေသည်…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => setRetry((r) => r + 1)}>ပြန်စမ်းမယ်</Button>
        </div>
      ) : selected === "homework" ? (
        <UnitHomework key={`${userId}:homework`} course={course} onSaved={setCourse} />
      ) : (
        <UnitSection
          key={`${userId}:${selected}`}
          lesson={getUnitLesson(10, 1, selected)!}
          skill={selected}
          userId={userId}
          saved={course?.sections.find((s) => s.skill === selected)}
          autoStart={autoStart}
          onCompleted={(next) => {
            setCourse(next);
            setSelected(next.sections.find((s) => !s.completed)?.skill ?? "homework");
          }}
        />
      )}
    </div>
  );
}
function UnitSection({
  lesson,
  skill,
  userId,
  saved,
  autoStart,
  onCompleted,
}: {
  lesson: ReadingLesson;
  skill: UnitSkill;
  userId?: string;
  saved?: CourseState["sections"][number];
  autoStart: boolean;
  onCompleted: (course: CourseState) => void;
}) {
  const total = lesson.segments.length * 4;
  const firstMissing = Array.from({ length: total }, (_, i) => i).find(
    (i) => !saved?.steps.includes(i),
  );
  const [block, setBlock] = useState(Math.floor((firstMissing ?? saved?.cursor ?? 0) / 16));
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});
  const [practised, setPractised] = useState(saved?.practised ?? false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activity, setActivity] = useState(firstMissing === undefined && !!saved);
  const [replay, setReplay] = useState(false);
  const saveActivity = async (finish: boolean) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await courseRequest({
        action: finish ? "finish_section" : "save_activity",
        skill,
        answers,
        practised,
      });
      if (finish) onCompleted(next);
      else setNotice("လေ့ကျင့်မှုမူကြမ်း Account ထဲ သိမ်းပြီးပါပြီ။");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-5" aria-label={`${skillLabels[skill]} teaching`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {skillLabels[skill]} · {lesson.title}
        </h2>
        <a className="text-sm text-primary underline" href={`/practice/1/${skill}`}>
          စာအုပ် section အပြည့် ကိုယ်တိုင်လေ့လာမယ်
        </a>
      </div>
      {!activity && (
        <UnitTeachingBlock
          key={`${block}:${replay}`}
          lesson={lesson}
          userId={userId}
          start={block * 16}
          end={Math.min(total, block * 16 + 16)}
          autoStart={autoStart || block > 0 || replay}
          review={replay}
          onDone={() => {
            if ((block + 1) * 16 < total) setBlock((b) => b + 1);
            else setActivity(true);
          }}
        />
      )}
      {activity && (
        <>
          <p className="rounded-xl bg-primary/10 p-4">
            {skill === "reading"
              ? "ဖတ်စာအပြည့်ပြီးပါပြီ — အခု comprehension ဖြေကြည့်မယ်။"
              : "ဆရာရှင်းပြချက်ပြီးပါပြီ — အခု ကိုယ်တိုင် လေ့ကျင့်ကြမယ်။"}
          </p>
          {skill === "listening" && (
            <div className="space-y-3 rounded-xl border p-4">
              <p>မူရင်း Unit 1 recording — နားထောင်ပြီး စာအုပ် Activities A–C ကို လုပ်ပါ။</p>
              <audio
                controls
                preload="none"
                src="/audio/unit1.mp3"
                onEnded={() => setPractised(true)}
                aria-label="Original Unit 1 listening recording"
              />
              <p className="text-xs text-muted-foreground">
                Exact listening answer key တချို့ မအတည်ပြုရသေးလို့ အဖြေအမှန်အဖြစ် မစစ်ထားပါ။
              </p>
            </div>
          )}
          {unitActivities[skill].map((a) => (
            <div key={a.id}>
              <label
                htmlFor={`activity-${a.id}`}
                className="block text-sm font-semibold leading-loose"
              >
                {a.question}
              </label>
              <textarea
                id={`activity-${a.id}`}
                value={answers[a.id] ?? ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [a.id]: e.target.value }))}
                maxLength={skill === "writing" ? 7000 : 2000}
                rows={a.id === "w2" ? 9 : 3}
                className="mt-2 w-full rounded-lg border bg-background p-3"
              />
              {a.model && answers[a.id]?.trim() && (
                <details className="mt-2 text-sm">
                  <summary>ဥပမာအဖြေနဲ့ နှိုင်းကြည့်မယ်</summary>
                  <p className="mt-2">{a.model}</p>
                  <p className="text-xs text-muted-foreground">
                    ဥပမာအဖြေပါ။ အဓိပ္ပာယ်တူအဖြေများကို exact match ဖြင့် မဆုံးဖြတ်ပါ။
                  </p>
                </details>
              )}
            </div>
          ))}
          {(skill === "listening" || skill === "speaking") && (
            <label className="flex items-start gap-3 text-sm leading-loose">
              <input
                type="checkbox"
                checked={practised}
                onChange={(e) => setPractised(e.target.checked)}
              />
              {skill === "listening"
                ? "မူရင်းအသံကို နားထောင်ပြီး စာအုပ် activities လေ့ကျင့်ပြီးပါပြီ။"
                : "မေးခွန်းတွေကို အသံထွက်ဖြေပြီး interview / report လေ့ကျင့်ပြီးပါပြီ။"}
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!userId || busy}
              variant="outline"
              onClick={() => void saveActivity(false)}
            >
              မူကြမ်းသိမ်းမယ်
            </Button>
            <Button
              disabled={!userId || busy || !validUnitActivity(skill, answers, practised)}
              onClick={() => void saveActivity(true)}
            >
              {busy ? "သိမ်းနေသည်…" : "Section လေ့ကျင့်မှုပြီးပြီ — ဆက်သင်မယ်"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBlock(0);
                setReplay(true);
                setActivity(false);
              }}
            >
              သင်ကြားမှု အစကပြန်နားထောင်မယ်
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ဒီအပိုင်းက လေ့ကျင့်မှုမှတ်တမ်းပါ။ Exam အောင်မြင်ကြောင်း သို့မဟုတ် pronunciation
            အမှတ်ပေးခြင်း မဟုတ်ပါ။{" "}
            {skill === "writing" ? "Paragraph အတွက် 7–10 sentences ရေးပါ။" : ""}
          </p>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
export function UnitTeachingBlock({
  lesson,
  userId,
  start,
  end,
  autoStart,
  review,
  onDone,
}: {
  lesson: ReadingLesson;
  userId?: string;
  start: number;
  end: number;
  autoStart: boolean;
  review: boolean;
  onDone: (steps: number[]) => void;
}) {
  const engine = useClassroom(lesson, userId, { start, end }, false, true);
  const { narration } = spokenStepAt(lesson, engine.progress.cursor);
  const started = useRef(false);
  const done = useRef(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const askAbort = useRef<AbortController | null>(null);
  const completed =
    (!review || engine.passCompleted) &&
    Array.from({ length: end - start }, (_, i) => i + start).every((i) =>
      engine.progress.completed.includes(i),
    );
  const resume = useRef(review ? engine.restart : engine.resume);
  resume.current = review ? engine.restart : engine.resume;
  useEffect(() => {
    if (autoStart && engine.ready && engine.published && userId && !started.current && !completed) {
      started.current = true;
      resume.current();
    }
  }, [autoStart, engine.ready, engine.published, userId, completed]);
  useEffect(() => () => askAbort.current?.abort(), []);
  const continueAfterSave = async () => {
    if (done.current) return;
    done.current = true;
    setSaving(true);
    engine.pause();
    try {
      await engine.flushProgress();
      const response = await fetch(`/api/classroom?grade=${lesson.grade}&lessonId=${lesson.id}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("မှတ်တမ်း ပြန်စစ်မရပါ။ ပြန်စမ်းပါ။");
      const data = await response.json();
      if (
        !Array.from({ length: end - start }, (_, i) => i + start).every((i) =>
          data.progress.completed.includes(i),
        )
      )
        throw new Error("မသိမ်းရသေးပါ။ Refresh လုပ်ပြီး မှတ်တမ်းပြန်ယူပါ။");
      onDone(data.progress.completed);
    } catch (err) {
      done.current = false;
      setSaving(false);
      engine.setError(err instanceof Error ? err.message : "Save failed");
    }
  };
  const nextRef = useRef(continueAfterSave);
  nextRef.current = continueAfterSave;
  useEffect(() => {
    if (completed && userId && engine.ready) void nextRef.current();
  }, [completed, userId, engine.ready]);
  const ask = async () => {
    engine.pause();
    setBusy(true);
    engine.setError("");
    setAnswer("");
    const abort = new AbortController();
    askAbort.current = abort;
    try {
      const response = await classroomRequest(
        lesson.grade,
        { action: "ask", lessonId: lesson.id, cursor: engine.progress.cursor, question },
        abort.signal,
      );
      setAnswer((await response.json()).answer);
    } catch (err) {
      if (!abort.signal.aborted && !isClassroomCancellation(err))
        engine.setError(err instanceof Error ? err.message : "AI unavailable");
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      {!engine.published && (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
        >
          ဆရာစစ်ဆေးအတည်ပြုပြီးမှ အသံအတန်း စနိုင်ပါမယ်။ Self-study ကို ဆက်လေ့လာနိုင်ပါတယ်။
        </p>
      )}
      <ReadingWhiteboard
        lesson={lesson}
        cursor={engine.progress.cursor}
        completed={engine.progress.completed.length}
        total={lesson.segments.length * 4}
        transcript={narration}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={engine.progress.cursor <= start || busy}
          onClick={() => engine.move(-1)}
        >
          Previous
        </Button>
        <Button
          disabled={!userId || !engine.ready || !engine.published || busy || completed}
          onClick={engine.playing || engine.loading ? engine.pause : engine.resume}
        >
          {engine.playing || engine.loading ? "Pause" : "သင်ကြားမှု ဆက်မယ်"}
        </Button>
        <Button
          variant="outline"
          disabled={!userId || !engine.published || busy}
          onClick={engine.repeat}
        >
          Repeat
        </Button>
        <Button
          variant="outline"
          disabled={engine.progress.cursor >= end - 1 || busy}
          onClick={() => engine.move(1)}
        >
          Next
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            engine.pause();
            setAsking((v) => !v);
          }}
        >
          Ask Teacher
        </Button>
        <Button variant="outline" aria-pressed={engine.manual} onClick={engine.toggleManual}>
          Manual Mode {engine.manual ? "On" : "Off"}
        </Button>
      </div>
      {engine.manual && (
        <Button
          variant="outline"
          disabled={!userId || !engine.ready || !engine.published}
          onClick={() => engine.move(1, true)}
        >
          ဖတ်ပြီးပြီ — နောက်တစ်ဆင့်
        </Button>
      )}
      {engine.preparing && (
        <p role="status">
          အတန်းအသံ ပြင်ဆင်နေသည်… {engine.preparation.ready}/{engine.preparation.total}{" "}
          (အဆင်သင့်အသံကို ကျောင်းသားများ ပြန်သုံးနိုင်ပါမယ်။)
        </p>
      )}
      <p className="text-xs text-muted-foreground">{engine.saveStatus}</p>
      {engine.notice && <p role="status">{engine.notice}</p>}
      {engine.error && (
        <p role="alert" className="text-destructive">
          {engine.error}
        </p>
      )}
      {completed && !saving && (
        <Button onClick={() => void continueAfterSave()}>မှတ်တမ်းပြန်စစ်ပြီး ဆက်မယ်</Button>
      )}
      {saving && <p role="status">မှတ်တမ်းသိမ်းပြီး နောက်အပိုင်း ဆက်နေသည်…</p>}
      {asking && (
        <section className="rounded-xl border p-4">
          <label htmlFor="unit-teacher-question">မရှင်းတာ ဆရာ့ကို မေးမယ်</label>
          <textarea
            id="unit-teacher-question"
            className="mt-2 w-full rounded-lg border bg-background p-3"
            value={question}
            maxLength={1000}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Live AI မေးခွင့် ၁ ကြိမ် အသုံးပြုပါမည်။</p>
          <Button
            disabled={busy || !userId || !question.trim() || !engine.published}
            onClick={() => void ask()}
          >
            {busy ? "ဖြေနေသည်…" : "မေးမယ်"}
          </Button>
          {answer && <p className="mt-4 whitespace-pre-wrap leading-loose">{answer}</p>}
          <Button
            variant="outline"
            className="mt-3"
            disabled={busy}
            onClick={() => {
              setAsking(false);
              engine.resume();
            }}
          >
            သင်ခန်းစာ ပြန်ဆက်မယ်
          </Button>
        </section>
      )}
    </div>
  );
}
function UnitHomework({
  course,
  onSaved,
}: {
  course: CourseState | null;
  onSaved: (course: CourseState) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(course?.homework?.answers ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  if (!course?.homework)
    return (
      <section className="rounded-xl border p-6">
        <h2 className="font-bold">Exam Practice Homework</h2>
        <p className="mt-3 leading-loose">
          Reading၊ Vocabulary၊ Grammar၊ Listening၊ Speaking၊ Writing ခြောက်ခုလုံး
          သင်ကြားလေ့ကျင့်ပြီးမှ သင့် Account ထဲ Homework အလိုအလျောက် အပ်ပေးပါမယ်။
        </p>
      </section>
    );
  const save = async (submit: boolean) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      onSaved(
        await courseRequest({ action: submit ? "submit_homework" : "save_homework", answers }),
      );
      setNotice(submit ? "Homework တင်ပြီးပါပြီ။" : "Homework မူကြမ်း သိမ်းပြီးပါပြီ။");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-5 rounded-xl border p-5">
      <h2 className="text-xl font-bold">Unit 1 · Exam Practice Homework</h2>
      <p className="text-sm">Account ထဲ အပ်ထားသော လေ့ကျင့်ရေးအိမ်စာ — final exam မဟုတ်ပါ။</p>
      {unitHomework.map((q, i) => (
        <div key={q.id}>
          <label htmlFor={q.id}>
            {i + 1}. {q.question}
          </label>
          <textarea
            id={q.id}
            className="mt-2 w-full rounded-lg border bg-background p-3"
            rows={q.id === "h6" ? 9 : 3}
            maxLength={q.id === "h6" ? 7000 : 1000}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex gap-3">
        <Button variant="outline" disabled={busy} onClick={() => void save(false)}>
          မူကြမ်းသိမ်းမယ်
        </Button>
        <Button disabled={busy} onClick={() => void save(true)}>
          Homework တင်မယ်
        </Button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      {course.homework.submitted_at && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Live AI မေးခွင့် ၁ ကြိမ်ဖြင့် အိမ်စာနဲ့ Writing အတွက် ဆရာ့အကြံပြုချက်ယူနိုင်ပါတယ်။
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                onSaved(await courseRequest({ action: "review_homework" }));
              } catch (err) {
                setError(err instanceof Error ? err.message : "AI review failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            ဆရာ့အကြံပြုချက် ယူမယ်
          </Button>
        </div>
      )}
      {course.homework.feedback && (
        <div role="status">
          <p>
            ပေးထားသောအဖြေနဲ့ တူညီသောအဖြေ {course.homework.feedback.matched}/
            {course.homework.feedback.objectiveTotal}
          </p>
          <p className="mt-2 text-sm leading-loose">{course.homework.feedback.note}</p>
          {course.homework.feedback.teacherFeedback && (
            <p className="mt-4 whitespace-pre-wrap leading-loose">
              {course.homework.feedback.teacherFeedback}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
