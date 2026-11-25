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

it("keeps shuffled scripts in numeric order across Review and All pages", async () => {
  const order = [12, 2, 10, 6, 8, 3, 1, 11, 5, 9, 7, 4];
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      ...data,
      clips: order.map((number) => ({
        ...data.clips[0],
        id: `clip-${number}`,
        segment_order: number,
        versions: [{ id: `version-${number}`, status: "pending" }],
      })),
    }),
  );
  render(<AudioManager />);
  const displayed = () =>
    screen
      .queryAllByText(/^g11-u1-grammar-walkthrough · \d+$/)
      .map((row) => Number(row.textContent?.split(" · ")[1]));
  await screen.findByText("g11-u1-grammar-walkthrough · 1");
  expect(displayed()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(displayed()).toEqual([11, 12]);
  fireEvent.click(screen.getByRole("button", { name: "All (12)" }));
  expect(displayed()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

it("queues local work with the provider selector and leaves the Gemini processor separate", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (_url, init) =>
      Response.json(init?.method === "POST" ? { ok: true } : { ...data, localEnabled: true }),
    );
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<AudioManager />);
  fireEvent.change(await screen.findByLabelText("Voice provider"), {
    target: { value: "voxcpm2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Prepare missing audio" }));
  await waitFor(() => {
    const post = fetcher.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(post?.[1]?.body as string)).toMatchObject({
      action: "enqueue",
      engine: "voxcpm2",
      ids: ["pilot"],
    });
  });
});

it.each([10, 12])("edits, regenerates and deletes a Grade %i audio version", async (grade) => {
  const version = {
    id: "version-one",
    status: "approved",
    storage_path: "audio.mp3",
    script_text: "Updated teaching script",
  };
  const clip = {
    ...data.clips[0],
    grade,
    lesson_id: `g${grade}-u1-grammar`,
    source: grade === 10 ? "classroom" : "grade12-grammar",
    editable: true,
    versions: [version],
    approved_version: version.id,
  };
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (_url, init) =>
      Response.json(init?.method === "POST" ? { ok: true } : { ...data, clips: [clip] }),
    );
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<AudioManager />);
  fireEvent.change(screen.getByLabelText("Grade"), { target: { value: String(grade) } });
  fireEvent.click(await screen.findByRole("button", { name: "All (1)" }));
  fireEvent.click(screen.getByText("Script and details"));
  fireEvent.click(screen.getByRole("button", { name: "Edit script" }));
  const editor = screen.getByLabelText("Teaching narration draft");
  expect(editor).toHaveValue(version.script_text);
  fireEvent.change(editor, { target: { value: "Revised script" } });
  const posts = () =>
    fetcher.mock.calls
      .filter(([, init]) => init?.method === "POST")
      .map(([, init]) => JSON.parse(String(init?.body)));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() =>
    expect(posts()[0]).toMatchObject({
      action: "save-script",
      ids: [clip.id],
      script: "Revised script",
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Regenerate audio" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Regenerate audio" }));
  await waitFor(() => expect(posts()[1]).toMatchObject({ action: "regenerate", ids: [clip.id] }));
  const remove = screen.getByRole("button", { name: "Delete generated audio" });
  await waitFor(() => expect(remove).toBeEnabled());
  confirm.mockReturnValue(false);
  fireEvent.click(remove);
  expect(posts()).toHaveLength(2);
  confirm.mockReturnValue(true);
  fireEvent.click(remove);
  await waitFor(() =>
    expect(posts()[2]).toMatchObject({ action: "delete-audio", ids: [version.id] }),
  );
});
