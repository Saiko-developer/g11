import { UNIT1_GRAMMAR } from "./grade11Unit1Grammar";
import { GRADE11_ORAL_GRAMMAR } from "./grade11GrammarOral";
import { grade11OralChunks } from "./grade11OralChunks";
import { chunkScript } from "./grammarSpeechChunks";
import { sanitizeForSpeech } from "./sanitizeSpeech";

// Only fixed, authored Grade 11 grammar narration may enter this shared cache. Never chat or student audio.
export type AuthoredClip = { unit: number; text: string };
let authoredCache: Map<string, number> | null = null;
function authored(): Map<string, number> {
  if (authoredCache) return authoredCache;
  const map = new Map<string, number>();
  for (const section of UNIT1_GRAMMAR.sections)
    for (const segment of section.oral.segments ?? [])
      for (const text of chunkScript(sanitizeForSpeech(segment.scriptMy))) map.set(text, 1);
  for (const [unit, grammar] of Object.entries(GRADE11_ORAL_GRAMMAR))
    for (const section of grammar.sections)
      for (const segment of section.oral.segments ?? [])
        for (const text of grade11OralChunks(segment.scriptMy))
          if (!map.has(text)) map.set(text, Number(unit));
  authoredCache = map;
  return map;
}
export function grade11AuthoredClips(): AuthoredClip[] {
  return [...authored()].map(([text, unit]) => ({ unit, text }));
}

/** Bump CONTENT_VERSION when the voice pipeline changes in a way that should re-record every clip. */
const CONTENT_VERSION = "g11-grammar-v1";
export async function grade11AudioHash(text: string): Promise<string> {
  const identity = JSON.stringify([
    CONTENT_VERSION,
    text,
    "Puck",
    1,
    process.env.LOVABLE_TTS_MODEL?.trim() || "google/gemini-2.5-flash-tts",
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export type ClaimResult = "owner" | "busy" | "ready" | "gave_up";
export type AudioStore = {
  read(hash: string): Promise<ArrayBuffer | null>;
  claim(hash: string, unit: number): Promise<ClaimResult>;
  save(hash: string, unit: number, bytes: ArrayBuffer): Promise<void>;
  fail(hash: string, error: string): Promise<void>;
  stat(kind: "hit" | "miss" | "generated" | "error", hash?: string): Promise<void>;
};

const BUCKET = "grade11-grammar-audio";
const path = (hash: string) => `clips/${hash}.wav`;
/** Server-only store: private bucket + service-role table; students have no storage policies at all. */
export function supabaseAudioStore(): AudioStore {
  const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
  return {
    async read(hash) {
      const db = await admin();
      const { data: row } = await db
        .from("grade11_grammar_audio")
        .select("status")
        .eq("hash", hash)
        .maybeSingle();
      if (row?.status !== "ready") return null;
      const { data } = await db.storage.from(BUCKET).download(path(hash));
      return data ? await data.arrayBuffer() : null;
    },
    async claim(hash, unit) {
      const { data, error } = await (
        await admin()
      ).rpc("grade11_audio_claim", {
        p_hash: hash,
        p_unit: unit,
      });
      if (error) throw error;
      return data as ClaimResult;
    },
    async save(hash, unit, bytes) {
      const db = await admin();
      const { error } = await db.storage.from(BUCKET).upload(path(hash), bytes, {
        contentType: "audio/wav",
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw error;
      await db
        .from("grade11_grammar_audio")
        .update({
          status: "ready",
          unit,
          storage_path: path(hash),
          bytes: bytes.byteLength,
          last_error: null,
          lease_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("hash", hash);
    },
    async fail(hash, message) {
      await (
        await admin()
      )
        .from("grade11_grammar_audio")
        .update({
          status: "failed",
          last_error: message.slice(0, 300),
          lease_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("hash", hash);
    },
    async stat(kind, hash) {
      await (await admin()).rpc("grade11_audio_stat", { p_kind: kind, p_hash: hash });
    },
  };
}

const pending = new Map<
  string,
  Promise<{ bytes: ArrayBuffer | null; response?: Response; result: string }>
>();
const memory = new Map<string, ArrayBuffer>();
let memoryBytes = 0;
const MAX_BYTES = 24 * 1024 * 1024;
const MAX_CLIP = 8 * 1024 * 1024;
const MIN_CLIP = 1024;
/** Real WAV: RIFF/WAVE header plus non-silent sample data. Rejects zero-filled or truncated files. */
export function isPlayableWav(bytes: ArrayBuffer | null): bytes is ArrayBuffer {
  if (!bytes || bytes.byteLength < MIN_CLIP || bytes.byteLength > MAX_CLIP) return false;
  const u = new Uint8Array(bytes);
  const tag = (o: number) => String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]);
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return false;
  for (let i = 44; i < u.length; i++) if (u[i] !== 0) return true;
  return false;
}
const quiet = (task: Promise<unknown>) => task.catch(() => undefined);
const remember = (hash: string, bytes: ArrayBuffer) => {
  while (memoryBytes + bytes.byteLength > MAX_BYTES && memory.size) {
    const oldest = memory.keys().next().value!;
    memoryBytes -= memory.get(oldest)!.byteLength;
    memory.delete(oldest);
  }
  memory.set(hash, bytes);
  memoryBytes += bytes.byteLength;
};
const wav = (bytes: ArrayBuffer, result: string, hash: string) => {
  console.info("[grade11-grammar-audio]", result, hash.slice(0, 12));
  return new Response(bytes.slice(0), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, max-age=86400",
      "X-Grade11-Audio-Cache": result,
    },
  });
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Auth is checked by /api/tts before entering here, including on cache hits. */
export async function grade11GrammarAudio(
  _request: Request,
  body: { text: string; voice?: string; speed?: number; provider?: string },
  generate: () => Promise<Response>,
  store: AudioStore = supabaseAudioStore(),
  options: { waitMs?: number; pollMs?: number } = {},
): Promise<Response> {
  const unit = authored().get(body.text);
  if (body.voice !== "sarah" || (body.speed ?? 1) !== 1 || body.provider || !unit)
    return generate();
  let hash: string;
  try {
    hash = await grade11AudioHash(body.text);
  } catch {
    return generate();
  }
  if (process.env.AUDIO_MP3_PILOT_PLAYBACK === "true") {
    const { approvedMp3 } = await import("./permanent-audio/playback.server");
    const approved = await approvedMp3(hash);
    if (approved) return approved;
  }
  const cached = memory.get(hash);
  if (cached) {
    void quiet(store.stat("hit", hash));
    return wav(cached, "hit", hash);
  }
  let job = pending.get(hash);
  const shared = !!job;
  if (!job) {
    job = (async () => {
      let stored = await store.read(hash).catch(() => null);
      if (stored && !isPlayableWav(stored)) {
        // Corrupt saved file: mark it failed so it is regenerated instead of served.
        await quiet(store.fail(hash, "corrupt stored audio"));
        stored = null;
      }
      if (stored) {
        void quiet(store.stat("hit", hash));
        return { bytes: stored, result: "hit" };
      }
      const claim = await store.claim(hash, unit).catch(() => "unavailable" as const);
      if (claim === "unavailable") return { bytes: null, result: "unavailable" };
      if (claim === "ready" || claim === "busy") {
        const deadline = Date.now() + (options.waitMs ?? 25000);
        do {
          const ready = await store.read(hash).catch(() => null);
          if (isPlayableWav(ready)) {
            void quiet(store.stat("hit", hash));
            return { bytes: ready, result: "hit" };
          }
          if (claim === "ready") break;
          await sleep(options.pollMs ?? 1500);
        } while (Date.now() < deadline);
        return { bytes: null, result: "busy" };
      }
      if (claim === "gave_up") return { bytes: null, result: "gave_up" };
      void quiet(store.stat("miss", hash));
      const response = await generate();
      if (!response.ok || response.headers.get("X-TTS-Provider") !== "gemini") {
        void quiet(
          store.fail(
            hash,
            `provider ${response.status} ${response.headers.get("X-TTS-Provider") ?? ""}`,
          ),
        );
        void quiet(store.stat("error", hash));
        // Fallback voice or error goes back to this student only; nothing is cached.
        return { bytes: null, response, result: "uncached" };
      }
      const bytes = await response.arrayBuffer();
      if (!isPlayableWav(bytes)) {
        void quiet(store.fail(hash, `invalid audio ${(bytes as ArrayBuffer).byteLength}`));
        void quiet(store.stat("error", hash));
        return { bytes, result: "uncached" };
      }
      try {
        await store.save(hash, unit, bytes);
        void quiet(store.stat("generated", hash));
      } catch (error) {
        void quiet(store.fail(hash, error instanceof Error ? error.message : "save failed"));
      }
      return { bytes, result: "miss" };
    })();
    pending.set(hash, job);
  }
  try {
    const outcome = await job;
    if (outcome.response) return shared ? generate() : outcome.response;
    if (!outcome.bytes)
      return new Response("This lesson audio is being prepared. Please try again shortly.", {
        status: 503,
        headers: { "Retry-After": "5", "X-Grade11-Audio-Cache": outcome.result },
      });
    if (outcome.result !== "uncached") remember(hash, outcome.bytes);
    return wav(outcome.bytes, shared ? "shared" : outcome.result, hash);
  } finally {
    if (!shared) pending.delete(hash);
  }
}

/** Backwards-compatible name for the Unit 1 player. */
export const unit1GrammarAudio = grade11GrammarAudio;

/** Admin pre-generation: fills up to `limit` missing clips, one at a time. */
export async function pregenerateGrade11Audio(
  units: number[],
  limit: number,
  generate: (text: string) => Promise<Response>,
  store: AudioStore = supabaseAudioStore(),
  skip: Set<string> = new Set(),
): Promise<{ generated: number; skipped: number; failed: number }> {
  const out = { generated: 0, skipped: 0, failed: 0 };
  const clips = grade11AuthoredClips().filter((c) => units.includes(c.unit));
  for (const clip of clips) {
    const hash = await grade11AudioHash(clip.text);
    if (out.generated + out.failed >= limit) break;
    if (skip.has(hash)) {
      out.skipped++;
      continue;
    }
    const before = memory.has(hash);
    const res = await grade11GrammarAudio(
      new Request("https://local/api/tts"),
      { text: clip.text, voice: "sarah", speed: 1 },
      () => generate(clip.text),
      store,
      { waitMs: 0 },
    );
    const result = res.headers.get("X-Grade11-Audio-Cache");
    if (result === "miss") out.generated++;
    else if (result === "hit" || before) out.skipped++;
    else out.failed++;
    if (result === "miss") await sleep(400);
  }
  return out;
}
