import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Status = {
  units: Record<string, { total: number; ready: number; failed: number }>;
  totalClips: number;
  readyClips: number;
  storageBytes: number;
  avoidedRequestsEstimate: number;
};

/** Admin control: save Grade 11 grammar narration permanently, 20 clips per press. */
export function AdminGrade11Audio() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/grade11-audio-admin");
    if (res.ok) setStatus(await res.json());
    else setMsg("အခြေအနေ ဖတ်မရပါ။");
  };
  useEffect(() => {
    void load();
  }, []);

  const run = async (unit: number) => {
    setBusy(unit);
    setMsg(null);
    try {
      const res = await fetch("/api/grade11-audio-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: [unit], limit: 20 }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      setMsg(res.ok ? `Unit ${unit}: ${JSON.stringify(data)}` : String(data.error ?? res.status));
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-input p-4">
      <h3 className="font-semibold">Grade 11 Grammar အသံဖိုင် သိမ်းဆည်းမှု</h3>
      {status && (
        <p className="text-sm text-muted-foreground">
          {status.readyClips} / {status.totalClips} clips saved ·{" "}
          {(status.storageBytes / 1024 / 1024).toFixed(1)} MB · ~{status.avoidedRequestsEstimate} AI calls saved
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {status &&
          Object.entries(status.units).map(([unit, u]) => (
            <div key={unit} className="flex items-center justify-between gap-2 rounded-lg border border-input px-3 py-2 text-sm">
              <span>
                Unit {unit}: {u.ready}/{u.total}
                {u.failed ? <span className="text-destructive"> ({u.failed} failed)</span> : null}
              </span>
              <Button size="sm" variant="outline" disabled={busy !== null || u.ready >= u.total} onClick={() => run(Number(unit))}>
                {busy === Number(unit) ? "…" : u.ready >= u.total ? "✓" : "Save"}
              </Button>
            </div>
          ))}
      </div>
      {msg && <p className="break-all text-xs text-muted-foreground">{msg}</p>}
    </section>
  );
}
