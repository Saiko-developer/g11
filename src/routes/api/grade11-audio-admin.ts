import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/api-guard.server";
import {
  grade11AudioHash,
  grade11AuthoredClips,
  pregenerateGrade11Audio,
} from "@/lib/grade11GrammarAudioCache.server";
import { generateSpeech } from "@/lib/ttsGenerate.server";

async function requireAdmin(request: Request): Promise<Response | null> {
  const authed = await requireUser(request, { enforceAccountStatus: true });
  if (authed instanceof Response) return authed;
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ _user_id: authed.userId }),
  });
  if (!res.ok || (await res.json().catch(() => false)) !== true)
    return Response.json({ error: "Admins only" }, { status: 403 });
  return null;
}

async function status() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const clips = grade11AuthoredClips();
  const hashes = await Promise.all(clips.map((c) => grade11AudioHash(c.text)));
  const { data: rows } = await supabaseAdmin
    .from("grade11_grammar_audio")
    .select("hash,status,bytes,hit_count,last_error");
  const byHash = new Map((rows ?? []).map((r) => [r.hash, r]));
  const units: Record<number, { total: number; ready: number; failed: number }> = {};
  let bytes = 0;
  let savedHits = 0;
  const ready = new Set<string>();
  clips.forEach((clip, i) => {
    const u = (units[clip.unit] ??= { total: 0, ready: 0, failed: 0 });
    u.total++;
    const row = byHash.get(hashes[i]);
    if (row?.status === "ready") {
      u.ready++;
      ready.add(hashes[i]);
      bytes += row.bytes;
      savedHits += row.hit_count;
    } else if (row?.status === "failed") u.failed++;
  });
  const { data: stats } = await supabaseAdmin
    .from("grade11_grammar_audio_stats")
    .select("hits,misses,generated,errors");
  const totals = (stats ?? []).reduce(
    (a, s) => ({
      hits: a.hits + s.hits,
      misses: a.misses + s.misses,
      generated: a.generated + s.generated,
      errors: a.errors + s.errors,
    }),
    { hits: 0, misses: 0, generated: 0, errors: 0 },
  );
  return {
    units,
    totalClips: clips.length,
    readyClips: ready.size,
    storageBytes: bytes,
    // Each cache hit is one TTS request that did not need to be made (an estimate, not billed credits).
    avoidedRequestsEstimate: savedHits,
    stats: totals,
    ready,
  };
}

export const Route = createFileRoute("/api/grade11-audio-admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const { ready: _ready, ...rest } = await status();
        return Response.json(rest);
      },
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const body = (await request.json().catch(() => ({}))) as { units?: unknown; limit?: unknown };
        const units = (Array.isArray(body.units) ? body.units : [])
          .map(Number)
          .filter((u) => Number.isInteger(u) && u >= 1 && u <= 12);
        const limit = Math.min(20, Math.max(1, Number(body.limit) || 10));
        if (!units.length) return Response.json({ error: "Choose units" }, { status: 400 });
        const current = await status();
        const result = await pregenerateGrade11Audio(
          units,
          limit,
          (text) => generateSpeech({ text, voice: "sarah", speed: 1 }),
          undefined,
          current.ready,
        );
        return Response.json(result);
      },
    },
  },
});
