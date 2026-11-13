import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ClassroomPlayer } from "./ClassroomPlayer";
import { getReadingLesson } from "@/lib/classroom/lessons";
const state = vi.hoisted(() => ({ user: "alice" }));
vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({ session: { user: { id: state.user } }, ready: true }),
}));
vi.mock("@/components/lesson/ExerciseKit", () => ({
  AnswerTryBox: ({ question }: { question: string }) => <p>{question}</p>,
}));
const lesson = getReadingLesson(10)!;
class FakeAudio {
  static all: FakeAudio[] = [];
  currentTime = 0;
  duration = 10;
  ended = false;
  src = "";
  onended: (() => void) | null = null;
  onloadedmetadata: (() => void) | null = null;
  ontimeupdate: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
    FakeAudio.all.push(this);
  }
  play = vi.fn(async () => {
    const loaded = this.onloadedmetadata;
    this.onloadedmetadata = null;
    loaded?.();
  });
  pause = vi.fn();
  finish() {
    this.ended = true;
    this.onended?.();
  }
}
beforeEach(() => {
  state.user = "alice";
  FakeAudio.all = [];
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      if (!init?.method)
        return Response.json({
          progress: { cursor: 0, offset: 0, completed: [], revision: 0 },
          published: true,
          admin: false,
        });
      const body = JSON.parse(init.body as string);
      if (body.action === "audio")
        return new Response(new Uint8Array(2048), { headers: { "Content-Type": "audio/wav" } });
      if (body.action === "ask") return Response.json({ answer: "ဒီဝါကျကို ရှင်းပြပါမယ်။" });
      return Response.json({ ok: true, revision: body.revision + 1 });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
it("automatically teaches English then translation, explanation, reasoning and the next sentence", async () => {
  render(<ClassroomPlayer lesson={lesson} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Resume / Play" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Resume / Play" }));
  await waitFor(() => expect(FakeAudio.all).toHaveLength(1));
  for (const [i, expected] of [
    [0, lesson.segments[0].translation],
    [1, lesson.segments[0].explanation],
    [2, lesson.segments[0].reasoning],
    [3, lesson.segments[1].english],
  ] as const) {
    await act(async () => FakeAudio.all[i].finish());
    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument());
  }
});
it("next does not unlock comprehension, and manual mode acknowledges only the viewed step", async () => {
  render(<ClassroomPlayer lesson={lesson} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.queryByText(lesson.questions[0].question)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /Manual Mode/ }));
  fireEvent.click(screen.getByRole("button", { name: /ဖတ်ပြီး/ }));
  expect(screen.getByText("1 / 64 steps")).toBeInTheDocument();
});
it("asking pauses audio and resumes the same sentence instead of skipping it", async () => {
  render(<ClassroomPlayer lesson={lesson} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Ask Teacher" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Resume / Play" }));
  await waitFor(() => expect(FakeAudio.all).toHaveLength(1));
  FakeAudio.all[0].currentTime = 4;
  fireEvent.click(screen.getByRole("button", { name: "Ask Teacher" }));
  expect(FakeAudio.all[0].pause).toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("ဒီဝါကျနဲ့ပတ်သက်ပြီး မေးပါ"), {
    target: { value: "may be ဆိုတာ ဘာလဲ" },
  });
  fireEvent.click(screen.getByRole("button", { name: "မေးမယ်" }));
  await screen.findByText("ဒီဝါကျကို ရှင်းပြပါမယ်။");
  fireEvent.click(screen.getByRole("button", { name: "သင်ခန်းစာ ပြန်ဆက်မယ်" }));
  expect(FakeAudio.all).toHaveLength(1);
  expect(FakeAudio.all[0].currentTime).toBe(4);
  expect(screen.getByText("0 / 64 steps")).toBeInTheDocument();
});
