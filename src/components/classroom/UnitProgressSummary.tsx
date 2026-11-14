import { useEffect, useState } from "react";
import { courseRequest, type CourseState } from "@/lib/classroom/unit-course-request";
export function UnitProgressSummary({ userId }: { userId: string }) {
  const [course, setCourse] = useState<CourseState | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void courseRequest(undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setCourse(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [userId]);
  if (!course) return null;
  return (
    <section className="mb-5 rounded-xl border p-4">
      <h2 className="font-bold">Grade 10 · Unit 1 · Saya Owl Teaching</h2>
      <p className="mt-2 text-sm">
        Sections ပြီးစီးမှု {course.sections.filter((s) => s.completed).length}/6
      </p>
      <a
        href="/class?grade=10&unit=1&start=true"
        className="mt-3 inline-block text-sm text-primary underline"
      >
        {course.homework
          ? "အပ်ထားသော Exam Practice Homework / Unit ကို ဖွင့်မယ်"
          : "ရပ်ထားတဲ့ section က ဆက်သင်မယ်"}
      </a>
    </section>
  );
}
