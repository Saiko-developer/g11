import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/audio-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.AUDIO_MP3_WORKER_SECRET;
        if (!secret || secret.length < 32)
          return Response.json({ error: "Worker is not configured" }, { status: 503 });
        const supplied = request.headers.get("authorization") ?? "";
        const { timingSafeEqual } = await import("node:crypto");
        const left = new TextEncoder().encode(supplied),
          right = new TextEncoder().encode(`Bearer ${secret}`);
        if (left.length !== right.length || !timingSafeEqual(left, right))
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json(
          await (await import("@/lib/permanent-audio/worker.server")).workOneAudioJob(),
        );
      },
    },
  },
});
