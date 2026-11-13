import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DailyClassroom } from "./DailyClassroom";
import { getReadingLesson } from "@/lib/classroom/lessons";
import { dailyAssignment, studyPlanVersion } from "@/lib/classroom/study-plan";
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
  planVersion: studyPlanVersion(lesson),
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
it("teacher waits for understanding after each sentence and saves completion once", async () => {
  render(<DailyClassroom />);
  fireEvent.click(await screen.findByRole("button", { name: "အတန်းစမယ်" }));
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  fireEvent.click(
    screen.getByRole("checkbox", { name: "ဝါကျတစ်ကြောင်းပြီးတိုင်း နားလည်မှု စစ်ပြီးသင်မယ်" }),
  );
  for (let i = 0; i < 16; i++) {
    await act(async () => AudioMock.all[i].finish());
    if (i % 4 === 3) {
      await screen.findByRole("region", { name: "Teacher dialogue" });
      expect(AudioMock.all).toHaveLength(i + 1);
      if (i === 3) {
        fireEvent.click(screen.getByRole("button", { name: "ဆရာ၊ ထပ်ရှင်းပြပါ" }));
        expect(screen.getByText(/It may rain today/)).toBeInTheDocument();
        expect(
          vi
            .mocked(fetch)
            .mock.calls.some(
              ([, init]) => init?.body && JSON.parse(init.body as string).action === "ask",
            ),
        ).toBe(false);
      }
      fireEvent.click(screen.getByRole("button", { name: "နားလည်ပြီ၊ ဆက်သင်မယ်" }));
    }
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

it("replays a completed class from its first sentence instead of its last clip", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (input === "/api/study-plan" && !init?.body)
      return Response.json({ plan: { ...plan, todayDone: true, completedClasses: 1 } });
    if (String(input).startsWith("/api/classroom?") && !init?.method)
      return Response.json({
        progress: {
          cursor: 15,
          offset: 4,
          completed: Array.from({ length: 16 }, (_, i) => i),
          revision: 2,
        },
        published: true,
        admin: false,
      });
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  fireEvent.click(await screen.findByRole("button", { name: "ဒီနေ့အတန်း အစက ပြန်သင်မယ်" }));
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  const requests = vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) => init?.body && JSON.parse(init.body as string).action === "audio",
    );
  expect(JSON.parse(requests[0][1]!.body as string).cursor).toBe(0);
  for (let i = 0; i < 16; i++) {
    await act(async () => AudioMock.all[i].finish());
    if (i < 15) await waitFor(() => expect(AudioMock.all).toHaveLength(i + 2));
  }
  await screen.findByRole("heading", { name: "ဒီနေ့အတန်းပြီးပါပြီ" });
  expect(
    vi
      .mocked(fetch)
      .mock.calls.filter(
        ([url, init]) =>
          url === "/api/study-plan" &&
          init?.body &&
          JSON.parse(init.body as string).action === "finish",
      ),
  ).toHaveLength(0);
});

it("keeps the default class automatic and resumes after free supplementary help", async () => {
  render(<DailyClassroom autoStart />);
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  AudioMock.all[0].currentTime = 2;
  fireEvent.click(screen.getByRole("button", { name: "ဥပမာနဲ့ ထပ်ရှင်းပြပါ" }));
  expect(screen.getByText(/It may rain today/)).toBeInTheDocument();
  expect(AudioMock.all[0].pause).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "နားလည်ပြီ၊ ဆက်သင်မယ်" }));
  expect(AudioMock.all[0].currentTime).toBe(2);
  for (let i = 0; i < 16; i++) {
    await act(async () => AudioMock.all[i].finish());
    if (i < 15) await waitFor(() => expect(AudioMock.all).toHaveLength(i + 2));
  }
  await screen.findByRole("heading", { name: "ဒီနေ့အတန်းပြီးပါပြီ" });
  expect(screen.queryByRole("region", { name: "Teacher dialogue" })).not.toBeInTheDocument();
});
