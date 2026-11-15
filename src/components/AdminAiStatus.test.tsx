import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ text: vi.fn(), speech: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/ai-status.functions", () => ({
  checkAiStatus: m.text,
  checkSpeechFallbackStatus: m.speech,
}));
import { AdminAiStatus } from "./AdminAiStatus";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("only tests speech when an administrator explicitly clicks the voice test", async () => {
  m.speech.mockResolvedValue({ ok: true, message: "ok", ms: 100 });
  render(<AdminAiStatus />);
  expect(m.speech).not.toHaveBeenCalled();
  expect(m.text).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Gemini အသံ fallback စမ်းမည်" }));
  await waitFor(() => expect(m.speech).toHaveBeenCalledTimes(1));
  expect(m.text).not.toHaveBeenCalled();
  await screen.findByText(/အလုပ်လုပ်နေပါသည်/);
});

it("shows the actionable Google speech failure without truncating it", async () => {
  const message =
    "HTTP 429 RESOURCE_EXHAUSTED · gemini-2.5-flash-preview-tts — Google TTS quota သုညဖြစ်နေပါသည်။";
  m.speech.mockResolvedValue({ ok: false, message, ms: 100 });
  render(<AdminAiStatus />);
  fireEvent.click(screen.getByRole("button", { name: "Gemini အသံ fallback စမ်းမည်" }));
  const failure = await screen.findByText(`❌ ${message}`);
  expect(failure.className).not.toContain("truncate");
});
