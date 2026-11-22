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
