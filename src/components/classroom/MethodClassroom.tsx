import { RequireSignIn } from "@/components/RequireSignIn";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CLASSROOM_STEPS,
  lessonClipCount,
  segmentNarration,
  type ReadingLesson,
} from "@/lib/classroom/types";
import { UnitTeachingBlock } from "./UnitClassroom";

export function ClassroomLessonChooser({ grade, unit }: { grade: 10 | 11; unit: number }) {
  const [selectedGrade, setGrade] = useState(grade);
  const [selectedUnit, setUnit] = useState(unit);
  const open = (skill: "grammar" | "writing") =>
    window.location.assign(
      `/class?grade=${selectedGrade}&unit=${selectedUnit}&skill=${skill}&start=true`,
    );
  return (
    <section
      className="my-5 space-y-3 rounded-xl border p-4"
      aria-label="Choose AI classroom lesson"
    >
      <p className="text-sm font-semibold">AI Teaching Classroom · Grammar / Writing</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Grade
          <select
            aria-label="Classroom grade"
            className="ml-2 rounded border bg-background p-2"
            value={selectedGrade}
            onChange={(e) => setGrade(Number(e.target.value) as 10 | 11)}
          >
            <option value={10}>10</option>
            <option value={11}>11</option>
          </select>
        </label>
        <label className="text-sm">
          Unit
          <select
            aria-label="Classroom unit"
            className="ml-2 rounded border bg-background p-2"
            value={selectedUnit}
            onChange={(e) => setUnit(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" onClick={() => open("grammar")}>
          Grammar သင်မယ်
        </Button>
        <Button variant="outline" onClick={() => open("writing")}>
          Writing သင်မယ်
        </Button>
      </div>
    </section>
  );
}
export function MethodClassroom({
  lesson,
  userId,
  autoStart,
}: {
  lesson: ReadingLesson;
  userId?: string;
  autoStart: boolean;
}) {
  const [block, setBlock] = useState(0);
  const [done, setDone] = useState(false);
  const [review, setReview] = useState(false);
  const total = lessonClipCount(lesson);
  return (
    <section className="space-y-5 py-5" aria-label="AI teaching lesson">
      <header>
        <p className="text-sm text-primary">
          Grade {lesson.grade} · Unit {lesson.unit} · {lesson.section}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{lesson.title}</h1>
        <p className="mt-3 text-sm leading-loose">
          {lesson.section === "grammar"
            ? "Rule၊ အဓိပ္ပာယ်၊ အသုံးချနိုင်သောအခြေအနေနဲ့ ဘာကြောင့်သုံးရလဲဆိုတာ ဆရာရှင်းပြမယ်။"
            : "Title နဲ့ given points ကို စဉ်းစားပုံ၊ outline စီပုံ၊ grammar ရွေးသုံးရသည့်အကြောင်းနဲ့ ကိုယ်တိုင်ရေးပြီး ပြန်စစ်ပုံကို သင်မယ်။ အဖြေဝါကျနဲ့ essay အဆင်သင့် ရေးပေးခြင်း မဟုတ်ပါ။"}
        </p>
      </header>
      {!userId && (
        <RequireSignIn>
          <span />
        </RequireSignIn>
      )}
      {!done ? (
        <UnitTeachingBlock
          key={`${block}:${review}`}
          lesson={lesson}
          userId={userId}
          start={block * 16}
          end={Math.min(total, (block + 1) * 16)}
          autoStart={autoStart || block > 0 || review}
          review={review}
          onDone={() => {
            if ((block + 1) * 16 < total) setBlock((b) => b + 1);
            else setDone(true);
          }}
        />
      ) : (
        <div className="space-y-4 rounded-xl border bg-primary/5 p-5">
          <h2 className="font-bold">ဒီ section ရဲ့ သင်ကြားမှု ပြီးပါပြီ</h2>
          <p className="text-sm leading-loose">
            သင်ထားတဲ့ စဉ်းစားနည်းနဲ့ မူရင်းစာအုပ် task ကို ကိုယ်တိုင်လေ့ကျင့်ပါ။ ဒီ section
            ပြီးခြင်းက Unit တစ်ခုလုံးပြီးကြောင်း မဆိုလိုပါ။
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setReview(true);
              setBlock(0);
              setDone(false);
            }}
          >
            အစက ပြန်နားထောင်မယ်
          </Button>
          <a
            href={
              lesson.grade === 10
                ? `/practice/${lesson.unit}/${lesson.section}`
                : `/grade-11/${lesson.unit}/${lesson.section}`
            }
            className="ml-3 text-sm text-primary underline"
          >
            မူရင်း Self-study / Exercises ဖွင့်မယ်
          </a>
        </div>
      )}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          ဆရာပြောစာသားအပြည့် ကြည့်မယ်
        </summary>
        <div className="mt-4 space-y-5">
          {lesson.segments.map((s, i) => (
            <section key={s.id}>
              <h2 className="font-semibold">
                {lesson.section === "writing" ? `${lesson.title} · ${i + 1}` : s.english}
              </h2>
              {lesson.section === "writing" && <p className="mt-2 leading-loose">{s.english}</p>}
              {CLASSROOM_STEPS.slice(1).map((step) => (
                <p key={step} className="mt-3 whitespace-pre-wrap text-sm leading-loose">
                  {segmentNarration(s, step)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </details>
    </section>
  );
}
