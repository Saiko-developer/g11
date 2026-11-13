import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { TeachingSetup } from "@/components/classroom/TeachingSetup";
export const Route = createFileRoute("/teaching-setup")({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="px-4">
        <TeachingSetup />
      </main>
    </div>
  ),
});
