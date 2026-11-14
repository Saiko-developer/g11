import { Blob as NodeBlob } from "node:buffer";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getReadingLesson } from "./lessons";
import { spokenStepAt } from "./types";
const m = vi.hoisted(() => ({
  speech: vi.fn(),
  claim: vi.fn(),
  existing: vi.fn(),
  upload: vi.fn(),
  update: vi.fn(),
  filters: vi.fn(),
  download: vi.fn(),
}));
vi.mock("@/lib/ttsGenerate.server", () => ({ generateSpeech: m.speech }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: m.claim,
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: m.existing }) }),
      update: (patch: unknown) => {
        const q = {
          eq: (...args: unknown[]) => {
            m.filters(...args);
            return q;
          },
          select: async () => {
            const result = await m.update(patch);
            return { data: result.data ?? [{ hash: "clip" }], error: result.error };
          },
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(m.update(patch)).then(resolve),
        };
        return q;
      },
    }),
    storage: { from: () => ({ upload: m.upload, download: m.download }) },
  },
}));
import {
  classroomAudioIdentity,
  prepareClassroomAudio,
  readOrPrepareClassroomAudio,
} from "./audio.server";
const lesson = getReadingLesson(10)!;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("LOVABLE_API_KEY", "test-only");
  vi.stubGlobal("crypto", webcrypto);
  m.existing.mockResolvedValue({ data: null, error: null });
  m.claim.mockResolvedValue({ data: true, error: null });
  m.speech.mockImplementation(
    async () =>
      new Response(new Uint8Array(2048), {
        headers: { "X-TTS-Provider": "gemini" },
      }),
  );
  m.upload.mockResolvedValue({ error: null });
  m.update.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("prepares the spoken introduction and full explanation as normal cached narration", async () => {
  for (const cursor of [0, 2, 3, 15, 63]) {
    expect((await prepareClassroomAudio(lesson, cursor)).status).toBe(200);
    expect(m.speech).toHaveBeenLastCalledWith({
      text: spokenStepAt(lesson, cursor).narration,
      voice: "sarah",
      speed: 1,
      provider: "gemini",
      signal: expect.any(AbortSignal),
    });
  }
  expect(m.speech.mock.calls[0][0].text).toContain("ကဲ သားတို့သမီးတို့ရေ");
  expect(m.speech.mock.calls[2][0].text).toContain("Your answer may be acceptable");
  expect(m.speech.mock.calls[4][0].text).toContain("အိမ်စာကို Unit တစ်ခုလုံး");
});
it("does not regenerate an existing ready clip", async () => {
  m.existing.mockResolvedValue({ data: { state: "ready" }, error: null });
  expect(await (await prepareClassroomAudio(lesson, 2)).json()).toEqual({ ok: true, cached: true });
  expect(m.claim).not.toHaveBeenCalled();
  expect(m.speech).not.toHaveBeenCalled();
});
it("refuses overlong scripts before claims, paid generation, or uploads", async () => {
  const tooLong = {
    ...lesson,
    segments: [{ ...lesson.segments[0], explanation: "က".repeat(3501) }],
  };
  expect((await prepareClassroomAudio(tooLong, 2)).status).toBe(422);
  expect(m.claim).not.toHaveBeenCalled();
  expect(m.speech).not.toHaveBeenCalled();
  expect(m.upload).not.toHaveBeenCalled();
});
it("never spends when a claim is denied without a usable cache record", async () => {
  m.claim.mockResolvedValue({ data: false, error: null });
  expect((await prepareClassroomAudio(lesson, 2)).status).toBe(503);
  expect(m.speech).not.toHaveBeenCalled();
});
it("script edits get new audio identities, including opening and closing edits", async () => {
  const first = await classroomAudioIdentity(lesson, 0);
  const changedOpening = {
    ...lesson,
    segments: lesson.segments.map((s, i) => (i ? s : { ...s, leadIn: "ပြင်ဆင်ထားသော မိတ်ဆက်" })),
  };
  expect((await classroomAudioIdentity(changedOpening, 0)).hash).not.toBe(first.hash);
  const closing = await classroomAudioIdentity(lesson, 63);
  const changedClosing = {
    ...lesson,
    segments: lesson.segments.map((s, i) =>
      i === 15 ? { ...s, closing: "ပြင်ဆင်ထားသော အဆုံးသတ်" } : s,
    ),
  };
  expect((await classroomAudioIdentity(changedClosing, 63)).hash).not.toBe(closing.hash);
});

it("reuses unchanged narration when another sentence is edited", async () => {
  const unchanged = await classroomAudioIdentity(lesson, 0);
  const edited = {
    ...lesson,
    segments: lesson.segments.map((s, i) =>
      i === 1 ? { ...s, explanation: "ပြန်ပြင်ထားတဲ့ ရှင်းပြချက်" } : s,
    ),
  };
  expect((await classroomAudioIdentity(edited, 0)).hash).toBe(unchanged.hash);
  expect((await classroomAudioIdentity(edited, 6)).hash).not.toBe(
    (await classroomAudioIdentity(lesson, 6)).hash,
  );
});

it("waits on an existing claim and never regenerates failed clips automatically", async () => {
  m.existing.mockResolvedValue({ data: { state: "preparing" }, error: null });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(202);
  m.existing.mockResolvedValue({ data: { state: "failed" }, error: null });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(503);
  expect(m.claim).not.toHaveBeenCalled();
  expect(m.speech).not.toHaveBeenCalled();
});
it("a losing concurrent caller waits for the winner without a second paid generation", async () => {
  m.existing
    .mockResolvedValueOnce({ data: null, error: null })
    .mockResolvedValueOnce({ data: { state: "preparing" }, error: null });
  m.claim.mockResolvedValue({ data: false, error: null });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(202);
  expect(m.speech).not.toHaveBeenCalled();
});

it("two first listeners share one generation and later listeners reuse the private audio", async () => {
  let state: string | null = null;
  m.existing.mockImplementation(async () => ({ data: state ? { state } : null, error: null }));
  m.claim.mockImplementation(async () => {
    if (state) return { data: false, error: null };
    state = "preparing";
    return { data: true, error: null };
  });
  m.update.mockImplementation(async () => {
    state = "ready";
    return { error: null };
  });
  m.download.mockImplementation(async () => ({
    data: new NodeBlob([new Uint8Array(2048)]),
    error: null,
  }));
  const results = await Promise.all([
    readOrPrepareClassroomAudio(lesson, 0),
    readOrPrepareClassroomAudio(lesson, 0),
  ]);
  expect(results.every((r) => r.status === 200 || r.status === 202)).toBe(true);
  expect(results.some((r) => r.status === 200)).toBe(true);
  expect(m.speech).toHaveBeenCalledTimes(1);
  const cached = await readOrPrepareClassroomAudio(lesson, 0);
  expect(cached.status).toBe(200);
  expect(cached.headers.get("Cache-Control")).toContain("private");
  expect((await cached.arrayBuffer()).byteLength).toBe(2048);
  expect(m.speech).toHaveBeenCalledTimes(1);
});
it("database read failures never trigger paid generation", async () => {
  m.existing.mockResolvedValue({ data: null, error: { code: "unavailable" } });
  expect((await readOrPrepareClassroomAudio(lesson, 0)).status).toBe(503);
  expect(m.claim).not.toHaveBeenCalled();
  expect(m.speech).not.toHaveBeenCalled();
});

it("recovers an expired preparing clip under a new fenced lease", async () => {
  m.existing.mockResolvedValue({
    data: { state: "preparing", lease_until: "2000-01-01T00:00:00Z", attempts: 1 },
    error: null,
  });
  m.download.mockResolvedValue({ data: null, error: { statusCode: "404" } });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(200);
  expect(m.claim).toHaveBeenCalledWith(
    "claim_classroom_audio_lease",
    expect.objectContaining({ p_token: expect.any(String) }),
  );
  expect(m.filters).toHaveBeenCalledWith("generation_token", m.claim.mock.calls[0][1].p_token);
  expect(m.speech).toHaveBeenCalledTimes(1);
});
it("restores audio uploaded by an interrupted worker without generating again", async () => {
  m.existing.mockResolvedValue({
    data: { state: "preparing", lease_until: "2000-01-01T00:00:00Z", attempts: 1 },
    error: null,
  });
  m.download.mockResolvedValue({ data: new NodeBlob([new Uint8Array(2048)]), error: null });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(200);
  expect(m.speech).not.toHaveBeenCalled();
  expect(m.upload).not.toHaveBeenCalled();
});
it("never lets an expired owner mark another worker's clip ready", async () => {
  m.update.mockResolvedValue({ data: [], error: null });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(202);
  expect(m.filters).toHaveBeenCalledWith("state", "preparing");
});
it("does not spend on repeated recovery of a permanently interrupted clip", async () => {
  m.existing.mockResolvedValue({
    data: { state: "preparing", lease_until: "2000-01-01T00:00:00Z", attempts: 3 },
    error: null,
  });
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(503);
  expect(m.claim).not.toHaveBeenCalled();
  expect(m.speech).not.toHaveBeenCalled();
});

it("a classroom generation deadline leaves an expired recoverable claim instead of a permanent pending row", async () => {
  const controller = new AbortController();
  controller.abort(new DOMException("Deadline", "TimeoutError"));
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  expect((await prepareClassroomAudio(lesson, 0)).status).toBe(503);
  expect(m.update).toHaveBeenCalledWith(
    expect.objectContaining({
      state: "preparing",
      last_error: "Generation timed out; retry available",
      lease_until: expect.any(String),
    }),
  );
});
