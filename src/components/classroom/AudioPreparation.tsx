import { AudioLines, Sparkles } from "lucide-react";
import { SayaOwlAvatar } from "@/components/SayaOwlAvatar";
import styles from "./AudioPreparation.module.css";

/** Real completed-clip progress, with motion that never invents readiness or a time estimate. */
export function AudioPreparation({ ready, total }: { ready: number; total: number }) {
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const completed = Number.isFinite(ready) ? Math.min(count, Math.max(0, Math.floor(ready))) : 0;
  const percent = count ? Math.round((completed / count) * 100) : 0;
  return (
    <section
      role="status"
      aria-label="Class preparation"
      aria-live="polite"
      className="relative isolate overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 shadow-sm sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-14 -z-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="flex items-center gap-4 sm:gap-5">
        <div
          aria-hidden="true"
          className={`${styles.owl} shrink-0 rounded-2xl bg-background/70 p-2 shadow-sm ring-1 ring-primary/10`}
        >
          <SayaOwlAvatar state="ready" size={48} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:text-xs">
            <AudioLines aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Saya Owl Classroom
          </div>
          <h2 className="text-base font-semibold leading-relaxed sm:text-lg">
            ဆရာ့အသံ ပြင်ဆင်နေပါတယ်…
          </h2>
        </div>
        <div aria-hidden="true" className="shrink-0 text-right">
          <span className="text-3xl font-bold tabular-nums tracking-tight text-primary sm:text-4xl">
            {percent}
            <span className="ml-0.5 text-base font-medium sm:text-xl">%</span>
          </span>
        </div>
      </div>
      <div className="mt-6">
        <div
          role="progressbar"
          aria-label="အတန်းအသံ အဆင်သင့်ဖြစ်မှု"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}% · ${completed}/${count} အသံ အဆင်သင့်`}
          className="relative h-3 overflow-hidden rounded-full bg-primary/10 ring-1 ring-inset ring-primary/5"
        >
          <div
            className={`${styles.fill} relative h-full overflow-hidden rounded-full bg-gradient-to-r from-primary to-teal-400`}
            style={{ width: `${percent}%` }}
          >
            <div
              aria-hidden="true"
              className={`${styles.shimmer} absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent`}
            />
          </div>
          <div
            aria-hidden="true"
            className={`${styles.runner} absolute top-0 h-full w-6 rounded-full bg-primary/15 blur-sm`}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="flex h-4 items-center gap-[3px] text-primary">
              {[0, 1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={`${styles.wave} w-[3px] rounded-full bg-current`}
                  style={{
                    height: `${8 + (2 - Math.abs(2 - bar)) * 4}px`,
                    animationDelay: `${bar * 120}ms`,
                  }}
                />
              ))}
            </span>
            အသံပြင်ဆင်နေသည်
          </span>
          <span aria-hidden="true" className="shrink-0 font-medium tabular-nums">
            {completed} / {count}
          </span>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-loose text-muted-foreground sm:text-sm">
        <Sparkles aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
        လိုအပ်တဲ့အသံ အဆင်သင့်ဖြစ်တာနဲ့ ဆရာက စသင်ပေးပါမယ်။
      </p>
    </section>
  );
}
