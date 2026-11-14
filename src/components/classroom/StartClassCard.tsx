import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { SayaOwlAvatar } from "@/components/SayaOwlAvatar";

/** Unit entry keeps the existing self-study material beside teacher-led learning. */
export function StartClassCard({
  grade = 10,
  unit = 1,
  compact = false,
}: {
  grade?: 10 | 11;
  unit?: number;
  compact?: boolean;
}) {
  const ready = grade === 10 && unit === 1;
  return (
    <section
      aria-label={`Grade ${grade} Unit ${unit} learning modes`}
      className={compact ? "px-5 pt-4" : "mx-auto max-w-6xl px-4 pt-6"}
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <SayaOwlAvatar state="ready" size={48} />
          <div>
            <p className="text-xs opacity-80">
              Grade {grade} · Unit {unit}
            </p>
            <h2 className="mt-1 text-lg font-bold">Saya Owl နဲ့ သင်မလား၊ ကိုယ်တိုင် လေ့လာမလား?</h2>
            <p className="mt-2 text-sm leading-loose opacity-90">
              {ready
                ? "Section တစ်ခုပြီးတစ်ခု ဆရာသင်ပေးမယ်။ ရပ်ထားတဲ့နေရာက ပြန်ဆက်နိုင်ပါတယ်။"
                : "Self-study ကို ဖွင့်လေ့လာနိုင်ပါတယ်။ Saya Owl Teaching ကို စစ်ဆေးပြင်ဆင်နေဆဲပါ။"}
            </p>
          </div>
        </div>
        {ready && (
          <Link
            to="/class"
            search={{ start: true, grade, unit, skill: undefined }}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-background px-5 py-3 font-bold text-foreground hover:bg-secondary"
          >
            <Play className="h-4 w-4" />
            အတန်းစမယ် / ဆက်သင်မယ်
          </Link>
        )}
      </div>
      {compact && (
        <p className="mt-3 text-xs text-muted-foreground">
          Self-study — အောက်က section များကို ကိုယ်တိုင်ရွေး လေ့လာနိုင်ပါတယ်။
        </p>
      )}
    </section>
  );
}
