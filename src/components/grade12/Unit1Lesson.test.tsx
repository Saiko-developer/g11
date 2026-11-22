import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { unit1Sections } from "@/data/grade12/unit1";
import { Unit1Lesson } from "./Unit1Lesson";

afterEach(cleanup);

it("opens paragraph translations independently and keeps structure help in comprehension C", () => {
  render(<Unit1Lesson section={unit1Sections[0]} />);
  const first = within(screen.getByRole("region", { name: "Paragraph 1" }));
  const second = within(screen.getByRole("region", { name: "Paragraph 2" }));
  fireEvent.click(first.getByRole("button", { name: "မြန်မာဘာသာပြန်" }));
  expect(first.getByText(/အပြုအမူပုံစံဆိုသည်မှာ/)).toBeInTheDocument();
  expect(second.getByRole("button", { name: "မြန်မာဘာသာပြန်" })).toBeInTheDocument();
  expect(first.queryByRole("button", { name: "Sentence Structure" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Translate question" })).toHaveLength(27);
  expect(screen.getAllByRole("button", { name: "Sentence Structure" })).toHaveLength(10);
  fireEvent.click(screen.getAllByRole("button", { name: "Sentence Structure" })[0]);
  expect(screen.getByText(/ကွာခြားချက်ကို မေးထားသည်/)).toBeInTheDocument();
});

it.each([
  [0, ["A.", "B.", "C."]],
  [1, ["A.", "B.", "C."]],
  [2, ["A.", "B."]],
  [3, ["A.", "B.", "C.", "D.", "E."]],
  [4, ["A.", "B."]],
] as const)("renders all exercise groups for section index %s", (index, labels) => {
  render(<Unit1Lesson section={unit1Sections[index]} />);
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent?.slice(0, 2)),
  ).toEqual(labels);
  if (index === 3)
    expect(screen.queryByLabelText("Grade 12 Unit 1 listening audio")).not.toBeInTheDocument();
});

it("keeps both pre-reading activities interactive and all comprehension questions available", () => {
  render(<Unit1Lesson section={unit1Sections[0]} />);
  fireEvent.click(screen.getByText("Pre-reading"));
  const choices = screen.getAllByRole("combobox");
  expect(choices).toHaveLength(24);
  fireEvent.change(choices[0], { target: { value: "Very polite" } });
  expect(choices[0]).toHaveValue("Very polite");
  expect(screen.getAllByRole("button", { name: "Reveal answer" })).toHaveLength(24);
});

it("checks vocabulary matching by choice and leaves four entries per column to complete", () => {
  render(<Unit1Lesson section={unit1Sections[1]} />);
  expect(screen.getByRole("button", { name: "Speak role model" })).toBeInTheDocument();
  expect(screen.getByText("အတုယူစရာ စံနမူနာရှင်")).toBeInTheDocument();
  const match = screen.getByRole("combobox", { name: "Match key" });
  expect(screen.getAllByRole("combobox")).toHaveLength(10);
  fireEvent.change(match, { target: { value: "i) player" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Check Answer" })[0]);
  expect(screen.getByRole("status")).toHaveTextContent("Matches the suggested answer.");
  expect(screen.getAllByRole("textbox", { name: /Compound nouns [2-5]/ })).toHaveLength(4);
  expect(screen.getAllByRole("textbox", { name: /Compound adjectives [2-5]/ })).toHaveLength(4);
});

it("provides all ten modal blanks and six original-sentence inputs", () => {
  render(<Unit1Lesson section={unit1Sections[2]} />);
  fireEvent.click(screen.getAllByRole("button", { name: "Text Explanation" })[0]);
  expect(screen.getByText("Can I take your umbrella?")).toBeInTheDocument();
  expect(screen.getAllByRole("combobox")).toHaveLength(10);
  expect(screen.getAllByRole("textbox", { name: /Sentence [1-6]/ })).toHaveLength(6);
});
