import { useEffect, useState } from "react";
import type { AdminStudent } from "./AdminDashboard";
import { speakingSeconds, speakingTime } from "@/lib/grade11SpeakingAllowance";
export function AdminSpeakingUsage({ student }: { student: AdminStudent }) {
  const active = student.grade11_speaking_active;
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!active) {
      setRemaining(0);
      return;
    }
    const receivedAt = Date.now();
    const tick = () =>
      setRemaining(speakingSeconds(active.expiresAt, active.serverNow, receivedAt, Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active]);
  return (
    <section
      aria-label="Grade 11 speaking usage"
      className="space-y-2 rounded-xl border border-border p-4 text-sm"
    >
      <h3 className="font-semibold">Grade 11 AI Speaking</h3>
      {student.grade11_speaking_sessions === undefined ? (
        <p className="text-xs text-muted-foreground">
          Speaking usage is not connected yet. Apply the Grade 11 speaking migration.
        </p>
      ) : (
        <>
          <p>
            Units started today: {student.grade11_speaking_units?.join(", ") || "None"} ·{" "}
            {student.grade11_speaking_units?.length ?? 0}/2
          </p>
          <p>
            Sessions: {student.grade11_speaking_sessions}/4 · Remaining:{" "}
            {Math.max(0, 4 - student.grade11_speaking_sessions)}
          </p>
          <p>
            Session time: {speakingTime(student.grade11_speaking_seconds ?? 0)} · 5 minutes per
            session
          </p>
          {active && (
            <p className="font-medium text-primary">
              Active Unit {active.unit} · Remaining {speakingTime(remaining)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Usage is a snapshot at the last account refresh. Session time is not provider-billed
            audio time.
          </p>
        </>
      )}
    </section>
  );
}
