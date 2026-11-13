import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DailyClassroom } from "./DailyClassroom";
import { getReadingLesson } from "@/lib/classroom/lessons";
import { dailyAssignment } from "@/lib/classroom/study-plan";
vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({ session: { user: { id: "alice" } }, ready: true }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/lesson/ExerciseKit", () => ({ AnswerTryBox: () => null }));
const lesson = getReadingLesson(10)!;
const plan = {
  grade: 10,
  planVersion: "reading-daily-v1",
  lessonId: lesson.id,
  lessonVersion: lesson.version,
  ...dailyAssignment(lesson, [], "2026-11-13"),
};
class AudioMock {
  static all: AudioMock[] = [];
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
    AudioMock.all.push(this);
  }
  play = vi.fn(async () => {});
  pause = vi.fn();
  finish() {
    this.ended = true;
    this.onended?.();
  }
}
beforeEach(() => {
  AudioMock.all = [];
  vi.stubGlobal("Audio", AudioMock);
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const b = init?.body ? JSON.parse(init.body as string) : null;
      if (input === "/api/study-plan")
        return Response.json({
          plan: b?.action === "finish" ? { ...plan, todayDone: true, completedClasses: 1 } : plan,
        });
      if (!init?.method)
        return Response.json({
          progress: { cursor: 0, offset: 0, completed: [], revision: 0 },
          published: true,
          admin: false,
        });
      if (b.action === "audio") return new Response(new Uint8Array(2048));
      return Response.json({ ok: true, revision: b.revision + 1 });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
it("restores the learner's assigned class without choosing a unit or section", async () => {
  render(<DailyClassroom />);
  await screen.findByRole("button", { name: "အတန်းစမယ်" });
  expect(screen.queryByText(/ပထမဆုံးအကြိမ်/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "အတန်းစမယ်" }));
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.getByLabelText("Classroom whiteboard")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
});
it("teacher advances all 16 daily steps automatically, stops before tomorrow, and saves completion once", async () => {
  render(<DailyClassroom />);
  fireEvent.click(await screen.findByRole("button", { name: "အတန်းစမယ်" }));
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  for (let i = 0; i < 16; i++) {
    await act(async () => AudioMock.all[i].finish());
    if (i < 15) await waitFor(() => expect(AudioMock.all).toHaveLength(i + 2));
  }
  await screen.findByRole("heading", { name: "ဒီနေ့အတန်းပြီးပါပြီ" });
  await waitFor(() =>
    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(
          ([url, init]) =>
            url === "/api/study-plan" &&
            init?.body &&
            JSON.parse(init.body as string).action === "finish",
        ),
    ).toHaveLength(1),
  );
  expect(AudioMock.all).toHaveLength(16);
  const audioRequests = vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) => init?.body && JSON.parse(init.body as string).action === "audio",
    )
    .map(([, init]) => JSON.parse(init!.body as string).cursor);
  expect(audioRequests).toEqual(Array.from({ length: 16 }, (_, i) => i));
});

it("Home Start Class enters the enrolled learner's assigned room with no second start click", async () => {
  render(<DailyClassroom autoStart />);
  await screen.findByLabelText("Classroom whiteboard");
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.queryByRole("button", { name: "အတန်းစမယ်" })).not.toBeInTheDocument();
});
