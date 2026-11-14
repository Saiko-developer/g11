import { UnitScriptReview } from "./UnitScriptReview";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthGate";
import { RequireSignIn } from "@/components/RequireSignIn";
import { Button } from "@/components/ui/button";
import {
  curriculumSection,
  teachingUnits,
  teachingBlueprints,
  TEACHING_SKILLS,
  skillLabel,
  type TeachingGrade,
  type TeachingSkill,
} from "@/lib/classroom/curriculum-catalog";

export function CurriculumPreparation({ children }: { children: ReactNode }) {
  const { session, access, ready } = useAuth();
  const [grade, setGrade] = useState<TeachingGrade>(10);
  const [unit, setUnit] = useState(1);
  const [skill, setSkill] = useState<TeachingSkill>("reading");
  if (!ready) return <p role="status">အကောင့် စစ်ဆေးနေသည်…</p>;
  if (!session)
    return (
      <RequireSignIn>
        <span />
      </RequireSignIn>
    );
  if (!access?.is_admin) return <p role="alert">ဒီနေရာကို Admin အကောင့်ဖြင့်သာ သုံးနိုင်ပါသည်။</p>;
  const selected = curriculumSection(grade, unit, skill)!;
  const blueprint = teachingBlueprints[skill];
  const pilot = selected.classroomDelivery === "current-pilot";
  const format = {
    text: "စာသား data ရှိသည်",
    mixed: "စာသားနှင့် scan တွဲပါသည်",
    scan: "Scan ကို စစ်ဆေးဖြည့်ရန်လိုသည်",
    missing: "Source မပြည့်စုံသေးပါ",
  }[selected.sourceFormat];
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-7">
      <header>
        <h1 className="text-2xl font-bold">သင်ခန်းစာ စီမံရန်</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Grade 10 / 11 · Units 1–12 · Skills ၆ မျိုးအတွက် ပြင်ဆင်ရေးနေရာ
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          Grade
          <select
            aria-label="Grade"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value) as TeachingGrade)}
            className="block w-full rounded-xl border bg-background p-3"
          >
            <option value={10}>Grade 10</option>
            <option value={11}>Grade 11</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Unit
          <select
            aria-label="Unit"
            value={unit}
            onChange={(e) => setUnit(Number(e.target.value))}
            className="block w-full rounded-xl border bg-background p-3"
          >
            {teachingUnits(grade).map((u) => (
              <option key={u.number} value={u.number}>
                Unit {u.number}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav aria-label="Lesson skills" className="flex flex-wrap gap-2">
        {TEACHING_SKILLS.map((item) => (
          <Button
            key={item}
            variant={skill === item ? "default" : "outline"}
            aria-pressed={skill === item}
            onClick={() => setSkill(item)}
          >
            {skillLabel(item)}
          </Button>
        ))}
      </nav>
      <section
        className="space-y-3 rounded-2xl border bg-card p-5"
        aria-label="Section preparation"
      >
        <h2 className="text-lg font-bold">
          Grade {grade} · Unit {unit} · {skillLabel(skill)}
        </h2>
        <p className="font-semibold">{selected.unitTitle}</p>
        <p className="text-sm leading-loose">{selected.topic}</p>
        <p role="status" className="text-sm text-muted-foreground">
          {pilot
            ? "လက်ရှိ classroom pilot"
            : "မူရင်း material ရှိသည် — classroom သင်ကြားပုံ ပြင်ဆင်စစ်ဆေးရန်လိုသည်"}
        </p>
        <ul className="space-y-2 text-sm leading-loose">
          <li>{format}</li>
          <li>လေ့ကျင့်ခန်း source records: {selected.exerciseCount}</li>
          <li>
            Source ထဲက အဖြေ: {selected.providedAnswers} · Suggested အဖြေ:{" "}
            {selected.suggestedAnswers}
          </li>
          {selected.audio && <li>မူရင်း textbook audio ဖိုင် ရှိသည်</li>}
        </ul>
        <p className="text-xs leading-loose text-muted-foreground">
          Source ရှိခြင်းက teaching script၊ အဖြေစစ်ဆေးမှုနှင့် အသံအတန်း အားလုံးအတည်ပြုပြီးကြောင်း
          မဆိုလိုပါ။
        </p>
        <a
          href={selected.lessonUrl}
          className="inline-block text-sm font-semibold text-primary underline"
        >
          ရှိပြီးသား textbook lesson ကို ကြည့်မယ် →
        </a>
      </section>
      {pilot ? (
        children
      ) : grade === 10 && unit === 1 ? (
        <UnitScriptReview key={skill} skill={skill} />
      ) : (
        <section className="rounded-2xl border p-5 text-sm leading-loose">
          <h2 className="font-semibold">ဆရာသင်ကြားရေး ပြင်ဆင်ရန်</h2>
          <p className="mt-2">
            ဒီ section အတွက် automatic classroom ကို မဖွင့်ရသေးပါ။ မူရင်းစာကို တိုက်စစ်ပြီး
            ဆရာရှင်းပြချက်၊ ဘုတ်မှတ်စု၊ assessment နှင့် အသံကို စစ်ဆေးပြီးမှ ချိတ်ဆက်ပါမယ်။
          </p>
          {selected.sourceFormat !== "text" && (
            <p className="mt-3 text-amber-800 dark:text-amber-200">
              Scan ပါဝင်သော material ကို စာသားပြည့်စုံသကဲ့သို့ မယူဆဘဲ transcription နှင့် source
              တိုက်စစ်ရန် လိုပါသည်။
            </p>
          )}
        </section>
      )}
      <details className="rounded-2xl border p-5">
        <summary className="cursor-pointer font-semibold">
          သင်ကြားမည့် အစီအစဉ်နှင့် စစ်ဆေးရန်
        </summary>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-loose">
          {blueprint.flow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3 className="mt-5 font-semibold">စစ်ဆေးရန်</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-loose">
          {blueprint.checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Practice အဖြေနှင့် formal homework ကို ခွဲထားပါမယ်။ Unit ရဲ့ skills အားလုံးပြီးမှ formal
          homework ပေးပါမယ်။
        </p>
      </details>
      <details className="rounded-xl border p-4 text-sm">
        <summary className="cursor-pointer">မူရင်းဖိုင်နှင့် supporting material</summary>
        <ul className="mt-3 space-y-2 break-words">
          {[
            ...selected.sourceFiles.map((source) => source.path),
            ...selected.supportFiles,
            ...(selected.teacherScript ? [selected.teacherScript] : []),
          ].map((path) => (
            <li key={path}>
              <a
                href={`https://github.com/Saiko-developer/g11/blob/main/${path}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {path}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Inventory ကို repository files မှ ထုတ်ထားသည်။ Live publication / provider readiness ကို
          အစားမထိုးပါ။
        </p>
      </details>
    </div>
  );
}
