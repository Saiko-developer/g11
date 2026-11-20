import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AudioManager } from "./AudioManager";
const data = {
  clips: [
    {
      id: "pilot",
      grade: 11,
      unit: 1,
      lesson_id: "g11-u1-grammar-walkthrough",
      section: "grammar",
      source: "walkthrough",
      segment_order: 1,
      script_version: "unchanged-v1",
      script: "Original fixed teaching narration",
      pilot: true,
      legacyReady: true,
      approved_version: null,
      versions: [],
      jobs: [],
    },
  ],
  requiredInRepository: 1,
  stats: { ttsSuccess: 0, ttsFailed: 0, estimatedCostUsd: null },
  control: { blocked_until: null },
  archiveParts: { 10: 0, 11: 0 },
  unitArchiveParts: { "11-1": 0 },
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Audio Manager UI", () => {
  it("shows actual returned counts and exact script without starting generation", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(data));
    render(<AudioManager />);
    fireEvent.click(await screen.findByRole("button", { name: "All (1)" }));
    await screen.findByText("g11-u1-grammar-walkthrough · 1");
    expect(screen.getByText("Original fixed teaching narration")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("max")).toBe("1");
    expect(fetcher.mock.calls.every(([, init]) => !init?.method)).toBe(true);
  });
  it("queues only explicitly confirmed pilot clips", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_url, init) =>
        Response.json(init?.method === "POST" ? { ok: true, action: "enqueue" } : data),
      );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AudioManager />);
    fireEvent.click(await screen.findByRole("button", { name: "All (1)" }));
    await screen.findByText("g11-u1-grammar-walkthrough · 1");
    fireEvent.click(screen.getByRole("button", { name: "Prepare missing audio" }));
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Prepare missing audio" }));
    await waitFor(() =>
      expect(fetcher.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true),
    );
    const call = fetcher.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(call![1]!.body as string)).toEqual({
      action: "enqueue",
      ids: ["pilot"],
      confirmed: true,
    });
    expect(fetcher.mock.calls.some(([url]) => String(url).includes("/api/tts"))).toBe(false);
  });
});
