import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { UnitClassroom } from "@/components/classroom/UnitClassroom";
import { isUnitSkill } from "@/lib/classroom/unit-course";
export const Route = createFileRoute("/class")({
  validateSearch: (search: Record<string, unknown>) => ({
    grade: (Number(search.grade) === 11 ? 11 : 10) as 10 | 11,
    unit:
      Number.isInteger(Number(search.unit)) && Number(search.unit) >= 1 && Number(search.unit) <= 12
        ? Number(search.unit)
        : 1,
    skill: isUnitSkill(search.skill) ? search.skill : undefined,
    start: search.start === true || search.start === "true" || search.start === "1",
  }),
  head: () => ({ meta: [{ title: "Saya Owl Unit Classroom" }] }),
  component: ClassPage,
});
function ClassPage() {
  const { start, grade, unit, skill } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4">
        <UnitClassroom
          key={`${grade}:${unit}`}
          grade={grade}
          unit={unit}
          skill={skill}
          autoStart={start}
        />
      </main>
    </div>
  );
}
