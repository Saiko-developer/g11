import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { grade12Skills } from "@/data/grade12/syllabus";
import { unit4Exercises, unit4ExercisesMy } from "@/data/grade12/unit4";
import { TextbookUnitLesson } from "./TextbookUnitLesson";

vi.mock("@/components/grade11/Grade11RequireSignIn", () => ({
  Grade11RequireSignIn: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/grade11/Grade11RolePlay", () => ({
  Grade11RolePlay: ({ unit, exercise }: { unit: number; exercise: string }) => (
    <p role="status">
      {unit} · {exercise}
    </p>
  ),
}));

afterEach(cleanup);

const counts = {
  reading: [3, 5, 10, 10, 6, 6, 8],
  vocabulary: [10, 10, 20],
  grammar: [5, 10],
  listening: [4, 10],
  speaking: [1, 4, 1],
  writing: [6],
};

it.each(grade12Skills)(
  "renders the textbook groups and separate Burmese exercise controls for Unit 4 %s",
  (skill) => {
    const groups = unit4Exercises[skill];
    expect(groups.map(({ items }) => items.length)).toEqual(counts[skill]);
    expect(unit4ExercisesMy[skill].map(({ items }) => items.length)).toEqual(counts[skill]);
    render(<TextbookUnitLesson unit={4} skill={skill} />);
    if (skill === "reading") {
      expect(screen.getAllByRole("button", { name: /Myanmar translation for/ })).toHaveLength(2);
      expect(screen.queryByRole("button", { name: "Translate question" })).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole("button", { name: "Myanmar translation for Comprehension" }),
      );
      expect(screen.getByText(unit4ExercisesMy.reading[1].instruction)).toBeVisible();
      return;
    }
    const instructions = screen.getAllByRole("button", { name: "Translate instructions" });
    expect(instructions).toHaveLength(groups.length);
    fireEvent.click(instructions[0]);
    expect(screen.getByText(unit4ExercisesMy[skill][0].instruction)).toHaveAttribute("lang", "my");
    expect(screen.getAllByRole("button", { name: "Translate question" })).toHaveLength(
      counts[skill].reduce((a, b) => a + b, 0),
    );
  },
);

it("keeps the source emotion table and all ten strategies in the reading pane", () => {
  render(<TextbookUnitLesson unit={4} skill="reading" />);
  expect(screen.getByRole("table", { name: "Types of emotions" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Stay honest" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Stay hopeful" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: "Sentence Structure" })).toHaveLength(8);
});

it("connects the shared AI session to Exercise E", () => {
  render(<TextbookUnitLesson unit={4} skill="speaking" />);
  fireEvent.click(screen.getByRole("button", { name: /Practise with AI/ }));
  expect(screen.getByRole("status")).toHaveTextContent("4 · 4D-G12-E");
});
