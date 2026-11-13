import { Link } from "@tanstack/react-router";
import { Play, CalendarDays } from "lucide-react";
import { SayaOwlAvatar } from "@/components/SayaOwlAvatar";

/** The primary learner entry point: no unit or skill selection. */
export function StartClassCard() {
  return (
    <section aria-label="Saya Owl daily class" className="mx-auto max-w-6xl px-4 pt-6">
      <div className="flex flex-col gap-6 rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div className="flex items-start gap-4">
          <SayaOwlAvatar state="ready" size={64} />
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold opacity-80">
              <CalendarDays className="h-4 w-4" />
              Saya Owl · နေ့စဉ်အင်္ဂလိပ်စာအတန်း
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-relaxed">
              ဒီနေ့ ဆရာဇီးကွက်နဲ့ စာသင်ကြမယ်
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-90">
              သင်မယ့်အစီအစဉ်ကို ဆရာက စီစဉ်ပေးမယ်။ နားထောင်၊ နားလည်၊ မေးမြန်းပြီး မနေ့ကရပ်ထားတဲ့နေရာက
              ဆက်သင်ပါ။
            </p>
          </div>
        </div>
        <Link
          to="/class"
          search={{ start: true }}
          className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-background px-7 py-4 text-base font-bold text-foreground transition hover:bg-secondary"
        >
          <Play className="h-5 w-5" fill="currentColor" />
          အတန်းစမယ်
        </Link>
      </div>
    </section>
  );
}
