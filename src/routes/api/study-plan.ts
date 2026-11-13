import { createFileRoute } from "@tanstack/react-router";
import { getStudyPlan, postStudyPlan } from "@/lib/classroom/study-plan.server";
export const Route = createFileRoute("/api/study-plan")({
  server: {
    handlers: {
      GET: ({ request }) => getStudyPlan(request),
      POST: ({ request }) => postStudyPlan(request),
    },
  },
});
