import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/audio-manager")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/permanent-audio/admin.server")).audioManagerGet(request),
      POST: async ({ request }) =>
        (await import("@/lib/permanent-audio/admin.server")).audioManagerPost(request),
    },
  },
});
