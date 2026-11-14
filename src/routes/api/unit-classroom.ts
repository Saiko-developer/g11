import { createFileRoute } from "@tanstack/react-router";
import { getUnitCourse, postUnitCourse } from "@/lib/classroom/unit-course.server";
export const Route = createFileRoute("/api/unit-classroom")({
  server: {
    handlers: {
      GET: ({ request }) => getUnitCourse(request),
      POST: ({ request }) => postUnitCourse(request),
    },
  },
});
