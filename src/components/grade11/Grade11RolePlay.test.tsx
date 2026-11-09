import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Grade11RolePlay } from "./Grade11RolePlay";
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  rpc: vi.fn(),
  speak: vi.fn(),
  stopVoice: vi.fn(),
  startMic: vi.fn(),
  stopMic: vi.fn(),
  finishVoice: () => {},
  callbacks: null as null | { onFinal: (text: string) => void; onSilence: () => void },
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mocks.getSession, refreshSession: mocks.refreshSession },
    rpc: mocks.rpc,
  },
}));
vi.mock("@/components/RequireSignIn", () => ({ signInWithGoogle: vi.fn() }));
vi.mock("@/hooks/use-whisper", () => ({
  useWhisperRecognition: (callbacks: typeof mocks.callbacks) => {
    mocks.callbacks = callbacks;
    return {
      supported: true,
      listening: false,
      start: mocks.startMic,
      stop: mocks.stopMic,
      isCapturing: () => false,
    };
  },
}));
vi.mock("@/hooks/use-voice", async () => {
  const { useState } = await import("react");
  return {
    useSpeechSynthesis: () => {
      const [speaking, setSpeaking] = useState(false);
      mocks.finishVoice = () => setSpeaking(false);
      mocks.speak.mockImplementation(async () => {
        setSpeaking(true);
      });
      return { speaking, speak: mocks.speak, stop: mocks.stopVoice };
    },
  };
});
const session = "1bb5ec00-a69a-4f0e-a5d6-607ca4ab4177";
const reply = (text = "Where would you like to travel?") =>
  Response.json({
    session,
    reply: text,
    replyMy: "ဘယ်ကို ခရီးသွားချင်ပါသလဲ။",
    hints: ["I would like to visit Bagan."],
    scenario: "Planning a trip",
    emotion: "curious",
  });
const start = async () => {
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "စကားပြော စတင်မည်" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "စကားပြော စတင်မည်" }));
};
const typedMode = () => fireEvent.click(screen.getByRole("checkbox"));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: "test-token" } } });
  mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error("expired") });
  mocks.rpc.mockResolvedValue({
    data: {
      ok: true,
      used: 0,
      limit: 2,
      unitsUsed: [],
      unitLimit: 2,
      sessionsUsed: 0,
      durationSeconds: 300,
      serverNow: new Date().toISOString(),
      canStart: true,
      active: null,
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => reply()),
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Grade 11 AI speaking lifecycle", () => {
  it("uses Grade 11 context and the existing session for typed turns and final feedback", async () => {
    render(<Grade11RolePlay unit={5} />);
    typedMode();
    await start();
    await screen.findByLabelText("Your AI conversation reply");
    expect(mocks.speak).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "/api/g11-roleplay",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]!.headers).get("authorization")).toBe(
      "Bearer test-token",
    );
    const first = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(first.unit).toBe(5);
    expect(first.unitTitle).toContain("Travel");
    fireEvent.change(screen.getByLabelText("Your AI conversation reply"), {
      target: { value: "I would like to visit Bagan." },
    });
    fireEvent.click(screen.getByRole("button", { name: "ပို့မည်" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const next = JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string);
    expect(next.session).toBe(session);
    expect(next.turns.at(-1).text).toBe("I would like to visit Bagan.");
    await screen.findByLabelText("Your AI conversation reply");
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ feedbackMy: "အတွေးကို ရှင်းလင်းစွာ ပြောနိုင်ပါတယ်။" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "ရပ်မည်" }));
    await screen.findByText("အတွေးကို ရှင်းလင်းစွာ ပြောနိုင်ပါတယ်။");
    expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as string).finish).toBe(true);
  });
  it("shows AI captions, then automatically opens the mic and sends recognized speech", async () => {
    render(<Grade11RolePlay unit={7} />);
    await start();
    await screen.findAllByText("Where would you like to travel?");
    expect(mocks.speak).toHaveBeenCalled();
    act(() => mocks.finishVoice());
    await waitFor(() => expect(mocks.startMic).toHaveBeenCalled());
    act(() => {
      mocks.callbacks!.onFinal("I enjoy swimming.");
    });
    expect(screen.getByLabelText("Your AI conversation reply")).toHaveValue("I enjoy swimming.");
    act(() => mocks.callbacks!.onSilence());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string).turns.at(-1).text).toBe(
      "I enjoy swimming.",
    );
  });
  it("handles exhausted credits and lets the student retry", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 402 }));
    render(<Grade11RolePlay unit={1} />);
    typedMode();
    await start();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "စကားပြော စတင်မည်" })).toBeEnabled();
  });
  it("aborts in-flight requests and releases voice/mic on unmount", async () => {
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = render(<Grade11RolePlay unit={12} />);
    typedMode();
    await start();
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!;
    view.unmount();
    expect(signal.aborted).toBe(true);
    expect(mocks.stopMic).toHaveBeenCalled();
    expect(mocks.stopVoice).toHaveBeenCalled();
    await act(async () => {
      resolve(reply("Stale reply"));
    });
    expect(mocks.speak).not.toHaveBeenCalled();
  });
  it("does not open a paid session when microphone permission is denied", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new Error("denied"));
    render(<Grade11RolePlay unit={2} />);
    await start();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "စကားပြော စတင်မည်" })).toBeVisible(),
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

it("does not ask a signed-in student to login again for a speaking service error", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json(
      { error: "speaking_service_unavailable", message: "စကားပြောဝန်ဆောင်မှုကို ချိတ်ဆက်မရပါ။" },
      { status: 503 },
    ),
  );
  render(<Grade11RolePlay unit={5} />);
  typedMode();
  await start();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "စကားပြောဝန်ဆောင်မှုကို ချိတ်ဆက်မရပါ။",
  );
  expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  expect(mocks.refreshSession).not.toHaveBeenCalled();
});
it("offers login only after a real auth rejection and unsuccessful token refresh", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ error: "signin" }, { status: 401 }));
  render(<Grade11RolePlay unit={5} />);
  typedMode();
  await start();
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Login" })).toBeVisible();
  expect(mocks.refreshSession).toHaveBeenCalledOnce();
});
it("continues to the student's turn when speech playback fails before reporting speaking=true", async () => {
  mocks.speak.mockImplementationOnce(async () => {
    throw new Error("audio unavailable");
  });
  render(<Grade11RolePlay unit={5} />);
  await start();
  await screen.findByLabelText("Your AI conversation reply");
  expect(mocks.startMic).toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});
it("does not offer a third new unit after two units have been started", async () => {
  mocks.rpc.mockResolvedValue({
    data: {
      ok: true,
      used: 0,
      limit: 2,
      unitsUsed: [1, 2],
      unitLimit: 2,
      sessionsUsed: 2,
      durationSeconds: 300,
      canStart: false,
      active: null,
      serverNow: new Date().toISOString(),
    },
  });
  render(<Grade11RolePlay unit={3} />);
  await screen.findByText(/ဒီနေ့ Unit အသစ် ထပ်ရွေးမရပါ/);
  expect(screen.getByRole("button", { name: "စကားပြော စတင်မည်" })).toBeDisabled();
  expect(fetch).not.toHaveBeenCalled();
});
it("allows resuming an active second session even when no new sessions remain", async () => {
  const serverNow = new Date().toISOString(),
    expiresAt = new Date(Date.now() + 60000).toISOString();
  mocks.rpc.mockResolvedValue({
    data: {
      ok: true,
      used: 2,
      limit: 2,
      unitsUsed: [5],
      unitLimit: 2,
      sessionsUsed: 2,
      durationSeconds: 300,
      canStart: false,
      active: { session, unit: 5, exercise: null, expiresAt, revision: 3 },
      serverNow,
    },
  });
  vi.mocked(fetch).mockResolvedValue(
    Response.json({
      session,
      resumed: true,
      revision: 3,
      reply: "Welcome back",
      replyMy: "ပြန်ကြိုဆိုပါတယ်။",
      expiresAt,
      serverNow,
      history: [
        { role: "student", text: "My earlier answer" },
        { role: "ai", text: "Welcome back" },
      ],
    }),
  );
  render(<Grade11RolePlay unit={5} />);
  typedMode();
  const resume = await screen.findByRole("button", { name: "မူလ စကားပြောမှုကို ပြန်ဆက်မည်" });
  fireEvent.click(resume);
  await screen.findByText("My earlier answer");
  expect(screen.getByRole("timer")).toHaveTextContent("1:00");
});
it("stops playback/recording at the server deadline and ends an opening-only session", async () => {
  vi.useFakeTimers();
  try {
    const serverNow = new Date().toISOString(),
      expiresAt = new Date(Date.now() + 5000).toISOString();
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        session,
        revision: 1,
        reply: "Hello",
        replyMy: "မင်္ဂလာပါ",
        expiresAt,
        serverNow,
      }),
    );
    render(<Grade11RolePlay unit={5} />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "စကားပြော စတင်မည်" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("timer")).toHaveTextContent("0:05");
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(mocks.stopMic).toHaveBeenCalled();
    expect(mocks.stopVoice).toHaveBeenCalled();
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([, init]) => JSON.parse(String(init?.body)).action === "end"),
    ).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});
