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
}));
vi.mock("@/lib/ttsGenerate.server", () => ({ generateSpeech: m.speech }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: m.claim,
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: m.existing }) }),
      update: () => ({ eq: m.update }),
    }),
    storage: { from: () => ({ upload: m.upload }) },
  },
}));
import { classroomAudioIdentity, prepareClassroomAudio } from "./audio.server";
const lesson = getReadingLesson(10)!;
beforeEach(() => {
  vi.clearAllMocks();
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
afterEach(() => vi.unstubAllGlobals());
it("prepares the spoken introduction and full explanation as normal cached narration", async () => {
  for (const cursor of [0, 2, 3, 15, 63]) {
    expect((await prepareClassroomAudio(lesson, cursor)).status).toBe(200);
    expect(m.speech).toHaveBeenLastCalledWith({
      text: spokenStepAt(lesson, cursor).narration,
      voice: "sarah",
      speed: 1,
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
it("never spends when the shared preparation cap denies a claim", async () => {
  m.claim.mockResolvedValue({ data: false, error: null });
  expect((await prepareClassroomAudio(lesson, 2)).status).toBe(409);
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
