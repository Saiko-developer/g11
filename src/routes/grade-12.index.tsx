import { Fragment, useState } from "react";
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
  validateSearch: (search: Record<string, unknown>): { skill?: Grade12Skill } => ({
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
              return unit === 1 ? (
                <Link
                  key={id}
                  to="/grade-12"
                  search={{ skill: id }}
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

function SkillLinks({ current }: { current: Grade12Skill }) {
  return (
    <nav aria-label="Unit 1 skills" className="flex flex-wrap gap-2">
      {grade12Skills.map((skill) => (
        <Link
          to="/grade-12"
          search={{ skill }}
          key={skill}
          aria-current={skill === current ? "page" : undefined}
          className={`rounded-full border px-3 py-2 text-sm font-medium capitalize ${skill === current ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
        >
          {skill}
        </Link>
      ))}
    </nav>
  );
}

function Curriculum() {
  const [open, setOpen] = useState<number | null>(1);
  return (
    <div className="space-y-3">
      {grade12Units.map(({ number, title, page }) => {
        const review = number % 3 === 0 ? grade12Reviews[number / 3 - 1] : null;
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
                    {number > 1 && (
                      <p className="text-sm text-muted-foreground">
                        Textbook page {page} · <span lang="my">သင်ခန်းစာ မထည့်ရသေးပါ။</span>
                      </p>
                    )}
                    <UnitSkillCards unit={number} />
                  </>
                )}
              </div>
            </section>
            {review && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-accent/60 bg-accent/15 px-4 py-2.5 text-xs font-semibold">
                <Sparkles aria-hidden="true" className="size-4" />
                <span>
                  Review {number / 3} · p. {review.reviewPage}
                </span>
                <span className="h-px min-w-6 flex-1 bg-accent/50" />
                <span>
                  Poem {number / 3} · {review.poem} · p. {review.poemPage}
                </span>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Grade12Home() {
  const { skill } = Route.useSearch();
  const section = unit1Sections.find((item) => item.id === skill);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className={`mx-auto space-y-5 px-4 py-8 ${skill ? "max-w-6xl" : "max-w-5xl"}`}>
        {skill ? (
          <>
            <Link
              to="/grade-12"
              search={{}}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ArrowLeft aria-hidden="true" className="size-4" /> Grade 12 Units
            </Link>
            <header>
              <p className="font-semibold text-primary">Unit 1</p>
              <h1 className="text-3xl font-bold">Good Manners</h1>
              <p lang="my" className="text-muted-foreground">
                အမူအကျင့်ကောင်းများ
              </p>
            </header>
            <SkillLinks current={skill} />
            {skill === "listening" || skill === "speaking" ? (
              <Unit1ListeningSpeaking key={skill} skill={skill} />
            ) : (
              section && (
                <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
                  <h2 className="text-xl font-semibold">{section.topic}</h2>
                  <Unit1Lesson section={section} key={section.id} />
                </article>
              )
            )}
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
            <Curriculum />
          </>
        )}
      </main>
    </div>
  );
}
