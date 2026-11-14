import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getUnitLesson, type UnitSkill } from "@/lib/classroom/unit-course";
import { spokenStepAt } from "@/lib/classroom/types";
import { classroomRequest } from "./useClassroom";

/** Rendered only inside the admin setup; API independently checks the admin role. */
export function UnitScriptReview({
  skill,
  grade = 10,
  unit = 1,
}: {
  skill: UnitSkill;
  grade?: 10 | 11;
  unit?: number;
}) {
  const lesson = getUnitLesson(grade, unit, skill)!;
  const [hash, setHash] = useState("");
  const [published, setPublished] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    void fetch(`/api/classroom?grade=${grade}&lessonId=${lesson.id}`, {
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Section setup ကို ချိတ်ဆက်မရပါ။");
        const data = await r.json();
        if (!abort.signal.aborted) {
          setHash(data.contentHash);
          setPublished(data.published);
        }
      })
      .catch((err) => {
        if (!abort.signal.aborted) setError(err.message);
      });
    return () => abort.abort();
  }, [lesson.id, grade]);
  const approve = async () => {
    setBusy(true);
    setError("");
    try {
      await classroomRequest(grade, {
        action: "approve",
        lessonId: lesson.id,
        contentHash: hash,
        acknowledge: true,
      });
      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-bold">
        Grade {grade} · Unit {unit} · {skill} ဆရာပြောစာသား စစ်ဆေးရန်
      </h2>
      <p className="text-sm leading-loose">
        စာအုပ်အကြောင်းအရာနဲ့ ဆက်စပ်ရေးထားသော သင်ကြားရေးမူကြမ်းပါ။ အတည်ပြုပြီးမှ ကျောင်းသားအသံအတန်း
        ဖွင့်နိုင်ပါမယ်။ အသံကို ပထမဆုံးလိုအပ်ချိန်မှာ ပြင်ဆင်ပြီး shared cache ထဲ သိမ်းပါမယ်။
      </p>
      {lesson.segments.map((s, i) => (
        <details key={s.id} className="rounded-lg border p-4">
          <summary>
            {i + 1}. {s.english}
          </summary>
          {[0, 1, 2, 3].map((step) => (
            <p key={step} className="mt-4 whitespace-pre-wrap text-sm leading-loose">
              {spokenStepAt(lesson, i * 4 + step).narration}
            </p>
          ))}
        </details>
      ))}
      {published ? (
        <p role="status">ဒီ script version ကို အတည်ပြုပြီးပါပြီ။</p>
      ) : (
        <>
          <label className="flex gap-3 text-sm leading-loose">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            သင်ကြားရေးစာသားအားလုံးကို စာအုပ်နဲ့ တိုက်စစ်ပြီး ကျောင်းသားများအတွက် ဖွင့်ရန်
            အတည်ပြုပါသည်။
          </label>
          <Button disabled={!reviewed || !hash || busy} onClick={() => void approve()}>
            ကျောင်းသားသင်ကြားမှု ဖွင့်မယ်
          </Button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
