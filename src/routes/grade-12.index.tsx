import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { GradeSwitcher } from "@/components/grade11/GradeSwitcher";
import { Unit1Lesson } from "@/components/grade12/Unit1Lesson";
import { unit1Sections } from "@/data/grade12/unit1";

export const Route = createFileRoute("/grade-12/")({
  validateSearch: (search: Record<string, unknown>) => ({
    skill: unit1Sections.find((section) => section.id === search.skill)?.id ?? "reading",
  }),
  head: () => ({ meta: [{ title: "Grade 12 English | Sayar Owl Academy" }] }),
  component: Grade12Home,
});

function Grade12Home() {
  const { skill } = Route.useSearch();
  const section = unit1Sections.find((item) => item.id === skill) ?? unit1Sections[0];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <GradeSwitcher current={12} />
        <header className="space-y-2">
          <p className="text-sm font-semibold text-primary">Grade 12 English</p>
          <h1 className="text-3xl font-bold">Unit 1 · Good Manners</h1>
        </header>
        <nav aria-label="Unit 1 skills" className="flex flex-wrap gap-2">
          {unit1Sections.map((item) => (
            <Link
              to="/grade-12"
              search={{ skill: item.id }}
              key={item.id}
              aria-current={skill === item.id ? "page" : undefined}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${skill === item.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >
              {item.code} {item.title}
            </Link>
          ))}
        </nav>
        <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
          <h2 className="text-xl font-semibold">{section.topic}</h2>
          <Unit1Lesson section={section} key={section.id} />
        </article>
      </main>
    </div>
  );
}
