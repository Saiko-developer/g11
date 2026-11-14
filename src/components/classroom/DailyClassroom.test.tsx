import { StrictMode, type ReactNode } from "react";
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
          admin: true,
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
  expect(screen.queryByText(/ဆရာ \/ Admin/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "ဒီနေ့အတန်း အသံပြင်ဆင်မယ်" }),
  ).not.toBeInTheDocument();
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
        admin: true,
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

it("prepares all assigned clips before starting speech and leaves listening progress untouched", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  let releaseLast: (() => void) | undefined;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (body?.action === "warm_audio" && body.cursor === 15)
      return new Promise<Response>((resolve) => {
        releaseLast = () => resolve(Response.json({ ok: true }));
      });
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await screen.findByRole("status", { name: "Class preparation" });
  await waitFor(() => expect(releaseLast).toBeDefined());
  expect(AudioMock.all).toHaveLength(0);
  expect(
    vi
      .mocked(fetch)
      .mock.calls.filter(
        ([, init]) => init?.body && JSON.parse(init.body as string).action === "save",
      ),
  ).toHaveLength(0);
  expect(screen.queryByText(/ဝါကျ 1 မှ 4 အထိ/)).not.toBeInTheDocument();
  await act(async () => releaseLast!());
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.queryByRole("status", { name: "Class preparation" })).not.toBeInTheDocument();
  const warms = vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) => init?.body && JSON.parse(init.body as string).action === "warm_audio",
    );
  expect(warms).toHaveLength(16);
  await act(async () => AudioMock.all[0].finish());
  await waitFor(() => expect(AudioMock.all).toHaveLength(2));
  expect(
    vi
      .mocked(fetch)
      .mock.calls.filter(
        ([, init]) => init?.body && JSON.parse(init.body as string).action === "warm_audio",
      ),
  ).toHaveLength(16);
});

it("Pause during preparation prevents late playback and resumes without rewarming ready clips", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  let release: (() => void) | undefined;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (body?.action === "warm_audio" && body.cursor === 15)
      return new Promise<Response>((resolve) => {
        release = () => resolve(Response.json({ ok: true }));
      });
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await waitFor(() => expect(release).toBeDefined());
  const firstRelease = release;
  fireEvent.click(screen.getByRole("button", { name: "ခဏရပ်မယ်" }));
  await act(async () => firstRelease!());
  expect(AudioMock.all).toHaveLength(0);
  expect(screen.queryByRole("status", { name: "Class preparation" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "ဆရာနဲ့ ပြန်ဆက်သင်မယ်" }));
  await waitFor(() => expect(release).not.toBe(firstRelease));
  await act(async () => release!());
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  const warms = vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) => init?.body && JSON.parse(init.body as string).action === "warm_audio",
    );
  expect(warms.filter(([, init]) => JSON.parse(init!.body as string).cursor === 0)).toHaveLength(1);
});

it("a browser autoplay block offers Play without regenerating prepared narration", async () => {
  let blocked = true;
  class GestureAudio extends AudioMock {
    override play = vi.fn(async () => {
      if (blocked) {
        blocked = false;
        throw new DOMException("Gesture required", "NotAllowedError");
      }
    });
  }
  vi.stubGlobal("Audio", GestureAudio);
  render(<DailyClassroom autoStart />);
  await screen.findByText("အသံအဆင်သင့်ပါပြီ။ ပြန်ဆက်သင်မယ် ခလုတ်ကို နှိပ်ပါ။");
  fireEvent.click(screen.getByRole("button", { name: "ဆရာနဲ့ ပြန်ဆက်သင်မယ်" }));
  await waitFor(() => expect(AudioMock.all[0].play).toHaveBeenCalledTimes(2));
  expect(AudioMock.all).toHaveLength(1);
  const warms = vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) => init?.body && JSON.parse(init.body as string).action === "warm_audio",
    );
  expect(warms).toHaveLength(16);
});

it("starts buffered teaching after StrictMode effect cleanup and setup", async () => {
  render(
    <StrictMode>
      <DailyClassroom autoStart />
    </StrictMode>,
  );
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("shows a recoverable message for unexpected browser aborts and resumes on Play", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  let interrupt = true;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (body?.action === "warm_audio" && interrupt) {
      interrupt = false;
      throw new DOMException("signal is aborted without reason", "AbortError");
    }
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await screen.findByText("အတန်းကို ခဏရပ်ထားပါတယ်။ ပြန်ဆက်သင်မယ် ခလုတ်ကို နှိပ်နိုင်ပါတယ်။");
  expect(screen.queryByText("signal is aborted without reason")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "ဆရာနဲ့ ပြန်ဆက်သင်မယ်" }));
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
});

it("does not render cancelled study-plan loads as errors or offer accidental re-enrollment", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (input === "/api/study-plan" && !init?.body)
      throw new DOMException("signal is aborted without reason", "AbortError");
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await screen.findByRole("button", { name: "ပြန်ဖွင့်မယ်" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByText(/ပထမဆုံးအကြိမ်/)).not.toBeInTheDocument();
  expect(screen.queryByText("signal is aborted without reason")).not.toBeInTheDocument();
});
it("cancelled questions remain retryable without displaying a red error", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (init?.body && JSON.parse(init.body as string).action === "ask")
      throw new Error("signal is aborted without reason");
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  fireEvent.click(screen.getByRole("button", { name: "ဆရာ၊ မေးချင်ပါတယ်" }));
  fireEvent.change(screen.getByLabelText(/ဆရာကို မေးပါ/), {
    target: { value: "What does may mean?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "မေးမယ်" }));
  await screen.findByText("မေးခွန်းချိတ်ဆက်မှု ခဏရပ်သွားပါသည်။ လိုအပ်လျှင် ပြန်မေးနိုင်ပါတယ်။");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("cancelled completion waits for explicit retry and never loops or displays a red error", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  let finishes = 0;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (input === "/api/study-plan" && body?.action === "finish" && ++finishes === 1)
      throw new DOMException("signal is aborted without reason", "AbortError");
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  for (let i = 0; i < 16; i++) {
    await act(async () => AudioMock.all[i].finish());
    if (i < 15) await waitFor(() => expect(AudioMock.all).toHaveLength(i + 2));
  }
  await screen.findByText("မှတ်တမ်းသိမ်းခြင်း ခဏရပ်သွားပါသည်။ ပြန်သိမ်းနိုင်ပါတယ်။");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(finishes).toBe(1);
  fireEvent.click(screen.getByRole("button", { name: "မှတ်တမ်း ပြန်သိမ်းမယ်" }));
  await waitFor(() => expect(finishes).toBe(2));
});
it("cancelled progress saves require reconnecting without displaying the browser exception", async () => {
  const normalFetch = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (init?.body && JSON.parse(init.body as string).action === "save")
      throw new DOMException("signal is aborted without reason", "AbortError");
    return normalFetch(input, init);
  });
  render(<DailyClassroom autoStart />);
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  await act(async () => AudioMock.all[0].finish());
  await screen.findByText("မှတ်တမ်းချိတ်ဆက်မှု ရပ်သွားပါသည်။ Refresh လုပ်ပြီး မှတ်တမ်းပြန်ယူပါ။");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByText("signal is aborted without reason")).not.toBeInTheDocument();
});
