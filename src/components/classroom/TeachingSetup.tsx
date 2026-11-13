import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { RequireSignIn } from "@/components/RequireSignIn";
import { Button } from "@/components/ui/button";
import { getReadingLesson } from "@/lib/classroom/lessons";
import { buildDailyClasses } from "@/lib/classroom/study-plan";
import { spokenStepAt } from "@/lib/classroom/types";
type Status = {
  config: { database: boolean; serviceRole: boolean; speechProvider: boolean };
  missing: string[];
  ready: number[];
  published: boolean;
  live: boolean;
};
export function TeachingSetup() {
  const { session, access, ready } = useAuth();
  const userId = session?.user.id;
  const isAdmin = access?.is_admin;
  const [grade, setGrade] = useState<10 | 11>(10);
  const [day, setDay] = useState(0);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [heard, setHeard] = useState(false);
  const stop = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const lesson = getReadingLesson(grade)!;
  const days = buildDailyClasses(lesson);
  const assigned = days[day];
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`/api/teaching-setup?grade=${grade}&day=${day}`, {
        cache: "no-store",
        signal,
      });
      if (!r.ok)
        throw new Error(
          r.status === 403 ? "Admin အကောင့်ဖြင့် ဝင်ပါ။" : "Teaching backend ကို ချိတ်ဆက်မရပါ။",
        );
      const s = (await r.json()) as Status;
      setStatus(s);
      return s;
    },
    [grade, day],
  );
  useEffect(() => {
    if (!userId || !isAdmin) return;
    const c = new AbortController();
    setStatus(null);
    setError("");
    setReviewed(false);
    setHeard(false);
    void load(c.signal).catch((e) => {
      if (!c.signal.aborted) setError(e.message);
    });
    return () => c.abort();
  }, [userId, isAdmin, load]);
  useEffect(
    () => () => {
      stop.current = true;
      audio.current?.pause();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );
  async function action(action: string, cursor?: number) {
    const r = await fetch("/api/teaching-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, day, action, cursor, acknowledge: true }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message ?? e.error ?? "Teaching setup failed");
    }
    return r;
  }
  async function prepare() {
    stop.current = false;
    setBusy(true);
    setError("");
    try {
      const s = await load();
      for (let i = assigned.start; i < assigned.end; i++) {
        if (stop.current) break;
        if (s.ready.includes(i)) continue;
        setMessage(`အသံပြင်ဆင်နေသည်… ${i - assigned.start + 1}/${assigned.end - assigned.start}`);
        await action("prepare", i);
        await load();
      }
      setMessage(
        stop.current
          ? "ပြင်ဆင်မှု ရပ်ထားပါသည်။ ပြင်ဆင်ပြီးသားအသံများ သိမ်းထားပါသည်။"
          : "အသံပြင်ဆင်ပြီးပါပြီ။ တစ်ခုချင်း နားထောင်စစ်ဆေးပါ။",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preparation failed");
    } finally {
      setBusy(false);
    }
  }
  async function listen(cursor: number) {
    setError("");
    audio.current?.pause();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    try {
      const r = await action("listen", cursor);
      objectUrl.current = URL.createObjectURL(await r.blob());
      audio.current = new Audio(objectUrl.current);
      await audio.current.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio failed");
    }
  }
  if (!ready) return <p role="status">အကောင့် စစ်ဆေးနေသည်…</p>;
  if (!session)
    return (
      <RequireSignIn>
        <span />
      </RequireSignIn>
    );
  if (!access?.is_admin) return <p role="alert">ဒီနေရာကို Admin အကောင့်ဖြင့်သာ သုံးနိုင်ပါသည်။</p>;
  const total = assigned.end - assigned.start;
  const readyAll = status?.ready.length === total;
  return (
    <div className="mx-auto max-w-4xl space-y-5 py-7">
      <h1 className="text-2xl font-bold">Saya Owl — အသံအတန်း အဆင်သင့်ပြင်ဆင်မယ်</h1>
      <p className="text-sm leading-loose text-muted-foreground">
        Backend အမှန်၊ အသံဖိုင်အမှန်နဲ့ သင်ကြားနိုင်ဖို့ Admin setup ပါ။ ဒီနေ့အတန်းအတွက် အဆင့်{" "}
        {total} ဆင့်ကို တစ်ကြိမ်ထုတ်ပြီး ကျောင်းသားအားလုံးအတွက် ပြန်သုံးမယ်။
      </p>
      {lesson.teachingRevision && (
        <p role="status" className="rounded-xl border border-amber-300 p-4 text-sm leading-loose">
          Grade 10 Unit 1 · {lesson.teachingRevision} — သင်ကြားပုံအသစ် ဖြစ်ပါသည်။ မိတ်ဆက်၊
          ဝါကျရှင်းပြချက်၊ ဥပမာနှင့် အတန်းအဆုံးပြန်ချုပ်ချက်တို့ အသံထဲတွင် ပါဝင်မည်။
          အသံဟောင်းများကို မဖျက်ပါ။ စာသားအသစ်အတွက် အသံပြင်ဆင်ပြီး ပြန်အတည်ပြုရန် လိုပါသည်။
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          Grade
          <select
            className="ml-2 rounded border border-input bg-background p-2"
            value={grade}
            disabled={busy}
            onChange={(e) => {
              setGrade(Number(e.target.value) as 10 | 11);
              setDay(0);
            }}
          >
            <option value={10}>10</option>
            <option value={11}>11</option>
          </select>
        </label>
        <label className="text-sm">
          အတန်း
          <select
            className="ml-2 rounded border border-input bg-background p-2"
            value={day}
            disabled={busy}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {days.map((d) => (
              <option key={d.index} value={d.index}>
                {d.index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      {status && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Backend အခြေအနေ</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Database configuration: {status.config.database ? "ရှိသည်" : "မရှိသေးပါ"}</li>
            <li>Server database access: {status.config.serviceRole ? "ရှိသည်" : "မရှိသေးပါ"}</li>
            <li>
              Speech provider configuration:{" "}
              {status.config.speechProvider
                ? "ရှိသည် — provider အလုပ်လုပ်မှုကို အသံထုတ်ပြီး စမ်းရန်လိုသည်"
                : "မရှိသေးပါ"}
            </li>
            <li>
              Cached narration: {status.ready.length}/{total}
            </li>
            <li>Student publication: {status.published ? "အတည်ပြုထားသည်" : "မအတည်ပြုရသေးပါ"}</li>
            <li>Live questions: {status.live ? "ဖွင့်ထားသည်" : "ပိတ်ထားသည်"}</li>
          </ul>
          {status.missing.length > 0 && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Migration မပြည့်စုံသေးပါ: {status.missing.join(", ")}. Migration 0005 ကို လက်ရှိ
              migration runner မှ apply လုပ်ရန်လိုသည်။
            </p>
          )}
        </section>
      )}
      <section className="rounded-2xl border border-border p-5">
        <h2 className="font-semibold">၁။ စာသားကို စစ်ပြီး ဒီနေ့အတန်းအသံကို ပြင်ဆင်ပါ</h2>
        <p className="mt-3 text-sm leading-loose">
          အသံပြင်ဆင်ခြင်းမှာ AI ကုန်ကျစရိတ်ရှိပါတယ်။ အောင်မြင်ပြီးသား clip ကို ထပ်မထုတ်ပါ။ Global
          cap တစ်နေ့ ၂၀ clip ဖြစ်ပြီး မအောင်မြင်ရင် ရပ်ပေးမယ်။ ပြင်ဆင်ထားသော မူကြမ်းအသံကို Admin သာ
          နားထောင်နိုင်ပါတယ်။
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer">ဒီအတန်းမှာ ပြောမည့်စာသားအပြည့် ဖတ်ရှုရန်</summary>
          <ol className="mt-3 space-y-4">
            {Array.from({ length: total }, (_, i) => assigned.start + i).map((cursor) => {
              const clip = spokenStepAt(lesson, cursor);
              return (
                <li className="border-t border-border pt-3 text-sm leading-loose" key={cursor}>
                  <p className="font-semibold">
                    ဝါကျ {Math.floor(cursor / 4) + 1} · {clip.step}
                  </p>
                  <p className="whitespace-pre-wrap">{clip.narration}</p>
                  <p className="text-xs text-muted-foreground">
                    {clip.narration.length} / 3500 characters
                  </p>
                </li>
              );
            })}
          </ol>
        </details>
        <label className="mt-4 flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
            disabled={busy}
          />
          စာသားစစ်ဆေးပြီး ဖြစ်ပါသည်။ ကန့်သတ်ထားသော အသံပြင်ဆင်မှု ကုန်ကျစရိတ်ကို အတည်ပြုပါသည်။
        </label>
        <div className="mt-4 flex gap-2">
          <Button
            disabled={
              !reviewed || busy || !status?.config.speechProvider || !!status?.missing.length
            }
            onClick={() => void prepare()}
          >
            ဒီနေ့အတန်း အသံပြင်ဆင်မယ်
          </Button>
          {busy && (
            <Button
              variant="outline"
              onClick={() => {
                stop.current = true;
              }}
            >
              ဒီ clip ပြီးရင် ရပ်မယ်
            </Button>
          )}
        </div>
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      </section>
      <section className="rounded-2xl border border-border p-5">
        <h2 className="font-semibold">၂။ အသံအမှန်ကို နားထောင်စစ်ဆေးပါ</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: total }, (_, i) => assigned.start + i).map((cursor) => (
            <Button
              key={cursor}
              variant="outline"
              disabled={busy || !status?.ready.includes(cursor)}
              onClick={() => void listen(cursor)}
            >
              ဝါကျ {Math.floor(cursor / 4) + 1} · {spokenStepAt(lesson, cursor).step}
            </Button>
          ))}
        </div>
        <label className="mt-4 flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={heard}
            disabled={!readyAll || busy}
            onChange={(e) => setHeard(e.target.checked)}
          />
          ဒီနေ့အတန်းရဲ့ အသံများကို နားထောင်စစ်ဆေးပြီး ကျောင်းသားများကို သင်ကြားရန် အတည်ပြုပါသည်။
        </label>
        <Button
          className="mt-4"
          disabled={!reviewed || !heard || !readyAll || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await action("publish");
              await load();
              setMessage("ကျောင်းသားအတန်း ဖွင့်ပြီးပါပြီ။ Home → အတန်းစမယ် မှ စမ်းပါ။");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Publication failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          အတန်းအသံကို ကျောင်းသားများအတွက် ဖွင့်မယ်
        </Button>
      </section>
      <section className="rounded-2xl border border-border p-5">
        <h2 className="font-semibold">၃။ ကန့်သတ်ထားသော Live AI မေးခွင့်</h2>
        <p className="mt-3 text-sm leading-loose">
          အတန်းအသံက cached ဖြစ်ပါတယ်။ ကြားဖြတ်မေးခွန်းတစ်ခုလျှင် ရှိပြီးသား tutor allowance/credit ၁
          ယူနစ်ကို reserve လုပ်ပြီး အဖြေမအောင်မြင်ရင် ပြန်လွှတ်မယ်။
        </p>
        <Button
          className="mt-3"
          variant="outline"
          disabled={!status?.published || !!status?.missing.length || busy || status?.live}
          onClick={async () => {
            setBusy(true);
            try {
              await action("enable_questions");
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Activation failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          ကန့်သတ်ထားသော မေးခွင့် ဖွင့်မယ်
        </Button>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <a
        href="/class?start=true"
        className="inline-block text-sm font-semibold text-primary underline"
      >
        ကျောင်းသားအတန်းကို စမ်းမယ် →
      </a>
    </div>
  );
}
