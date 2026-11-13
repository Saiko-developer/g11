import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { DailyClassroom } from "@/components/classroom/DailyClassroom";
export const Route = createFileRoute("/class")({
  validateSearch: (search: Record<string, unknown>) => ({
    start: search.start === true || search.start === "true" || search.start === "1",
  }),
  head: () => ({ meta: [{ title: "Saya Owl Daily Classroom" }] }),
  component: ClassPage,
});
function ClassPage() {
  const { start } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4">
        <DailyClassroom autoStart={start} />
      </main>
    </div>
  );
}
