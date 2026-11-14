import { StrictMode, type ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { UnitClassroom } from "./UnitClassroom";
import { UNIT_SKILLS, getUnitLesson } from "@/lib/classroom/unit-course";
import { emptyProgress } from "@/lib/classroom/types";
const auth = vi.hoisted(() => ({ user: "alice" as string | undefined }));
vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({ session: auth.user ? { user: { id: auth.user } } : null, ready: true }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
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
const records: Record<string, ReturnType<typeof emptyProgress>> = {};
let completeReading = false;
beforeEach(() => {
  auth.user = "alice";
  completeReading = false;
  AudioMock.all = [];
  for (const key of Object.keys(records)) delete records[key];
  vi.stubGlobal("Audio", AudioMock);
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : null;
      if (url.startsWith("/api/unit-classroom")) {
        if (body?.action === "finish_section") completeReading = true;
        return Response.json({
          sections: UNIT_SKILLS.map((skill) => ({
            skill,
            published: true,
            completed: skill === "reading" && completeReading,
            answers: {},
            practised: false,
            cursor: records[`g10-u1-${skill}`]?.cursor ?? 0,
            steps: records[`g10-u1-${skill}`]?.completed ?? [],
          })),
          homework: null,
        });
      }
      const id =
        body?.lessonId ??
        new URL(url, "https://school.test").searchParams.get("lessonId") ??
        "g10-u1-reading";
      const p = records[id] ?? emptyProgress();
      if (!init?.method) return Response.json({ progress: p, published: true, admin: false });
      if (body.action === "audio") return new Response(new Uint8Array(1024));
      if (body.action === "save") {
        records[id] = {
          cursor: body.cursor,
          offset: body.offset,
          completed: [...new Set([...p.completed, ...body.completed])] as number[],
          revision: p.revision + 1,
        };
        return Response.json({ ok: true, revision: records[id].revision });
      }
      return Response.json({ ok: true });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
it("continues unfinished Reading on the same day and preserves completed audio steps", async () => {
  records["g10-u1-reading"] = {
    cursor: 15,
    offset: 0,
    completed: Array.from({ length: 16 }, (_, i) => i),
    revision: 5,
  };
  render(
    <StrictMode>
      <UnitClassroom grade={10} unit={1} autoStart />
    </StrictMode>,
  );
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.queryByText("ဒီနေ့အတန်းပြီးပါပြီ")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Classroom whiteboard")).toHaveTextContent(
    getUnitLesson(10, 1, "reading")!.segments[4].english,
  );
  expect(screen.queryByRole("button", { name: /ဖွင့်မယ်/ })).not.toBeInTheDocument();
});
it("waits for the full Reading passage before comprehension and then advances to Vocabulary", async () => {
  records["g10-u1-reading"] = {
    cursor: 63,
    offset: 0,
    completed: Array.from({ length: 63 }, (_, i) => i),
    revision: 6,
  };
  render(<UnitClassroom grade={10} unit={1} autoStart />);
  expect(screen.queryByText(/ဖတ်စာအပြည့်ပြီးပါပြီ/)).not.toBeInTheDocument();
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  await act(async () => AudioMock.all[0].finish());
  await screen.findByText(/ဖတ်စာအပြည့်ပြီးပါပြီ/);
  fireEvent.change(screen.getByLabelText("The four language skills are: ___________."), {
    target: { value: "listening, speaking, reading and writing" },
  });
  fireEvent.change(screen.getByLabelText("Speaking and writing are ___________ skills."), {
    target: { value: "productive" },
  });
  fireEvent.change(screen.getByLabelText("What are the receptive skills of language?"), {
    target: { value: "Listening and reading" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Section လေ့ကျင့်မှုပြီးပြီ/ }));
  await waitFor(() =>
    expect(screen.getByRole("region", { name: "Vocabulary teaching" })).toBeInTheDocument(),
  );
  await waitFor(() => expect(AudioMock.all.length).toBeGreaterThan(1));
  expect(
    vi
      .mocked(fetch)
      .mock.calls.some(
        ([, init]) =>
          init?.body && JSON.parse(init.body as string).lessonId === "g10-u1-vocabulary",
      ),
  ).toBe(true);
});
it("keeps homework locked after Reading alone and offers replay instead of claiming the course is done", async () => {
  records["g10-u1-reading"] = {
    cursor: 63,
    offset: 0,
    completed: Array.from({ length: 64 }, (_, i) => i),
    revision: 6,
  };
  render(<UnitClassroom grade={10} unit={1} autoStart />);
  await screen.findByText(/ဖတ်စာအပြည့်ပြီးပါပြီ/);
  fireEvent.click(screen.getByRole("button", { name: "သင်ကြားမှု အစကပြန်နားထောင်မယ်" }));
  await waitFor(() => expect(AudioMock.all).toHaveLength(1));
  expect(screen.getByLabelText("Classroom whiteboard")).toHaveTextContent(
    getUnitLesson(10, 1, "reading")!.segments[0].english,
  );
  fireEvent.click(screen.getByRole("button", { name: /Homework/ }));
  expect(screen.getByRole("heading", { name: "Exam Practice Homework" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Homework တင်မယ်" })).not.toBeInTheDocument();
});
it("does not request an unsupported grade's teacher course", () => {
  render(<UnitClassroom grade={11} unit={1} autoStart />);
  expect(screen.getByRole("link", { name: "Self-study ဖွင့်မယ်" })).toHaveAttribute(
    "href",
    "/grade-11/unit-1",
  );
  expect(fetch).not.toHaveBeenCalled();
});
it("clears the previous account's learning activities on sign out", async () => {
  records["g10-u1-reading"] = {
    cursor: 63,
    offset: 0,
    completed: Array.from({ length: 64 }, (_, i) => i),
    revision: 6,
  };
  const { rerender } = render(<UnitClassroom grade={10} unit={1} autoStart />);
  await screen.findByText(/ဖတ်စာအပြည့်ပြီးပါပြီ/);
  fireEvent.change(screen.getByLabelText("What are the receptive skills of language?"), {
    target: { value: "private answer" },
  });
  auth.user = undefined;
  rerender(<UnitClassroom grade={10} unit={1} autoStart />);
  expect(screen.queryByDisplayValue("private answer")).not.toBeInTheDocument();
});
