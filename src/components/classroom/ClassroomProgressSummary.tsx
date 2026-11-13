import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { getReadingLesson } from "@/lib/classroom/lessons";
export function ClassroomProgressSummary({ userId }: { userId: string }) {
  const { session } = useAuth();
  const [rows, setRows] = useState<{ grade: number; done: number; total: number }[]>([]);
  useEffect(() => {
    if (session?.user.id !== userId) return;
    const controller = new AbortController();
    void Promise.all(
      [10, 11].map(async (grade) => {
        const response = await fetch(`/api/classroom?grade=${grade}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return null;
        const { progress } = await response.json();
        return {
          grade,
          done: progress.completed.length,
          total: getReadingLesson(grade)!.segments.length * 4,
        };
      }),
    )
      .then((data) => {
        if (!controller.signal.aborted)
          setRows(data.filter((r): r is NonNullable<typeof r> => r !== null));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [userId, session?.user.id]);
  if (session?.user.id !== userId || !rows.length) return null;
  return (
    <section>
      <h3 className="mb-2 font-semibold">Reading Classroom</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <a
            key={row.grade}
            href={`/classroom/${row.grade}`}
            className="rounded-lg border border-border p-3 text-sm"
          >
            <b>Grade {row.grade} · Unit 1 Reading</b>
            <p className="mt-1 text-muted-foreground">
              {row.done} / {row.total} steps · မူလနေရာမှ ပြန်ဆက်ရန် →
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
