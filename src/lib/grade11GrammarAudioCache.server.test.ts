import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { UNIT1_GRAMMAR } from "./grade11Unit1Grammar";
import { chunkScript } from "./grammarSpeechChunks";
import { sanitizeForSpeech } from "./sanitizeSpeech";
import type { AudioStore, ClaimResult } from "./grade11GrammarAudioCache.server";

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/** In-memory stand-in for the private storage bucket + table. */
function fakeStore(files = new Map<string, ArrayBuffer>()) {
  const store: AudioStore & { files: Map<string, ArrayBuffer> } = {
    files,
    read: async (h) => files.get(h) ?? null,
    claim: async (h): Promise<ClaimResult> => (files.has(h) ? "ready" : "owner"),
    save: async (h, _u, b) => {
      files.set(h, b);
    },
    fail: async () => {},
    stat: async () => {},
  };
  return store;
}

const request = new Request("https://school.example/api/tts");
const body = {
  text: chunkScript(sanitizeForSpeech(UNIT1_GRAMMAR.sections[0].oral.segments![0].scriptMy))[0],
  voice: "sarah",
  speed: 1,
};
function wavBytes(size = 2048) {
  const u = new Uint8Array(size);
  u.set([82, 73, 70, 70], 0);
  u.set([87, 65, 86, 69], 8);
  u.fill(7, 44);
  return u;
}
const audio = () =>
  new Response(wavBytes(), {
    headers: { "Content-Type": "audio/wav", "X-TTS-Provider": "gemini" },
  });

it("reuses authored clips without calling TTS and invalidates on model change", async () => {
  const { grade11GrammarAudio } = await import("./grade11GrammarAudioCache.server");
  const store = fakeStore();
  const generate = vi.fn(async () => audio());
  const first = await grade11GrammarAudio(request, body, generate, store);
  expect(first.headers.get("X-Grade11-Audio-Cache")).toBe("miss");
  expect((await first.arrayBuffer()).byteLength).toBe(2048);
  const next = await grade11GrammarAudio(request, body, generate, store);
  expect(next.headers.get("X-Grade11-Audio-Cache")).toBe("hit");
  expect(generate).toHaveBeenCalledTimes(1);
  vi.stubEnv("LOVABLE_TTS_MODEL", "new-model");
  await grade11GrammarAudio(request, body, generate, store);
  expect(generate).toHaveBeenCalledTimes(2);
});

it("coalesces simultaneous requests for the same clip", async () => {
  const { grade11GrammarAudio } = await import("./grade11GrammarAudioCache.server");
  const store = fakeStore();
  let finish!: (value: Response) => void;
  const generate = vi.fn(() => new Promise<Response>((resolve) => (finish = resolve)));
  const one = grade11GrammarAudio(request, body, generate, store);
  const two = grade11GrammarAudio(request, body, generate, store);
  await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
  finish(audio());
  const results = await Promise.all([one, two]);
  expect(await Promise.all(results.map(async (r) => (await r.arrayBuffer()).byteLength))).toEqual([2048, 2048]);
});

it("never caches student text, other voices, errors or fallback speech", async () => {
  const { grade11GrammarAudio } = await import("./grade11GrammarAudioCache.server");
  const store = fakeStore();
  const generate = vi.fn(async () => audio());
  for (let i = 0; i < 2; i++) {
    await grade11GrammarAudio(request, { ...body, text: "private student message" }, generate, store);
    await grade11GrammarAudio(request, { ...body, voice: "echo" }, generate, store);
  }
  expect(generate).toHaveBeenCalledTimes(4);
  const failed = vi.fn(async () => new Response("credits", { status: 402 }));
  await grade11GrammarAudio(request, body, failed, store);
  await grade11GrammarAudio(request, body, failed, store);
  expect(failed).toHaveBeenCalledTimes(2);
  const fallback = vi.fn(
    async () => new Response(wavBytes(), { headers: { "X-TTS-Provider": "openai" } }),
  );
  await grade11GrammarAudio(request, body, fallback, store);
  await grade11GrammarAudio(request, body, fallback, store);
  expect(fallback).toHaveBeenCalledTimes(2);
  expect(store.files.size).toBe(0);
});

it("serves saved audio after a worker restart and fails closed during storage outages", async () => {
  const files = new Map<string, ArrayBuffer>();
  let module = await import("./grade11GrammarAudioCache.server");
  const generate = vi.fn(async () => audio());
  await module.grade11GrammarAudio(request, body, generate, fakeStore(files));
  vi.resetModules();
  module = await import("./grade11GrammarAudioCache.server");
  const again = await module.grade11GrammarAudio(request, body, generate, fakeStore(files));
  expect(again.headers.get("X-Grade11-Audio-Cache")).toBe("hit");
  expect(generate).toHaveBeenCalledTimes(1);
  vi.resetModules();
  module = await import("./grade11GrammarAudioCache.server");
  const broken: AudioStore = {
    read: async () => { throw new Error("offline"); },
    claim: async () => { throw new Error("offline"); },
    save: async () => { throw new Error("full"); },
    fail: async () => {},
    stat: async () => {},
  };
  expect((await module.grade11GrammarAudio(request, body, generate, broken)).status).toBe(503);
  expect(generate).toHaveBeenCalledTimes(1);
});

it("does not generate billable audio when the claim service is down", async () => {
  const { grade11GrammarAudio } = await import("./grade11GrammarAudioCache.server");
  const store = fakeStore();
  store.claim = async () => { throw new Error("database unavailable"); };
  const generate = vi.fn(async () => audio());
  const response = await grade11GrammarAudio(request, body, generate, store, { waitMs: 0 });
  expect(response.status).toBe(503);
  expect(generate).not.toHaveBeenCalled();
});

it("never serves a zero-filled saved file and regenerates it", async () => {
  const { grade11GrammarAudio, grade11AudioHash } = await import("./grade11GrammarAudioCache.server");
  const files = new Map<string, ArrayBuffer>();
  files.set(await grade11AudioHash(body.text), new Uint8Array(2048).buffer);
  const store = fakeStore(files);
  store.claim = async () => "owner";
  const generate = vi.fn(async () => audio());
  const res = await grade11GrammarAudio(request, body, generate, store);
  expect(res.headers.get("X-Grade11-Audio-Cache")).toBe("miss");
  expect(generate).toHaveBeenCalledTimes(1);
  expect(new Uint8Array(await res.arrayBuffer())[0]).toBe(82);
});
