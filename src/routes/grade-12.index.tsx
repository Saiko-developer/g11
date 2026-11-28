import {
  TextbookPoem,
  TextbookReview,
  supplementNumbers,
  type SupplementNumber,
} from "@/components/grade12/TextbookSupplement";
import { isAdditionalUnit } from "@/data/grade12/additionalUnits";
import { AdditionalTextbookLesson } from "@/components/grade12/AdditionalTextbookLesson";
import {
  textbookUnitNumbers,
  type TextbookUnitNumber,
  type AvailableGrade12Unit,
} from "@/data/grade12/textbookUnits";
import { TextbookUnitLesson } from "@/components/grade12/TextbookUnitLesson";
import { SayaOwlHome } from "@/components/SayaOwlHome";
import { Grade11RequireSignIn } from "@/components/grade11/Grade11RequireSignIn";
import { grade12TutorContext } from "@/lib/grade12TutorContext";
import { Fragment, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Headphones,
  MessageSquare,
  PenLine,
  Sparkles,
  SpellCheck,
  Type,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GradeSwitcher } from "@/components/grade11/GradeSwitcher";
import { Unit1Lesson } from "@/components/grade12/Unit1Lesson";
import { Unit1ListeningSpeaking } from "@/components/grade12/Unit1ListeningSpeaking";
import {
  grade12Reviews,
  grade12SkillTopics,
  grade12Skills,
  grade12Units,
  type Grade12Skill,
} from "@/data/grade12/syllabus";
import { unit1Sections } from "@/data/grade12/unit1";

export const Route = createFileRoute("/grade-12/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    skill?: Grade12Skill;
    unit?: TextbookUnitNumber;
    review?: SupplementNumber;
    poem?: SupplementNumber;
  } => ({
    review: supplementNumbers.find(
      (number) => number === search.review || String(number) === search.review,
    ),
    poem: supplementNumbers.find(
      (number) => number === search.poem || String(number) === search.poem,
    ),
    unit: textbookUnitNumbers.find(
      (value) => value === search.unit || String(value) === search.unit,
    ),
    skill:
      grade12Skills.find((skill) => skill === search.skill) ??
      (search.skill === "listening-speaking" ? "listening" : undefined),
  }),
  head: () => ({ meta: [{ title: "Grade 12 English | Sayar Owl Academy" }] }),
  component: Grade12Home,
});

const skillGroups = [
  {
    title: "Receptive Skills",
    skills: [
      {
        id: "listening",
        title: "Listening",
        Icon: Headphones,
      },
      { id: "reading", title: "Reading", Icon: BookOpen },
    ],
  },
  {
    title: "Productive Skills",
    skills: [
      { id: "speaking", title: "Speaking", Icon: MessageSquare },
      { id: "writing", title: "Writing", Icon: PenLine },
    ],
  },
  {
    title: "Knowledge about Language",
    skills: [
      {
        id: "vocabulary",
        title: "Vocabulary",
        Icon: SpellCheck,
      },
      { id: "grammar", title: "Grammar", Icon: Type },
    ],
  },
] as const;

function UnitSkillCards({ unit }: { unit: number }) {
  const topics = grade12SkillTopics[unit];
  const lessonUnit = textbookUnitNumbers.find((number) => number === unit);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {skillGroups.map(({ title, skills }) => (
        <section key={title} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">{title}</h2>
          <div className="grid gap-2">
            {skills.map(({ id, title: skillTitle, Icon }) => {
              const content = (
                <>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-primary">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{skillTitle}</span>
                    <span className="block text-sm text-muted-foreground">{topics[id]}</span>
                  </span>
                </>
              );
              const card =
                "flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3";
              return unit === 1 || lessonUnit ? (
                <Link
                  key={id}
                  to="/grade-12"
                  search={{
                    skill: id,
                    unit: lessonUnit,
                  }}
                  className={`${card} transition hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                >
                  {content}
                </Link>
              ) : (
                <div key={id} className={card}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function SkillLinks({ current, unit }: { current: Grade12Skill; unit: AvailableGrade12Unit }) {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const rail = nav.current;
    const active = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!rail || !active) return;
    const start = active.offsetLeft;
    const end = start + active.offsetWidth;
    if (start < rail.scrollLeft) rail.scrollLeft = start;
    if (end > rail.scrollLeft + rail.clientWidth) rail.scrollLeft = end - rail.clientWidth;
  }, [current]);

  return (
    <nav
      ref={nav}
      aria-label={`Unit ${unit} skills`}
      className="relative flex gap-1 overflow-x-auto pb-1"
    >
      {grade12Skills.map((skill) => (
        <Link
          to="/grade-12"
          search={{ skill, unit: unit !== 1 ? unit : undefined }}
          key={skill}
          activeOptions={{ exact: true, explicitUndefined: true }}
          aria-current={skill === current ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center rounded-lg border px-2.5 text-sm font-medium capitalize focus-visible:outline-2 focus-visible:-outline-offset-2 ${skill === current ? "bg-primary text-primary-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        >
          {skill}
        </Link>
      ))}
    </nav>
  );
}

const supplementCard =
  "flex min-h-11 items-center gap-2 rounded-xl border border-accent/60 bg-accent/15 px-3 py-2 text-sm font-semibold hover:border-primary/60 hover:bg-accent/25 focus-visible:outline-2 focus-visible:outline-primary";

function Curriculum({ unit }: { unit: AvailableGrade12Unit }) {
  const [open, setOpen] = useState<number | null>(unit);
  return (
    <div className="space-y-3">
      {grade12Units.map(({ number, title, page }) => {
        const supplement = supplementNumbers.find((value) => value * 3 === number);
        const review = supplement ? grade12Reviews[supplement - 1] : null;
        return (
          <Fragment key={number}>
            <section
              className={`overflow-hidden rounded-2xl border bg-card ${open === number ? "border-primary/40 shadow-sm" : "border-border"}`}
            >
              <button
                type="button"
                aria-expanded={open === number}
                aria-controls={`grade12-unit-${number}`}
                onClick={() => setOpen(open === number ? null : number)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-primary/5"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${open === number ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                >
                  {number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Unit {number}
                  </span>
                  <span className="block font-semibold">{title}</span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-5 shrink-0 text-muted-foreground ${open === number ? "rotate-180" : ""}`}
                />
              </button>
              <div
                id={`grade12-unit-${number}`}
                hidden={open !== number}
                className="space-y-3 border-t px-5 py-4"
              >
                {open === number && (
                  <>
                    {number !== 1 && !textbookUnitNumbers.some((value) => value === number) && (
                      <p className="text-sm text-muted-foreground">
                        Textbook page {page} · <span lang="my">သင်ခန်းစာ မထည့်ရသေးပါ။</span>
                      </p>
                    )}
                    <UnitSkillCards unit={number} />
                  </>
                )}
              </div>
            </section>
            {supplement && review && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link to="/grade-12" search={{ review: supplement }} className={supplementCard}>
                  <Sparkles aria-hidden="true" className="size-4 shrink-0" />
                  <span>Review {supplement}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    p. {review.reviewPage}
                  </span>
                </Link>
                <Link to="/grade-12" search={{ poem: supplement }} className={supplementCard}>
                  <BookOpen aria-hidden="true" className="size-4 shrink-0" />
                  <span>
                    Poem {supplement} · {review.poem}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    p. {review.poemPage}
                  </span>
                </Link>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Grade12Home() {
  const { skill, unit: selectedUnit, review, poem } = Route.useSearch();
  const supplement = poem ?? review;
  const metadata = supplement ? grade12Reviews[supplement - 1] : undefined;
  const title = supplement && (poem ? `Poem ${poem} · ${metadata?.poem}` : `Review ${review}`);
  const returnUnit = textbookUnitNumbers.find((number) => number === (supplement ?? 0) * 3);
  const isLesson = Boolean(skill || supplement);
  const unit = selectedUnit ?? 1;
  const section = unit1Sections.find((item) => item.id === skill);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader compact={isLesson} />
      <main
        className={`mx-auto ${isLesson ? "max-w-[96rem] space-y-2 px-3 pt-2 pb-4 sm:px-4" : "max-w-5xl space-y-5 px-4 py-8"}`}
      >
        {supplement && metadata ? (
          <>
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/grade-12"
                search={{ unit: returnUnit }}
                aria-label="Grade 12 Units"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1.5 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ArrowLeft aria-hidden="true" className="size-4" /> Units
              </Link>
              <h1 className="text-base font-bold leading-snug sm:text-lg">{title}</h1>
              <span className="text-xs text-muted-foreground">
                Textbook p. {poem ? metadata.poemPage : metadata.reviewPage}
              </span>
              <Link
                to="/grade-12"
                search={poem ? { review: supplement } : { poem: supplement }}
                className="rounded-md border px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary sm:ml-auto"
              >
                {poem ? `Review ${supplement}` : `Poem ${supplement} · ${metadata.poem}`}
              </Link>
            </header>
            <div data-saya-home-section>
              {poem ? (
                <TextbookPoem key={poem} number={poem} />
              ) : (
                <TextbookReview key={supplement} number={supplement} />
              )}
            </div>
          </>
        ) : skill ? (
          <>
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/grade-12"
                search={{ unit: selectedUnit }}
                aria-label="Grade 12 Units"
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ArrowLeft aria-hidden="true" className="size-4" /> Units
              </Link>
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="shrink-0 text-xs font-semibold text-primary">Unit {unit}</span>
                <h1 className="text-base font-bold leading-snug sm:text-lg">
                  {grade12Units[unit - 1].title}
                </h1>
                <p lang="my" className="text-xs text-muted-foreground">
                  {
                    [
                      "အမူအကျင့်ကောင်းများ",
                      "ပျော်ရွှင်မှု၏ သော့ချက်",
                      "စားသောက်ပုံနှင့် အာဟာရ",
                      "စိတ်ခံစားမှု ကောင်းမွန်ခြင်း",
                      "အရောင်များ",
                      "ဉာဏ်ရည်တု",
                      "ပတ်ဝန်းကျင်ကို ခြိမ်းခြောက်နေသော ညစ်ညမ်းမှု",
                      "ပြန်လည်ပြည့်ဖြိုးမြဲ စွမ်းအင်",
                      "ဟယ်လင် ကယ်လာ",
                      "ဆက်သွယ်ရေးစွမ်းရည် ဘာကြောင့် မြှင့်တင်သင့်သလဲ",
                      "တစ်နေ့တာ စောင့်ဆိုင်းခြင်း",
                      "ယဉ်ကျေးမှုကြား ဆက်သွယ်မှု",
                    ][unit - 1]
                  }
                </p>
              </div>
            </header>
            <SkillLinks current={skill} unit={unit} />
            <div data-saya-home-section>
              {isAdditionalUnit(unit) ? (
                <AdditionalTextbookLesson key={`${unit}:${skill}`} unit={unit} skill={skill} />
              ) : unit !== 1 ? (
                <TextbookUnitLesson key={`${unit}:${skill}`} unit={unit} skill={skill} />
              ) : skill === "listening" || skill === "speaking" ? (
                <Unit1ListeningSpeaking key={skill} skill={skill} />
              ) : (
                section && (
                  <article
                    className={
                      skill === "reading"
                        ? undefined
                        : "space-y-3 rounded-xl border bg-card p-3 sm:p-4"
                    }
                  >
                    {skill !== "reading" && <h2 className="font-semibold">{section.topic}</h2>}
                    <Unit1Lesson section={section} key={section.id} />
                  </article>
                )
              )}
            </div>
          </>
        ) : (
          <>
            <GradeSwitcher current={12} />
            <header>
              <h1 className="text-3xl font-bold">Grade 12 English</h1>
              <p className="mt-1 text-muted-foreground">
                Syllabus Curriculum Explorer — သင်ရိုးသစ် Unit 1–12
              </p>
            </header>
            <Link
              to="/exam-builder"
              search={{ grade: 12 }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 transition hover:bg-primary/10"
            >
              <span className="flex items-center gap-3">
                <Sparkles aria-hidden="true" className="size-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-bold">Exam Builder with Sayar Owl</span>
                  <span lang="my" className="block text-xs text-muted-foreground">
                    Unit များကို ပေါင်းပြီး စိတ်ကြိုက် စာမေးပွဲ ထုတ်ပါ
                  </span>
                </span>
              </span>
              <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                Open
              </span>
            </Link>
            <div data-saya-home-section>
              <Curriculum key={unit} unit={unit} />
            </div>
          </>
        )}
        <Grade11RequireSignIn>
          <SayaOwlHome
            key={title || `${unit}:${skill ?? "curriculum"}`}
            grade={12}
            lessonContext={title ? `Grade 12 English · ${title}` : grade12TutorContext(skill, unit)}
          />
        </Grade11RequireSignIn>
      </main>
    </div>
  );
}
