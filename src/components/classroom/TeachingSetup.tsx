import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { RequireSignIn } from "@/components/RequireSignIn";
import { Button } from "@/components/ui/button";
import { getReadingLesson } from "@/lib/classroom/lessons";
import { spokenStepAt } from "@/lib/classroom/types";

type Status = {
  config: { database: boolean; serviceRole: boolean; speechProvider: boolean };
  missing: string[];
  ready: number[];
  published: boolean;
  live: boolean;
  contentHash?: string;
};
const skills = ["Reading", "Grammar", "Vocabulary", "Writing", "Listening", "Speaking"];
export function TeachingSetup() {
  const { session, access, ready } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lesson = getReadingLesson(10)!;
  const userId = session?.user.id;
  const isAdmin = access?.is_admin;
  useEffect(() => {
    if (!userId || !isAdmin) return;
    const controller = new AbortController();
    void fetch("/api/teaching-setup?grade=10&day=0", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Admin setup ကို ချိတ်ဆက်မရပါ။");
        const data = await r.json();
        if (!controller.signal.aborted) setStatus(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [userId, isAdmin]);
  async function approve() {
    if (!reviewed || !status?.contentHash || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/teaching-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: 10,
          day: 0,
          action: "approve_script",
          acknowledge: true,
          contentHash: status.contentHash,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message ?? data.error ?? "အတည်ပြုမရပါ။");
      }
      setStatus({ ...status, published: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }
  if (!ready) return <p role="status">အကောင့် စစ်ဆေးနေသည်…</p>;
  if (!session)
    return (
      <RequireSignIn>
        <span />
      </RequireSignIn>
    );
  if (!isAdmin) return <p role="alert">ဒီနေရာကို Admin အကောင့်ဖြင့်သာ သုံးနိုင်ပါသည်။</p>;
  const configured =
    status?.config.database &&
    status.config.serviceRole &&
    status.config.speechProvider &&
    !status.missing.length;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-7">
      <header>
        <h1 className="text-2xl font-bold">သင်ခန်းစာ စီမံရန်</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          အရင်ဆုံး Grade 10 · Unit 1 · Reading ကို စမ်းသပ်ပါမယ်။
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          Grade
          <select
            aria-label="Grade"
            className="block w-full rounded-xl border bg-background p-3"
            defaultValue="10"
          >
            <option value="10">Grade 10</option>
            <option value="11" disabled>
              Grade 11 — နောက်မှ ဆက်ပြင်ဆင်မည်
            </option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Unit
          <select
            aria-label="Unit"
            className="block w-full rounded-xl border bg-background p-3"
            defaultValue="1"
          >
            <option value="1">Unit 1</option>
            {Array.from({ length: 11 }, (_, i) => i + 2).map((unit) => (
              <option key={unit} value={unit} disabled>
                Unit {unit} — မပြင်ဆင်ရသေးပါ
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav aria-label="Lesson skills" className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Button
            key={skill}
            variant={skill === "Reading" ? "default" : "outline"}
            disabled={skill !== "Reading"}
            aria-current={skill === "Reading" ? "page" : undefined}
          >
            {skill}
          </Button>
        ))}
      </nav>
      <p className="text-xs text-muted-foreground">
        ကျန် sections များကို Reading စမ်းသပ်ပြီးမှ ဆက်ထည့်ပါမယ်။
      </p>
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div>
          <h2 className="text-lg font-bold">Grade 10 · Unit 1 · Reading</h2>
          <p className="mt-1 text-sm text-muted-foreground">{lesson.title}</p>
        </div>
        <p role="status" className="text-sm font-semibold">
          {!status
            ? "အခြေအနေ စစ်ဆေးနေသည်…"
            : status.published
              ? "ကျောင်းသားများအတွက် ဖွင့်ထားပါပြီ"
              : "ဆရာ့အတည်ပြုချက် စောင့်နေသည်"}
        </p>
        <p className="text-sm leading-loose">
          စာသားကို တစ်ကြိမ် အတည်ပြုပေးရုံပါပဲ။ ကျောင်းသား အတန်းစတဲ့အခါ လိုအပ်တဲ့အသံကို ထုတ်ပြီး
          အားလုံးပြန်သုံးနိုင်အောင် သိမ်းထားမယ်။ အသံအားလုံး ကြိုထုတ်စရာမလိုပါဘူး။
        </p>
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">ဆရာသင်ကြားမည့် စာသားကို ဖတ်မယ်</summary>
          <ol className="mt-4 space-y-5">
            {Array.from({ length: lesson.segments.length * 4 }, (_, cursor) => {
              const clip = spokenStepAt(lesson, cursor);
              return (
                <li key={cursor} className="space-y-2 border-t pt-3 text-sm leading-loose">
                  <p className="font-semibold">
                    ဝါကျ {Math.floor(cursor / 4) + 1} · {clip.step}
                  </p>
                  <p className="whitespace-pre-wrap">{clip.narration}</p>
                </li>
              );
            })}
          </ol>
        </details>
        {!status?.published && (
          <>
            <label className="flex items-start gap-3 text-sm leading-loose">
              <input
                className="mt-2"
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                disabled={busy}
              />
              စာသားကို စစ်ဆေးပြီးပါပြီ။ လိုအပ်တဲ့အသံ ထုတ်ရာမှာ platform ရဲ့ AI ကုန်ကျစရိတ်ရှိကြောင်း
              နားလည်ပြီး အတည်ပြုပါတယ်။
            </label>
            <Button
              disabled={!configured || !status?.contentHash || !reviewed || busy}
              onClick={() => void approve()}
            >
              {busy ? "အတည်ပြုနေသည်…" : "Reading အတန်း ဖွင့်မယ်"}
            </Button>
          </>
        )}
        {status?.published && (
          <a
            className="inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            href="/class?start=true"
          >
            ကျောင်းသားလို အတန်းစမ်းမယ် →
          </a>
        )}
        <p className="text-xs leading-loose text-muted-foreground">
          အသံကို လိုအပ်သည့်အခါ တစ်ကြိမ်ထုတ်ပြီး ပြန်သုံးမယ်။ Shared lesson အသံအတွက် student credit
          မဖြတ်ပါ။
        </p>
        {status && !configured && (
          <p role="alert" className="text-sm text-destructive">
            အသံဝန်ဆောင်မှု အဆင်သင့်မဖြစ်သေးပါ။ အောက်က စနစ်အခြေအနေကို စစ်ဆေးပါ။
          </p>
        )}
      </section>
      <details className="rounded-xl border p-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground">စနစ်အခြေအနေ အသေးစိတ်</summary>
        {status && (
          <ul className="mt-3 space-y-2">
            <li>
              Database:{" "}
              {status.config.database && status.config.serviceRole ? "ရှိသည်" : "မရှိသေးပါ"}
            </li>
            <li>Speech provider: {status.config.speechProvider ? "ရှိသည်" : "မရှိသေးပါ"}</li>
            <li>ပထမအတန်း အသံ: {status.ready.length}/16</li>
            <li>လိုအပ်နေသော setup: {status.missing.join(", ") || "မရှိပါ"}</li>
          </ul>
        )}
      </details>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
