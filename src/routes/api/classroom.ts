import { createFileRoute } from "@tanstack/react-router";
import { getClassroom, postClassroom } from "@/lib/classroom/handler.server";
export const Route = createFileRoute("/api/classroom")({
  server: {
    handlers: {
      GET: ({ request }) => getClassroom(request),
      POST: ({ request }) => postClassroom(request),
    },
  },
});
