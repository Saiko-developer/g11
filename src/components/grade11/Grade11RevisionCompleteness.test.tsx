import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Grade11PoemView, Grade11ReviewView } from "./Grade11Revision";
vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({ session: { access_token: "test" }, ready: true }),
}));
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(Response.json({ correct: true, feedback: "အဓိပ္ပာယ်တူ၍ အဖြေမှန်ပါတယ်။" })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const question = (id: string) =>
  document.querySelector(`[data-revision-question="${id}"]`) as HTMLElement;
it.each([1, 2, 3, 4])(
  "renders Review %s as complete interactive text without automatic API calls",
  (number) => {
    const view = render(<Grade11ReviewView number={number} />);
    expect(document.querySelectorAll("[data-revision-question]")).toHaveLength(20);
    expect(screen.getAllByRole("button", { name: "Check Answer" })).toHaveLength(20);
    expect(screen.getAllByRole("button", { name: "Reveal Answer" })).toHaveLength(20);
    expect(view.container.querySelectorAll("img")).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  },
);
it.each([
  [1, 14],
  [2, 10],
  [3, 15],
  [4, 14],
])("renders Poem %s with every task, no scan UI and no automatic generation", (number, count) => {
  const view = render(<Grade11PoemView number={number} />);
  expect(document.querySelectorAll("[data-revision-question]")).toHaveLength(count);
  expect(screen.getByText("Glossary")).toBeVisible();
  expect(view.container.querySelectorAll("img")).toHaveLength(0);
  expect(fetch).not.toHaveBeenCalled();
});
it("checks a word-bank answer locally and restores the draft on returning", () => {
  const first = render(<Grade11ReviewView number={2} />);
  const row = question("review2-A-1");
  fireEvent.change(within(row).getByRole("textbox"), { target: { value: "fast food" } });
  fireEvent.click(within(row).getByRole("button", { name: "Check Answer" }));
  expect(within(row).getByText(/✅/)).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
  first.unmount();
  render(<Grade11ReviewView number={2} />);
  expect(within(question("review2-A-1")).getByRole("textbox")).toHaveValue("fast food");
});
it("accepts poem paraphrases through the existing semantic checker instead of reporting an exact-match failure", async () => {
  render(<Grade11PoemView number={1} />);
  const row = question("poem1-A-1");
  fireEvent.change(within(row).getByRole("textbox"), {
    target: {
      value:
        "Steel, stone, wooden, covered, railroad and cement bridges are the kinds the poet likes.",
    },
  });
  fireEvent.click(within(row).getByRole("button", { name: "Check Answer" }));
  await within(row).findByText("အဓိပ္ပာယ်တူ၍ အဖြေမှန်ပါတယ်။");
  expect(fetch).toHaveBeenCalledTimes(1);
  const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
  expect(body.context).toContain("I like a bridge");
  expect(body.studentAnswer).toContain("kinds the poet likes");
});
it("avoids an AI request when a suggested poem answer already matches a known valid answer", () => {
  render(<Grade11PoemView number={4} />);
  const row = question("poem4-A-2");
  fireEvent.change(within(row).getByRole("textbox"), {
    target: { value: "He lives in the village." },
  });
  fireEvent.click(within(row).getByRole("button", { name: "Check Answer" }));
  expect(within(row).getByRole("status")).toHaveTextContent("အဖြေမှန်");
  expect(fetch).not.toHaveBeenCalled();
});
it("counts creative verse lines without supplying an invented model poem", () => {
  render(<Grade11PoemView number={2} />);
  const row = question("poem2-C-1");
  fireEvent.change(within(row).getByRole("textbox"), {
    target: { value: "Clouds drift by\nAbove the tree\nAcross the sky\nThey sail with me" },
  });
  expect(within(row).getByText(/4 \/ 4 lines/)).toBeVisible();
  expect(within(row).queryByRole("button", { name: "Reveal Answer" })).toBeNull();
});
it("retains the emphasis target and makes damaged source notes explicit", () => {
  const view = render(<Grade11ReviewView number={4} />);
  expect(question("review4-B-5").querySelector("strong")).toHaveTextContent(
    "from my mistakes and failures",
  );
  view.rerender(<Grade11PoemView number={3} />);
  expect(screen.getAllByText(/ဖြတ်တောက်/).length).toBeGreaterThan(0);
});
