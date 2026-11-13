import { createFileRoute } from "@tanstack/react-router";
import { getTeachingSetup, postTeachingSetup } from "@/lib/classroom/activation.server";
export const Route = createFileRoute("/api/teaching-setup")({
  server: {
    handlers: {
      GET: ({ request }) => getTeachingSetup(request),
      POST: ({ request }) => postTeachingSetup(request),
    },
  },
});
