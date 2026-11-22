import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { unit1Sections } from "@/data/grade12/unit1";
import { Unit1Lesson } from "./Unit1Lesson";

afterEach(cleanup);

it("keeps the English passage, Burmese translation and sentence notes separate", () => {
  render(<Unit1Lesson section={unit1Sections[0]} />);
  expect(screen.getByText(/refers to the way of doing something/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "မြန်မာဘာသာပြန်" }));
  expect(screen.queryByText(/refers to the way of doing something/)).not.toBeInTheDocument();
  expect(screen.getByText(/အပြုအမူပုံစံဆိုသည်မှာ/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "ဝါကျဖွဲ့စည်းပုံ" }));
  expect(screen.queryByText(/အပြုအမူပုံစံဆိုသည်မှာ/)).not.toBeInTheDocument();
  expect(screen.getByText(/ပထမစာပိုဒ် —/)).toBeInTheDocument();
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
  expect(screen.getAllByRole("combobox")).toHaveLength(10);
  expect(screen.getAllByRole("textbox", { name: /Sentence [1-6]/ })).toHaveLength(6);
});
