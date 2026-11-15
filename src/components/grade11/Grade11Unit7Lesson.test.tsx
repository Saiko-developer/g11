import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Grade11Unit7Lesson } from "./Grade11Unit7Lesson";
import { UNIT7_TEXT } from "@/lib/grade11Unit7";
import { UPPER_UNITS } from "@/lib/grade11Upper";
vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({ session: { access_token: "test" }, ready: true }),
}));
vi.mock("./Grade11RequireSignIn", () => ({
  Grade11RequireSignIn: ({ children }: { children: React.ReactNode }) => children,
}));
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(Response.json({ correct: true, feedback: "အဖြေကို လက်ခံနိုင်ပါတယ်။" })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const group = (id: string) =>
  within(document.querySelector(`[data-exercise="${id}"]`) as HTMLElement);
it("renders the full passage, every original response and the eye example without textbook scans", () => {
  render(<Grade11Unit7Lesson kind="reading" />);
  const passage = screen.getByRole("article", { name: "Unit 7 reading passage" });
  for (const p of UNIT7_TEXT.reading) expect(within(passage).getByText(p.x)).toBeVisible();
  expect(group("7-functions").getByText("1. eye → to see")).toBeVisible();
  expect(screen.getAllByRole("textbox")).toHaveLength(18);
  expect(group("7-comprehension").getAllByRole("button", { name: "Check Answer" })).toHaveLength(
    10,
  );
  expect(group("7-comprehension").getAllByRole("button", { name: "Reveal Answer" })).toHaveLength(
    10,
  );
  expect(document.querySelector('img[src*="/grade11/upper/"]')).toBeNull();
});
it("checks one pre-reading answer with its real passage context and existing AI route", async () => {
  render(<Grade11Unit7Lesson kind="reading" />);
  const pre = group("7-pre");
  fireEvent.change(pre.getAllByRole("textbox")[0], {
    target: { value: "Health helps us live well and work." },
  });
  fireEvent.click(pre.getAllByRole("button", { name: "Check Answer with AI" })[0]);
  await pre.findByText("အဖြေကို လက်ခံနိုင်ပါတယ်။");
  const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe("/api/g11-check");
  const body = JSON.parse(options!.body as string);
  expect(body.context).toContain("The human body is made up of systems and organs.");
  expect(body.question).toContain("health or wealth");
  expect(body.studentAnswer).toBe("Health helps us live well and work.");
});
it("reveals source-derived comprehension suggestions independently and keeps personal answers open", () => {
  render(<Grade11Unit7Lesson kind="reading" />);
  const b = group("7-comprehension");
  fireEvent.click(b.getAllByRole("button", { name: "Reveal Answer" })[0]);
  expect(b.getByText(/The systems of the human body are made up/)).toBeVisible();
  expect(b.getAllByRole("button", { name: "Hide Answer" })).toHaveLength(1);
  fireEvent.click(b.getAllByRole("button", { name: "Reveal Answer" }).at(-1)!);
  expect(b.getByText(/ပုံသေအဖြေတစ်ခု မရှိပါ/)).toBeVisible();
});
it("renders 14 complete bilingual context questions with 28 choices and local checking", () => {
  render(<Grade11Unit7Lesson kind="vocabulary" />);
  expect(screen.getAllByRole("radio")).toHaveLength(28);
  expect(screen.getAllByRole("button", { name: "Check Answer" })).toHaveLength(14);
  for (const row of UNIT7_TEXT.vocabulary) {
    expect(screen.getByText(row.my)).toBeVisible();
    for (const option of row.options) expect(screen.getByText(option.my)).toBeVisible();
  }
  fireEvent.click(screen.getAllByRole("radio")[0]);
  fireEvent.click(screen.getAllByRole("button", { name: "Check Answer" })[0]);
  expect(screen.getByRole("status")).toHaveTextContent("✅");
  expect(fetch).not.toHaveBeenCalled();
});
it("retains all 22 grammar questions, original worked examples, text/oral controls and the corrected 1,000", () => {
  render(<Grade11Unit7Lesson kind="grammar" />);
  expect(document.querySelectorAll("[data-grammar-question]")).toHaveLength(22);
  expect(screen.getAllByRole("button", { name: "Text Explanation" })).toHaveLength(2);
  expect(screen.getAllByRole("button", { name: "Oral Explanation" })).toHaveLength(2);
  expect(
    screen.getByText("People once believed that the sun revolved around the earth."),
  ).toBeVisible();
  expect(
    screen.getByText(/They expected that about 1,000 people/, { selector: "p" }),
  ).toBeVisible();
});
it("checks listening from recording-derived keys and shows translations with no scan", () => {
  render(<Grade11Unit7Lesson kind="listening" />);
  const g = group("7-listen");
  expect(g.getAllByRole("textbox")).toHaveLength(10);
  fireEvent.change(g.getAllByRole("textbox")[0], { target: { value: "seen" } });
  fireEvent.click(g.getAllByRole("button", { name: "Check Answer" })[0]);
  expect(g.getByText("✅ မှန်ပါတယ်! တော်လိုက်တာ။")).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});
it.each(["speaking", "writing"] as const)(
  "retains all source %s notes, tasks and translation without a model answer",
  (kind) => {
    render(<Grade11Unit7Lesson kind={kind} />);
    for (const block of UNIT7_TEXT[kind]) expect(screen.getByText(block.x)).toBeVisible();
    expect(screen.getAllByRole("textbox")).toHaveLength(kind === "speaking" ? 5 : 1);
    expect(screen.getAllByRole("button", { name: "Check Answer" })).toHaveLength(
      kind === "speaking" ? 5 : 1,
    );
    expect(document.querySelector('img[src*="/grade11/upper/"]')).toBeNull();
  },
);
it("preserves the existing per-task draft keys across remounts", () => {
  const view = render(<Grade11Unit7Lesson kind="reading" />);
  const prompt = UPPER_UNITS[7].skills.reading.groups[0].items[0].prompt;
  fireEvent.change(screen.getByLabelText(`Your answer: ${prompt}`), {
    target: { value: "Health is important." },
  });
  view.unmount();
  render(<Grade11Unit7Lesson kind="reading" />);
  expect(screen.getByLabelText(`Your answer: ${prompt}`)).toHaveValue("Health is important.");
  expect(screen.getByText("Progress: 1 / 18 answered")).toBeVisible();
});
