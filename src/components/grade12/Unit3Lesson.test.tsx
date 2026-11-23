import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { grade12Skills } from "@/data/grade12/syllabus";
import { unit3ExercisesMy } from "@/data/grade12/unit3-exercises-my";
import { unit3Exercises } from "@/data/grade12/unit3";
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

it.each(grade12Skills)(
  "provides a separate Burmese translation for every Unit 3 %s exercise item",
  (skill) => {
    const groups = unit3Exercises[skill];
    const translated = unit3ExercisesMy[skill];
    expect(translated.map((group) => group.items.length)).toEqual(
      groups.map((group) => group.items.length),
    );
    render(<TextbookUnitLesson unit={3} skill={skill} />);
    if (skill === "reading") {
      expect(screen.getAllByRole("button", { name: /Myanmar translation for/ })).toHaveLength(2);
      expect(screen.queryByRole("button", { name: "Translate question" })).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole("button", { name: "Myanmar translation for Comprehension" }),
      );
      expect(screen.getByText(unit3ExercisesMy.reading[1].instruction)).toBeVisible();
      return;
    }
    const buttons = screen.getAllByRole("button", { name: "Translate instructions" });
    expect(buttons).toHaveLength(groups.length);
    expect(screen.getAllByRole("button", { name: "Translate question" })).toHaveLength(
      groups.reduce((count, group) => count + group.items.length, 0),
    );
    fireEvent.click(buttons[0]);
    expect(screen.getByText(translated[0].instruction)).toHaveAttribute("lang", "my");
  },
);

it("keeps all three grammar explanation controls and opens Grade 12 speaking shadowing", () => {
  const view = render(<TextbookUnitLesson unit={3} skill="grammar" />);
  expect(screen.getAllByRole("button", { name: "Text Explanation" })).toHaveLength(3);
  expect(screen.getAllByRole("button", { name: "Oral Explanation" })).toHaveLength(3);
  view.unmount();
  render(<TextbookUnitLesson unit={3} skill="speaking" />);
  fireEvent.click(screen.getByRole("button", { name: /လိုက်ဆို/ }));
  expect(screen.getByRole("region", { name: "Grade 12 shadowing practice" })).toBeVisible();
  expect(screen.getByText("Your food preferences")).toBeVisible();
});

it("starts the AI mode with the selected textbook card and no default paid session", () => {
  render(<TextbookUnitLesson unit={3} skill="speaking" />);
  fireEvent.click(screen.getByRole("button", { name: /Practise with AI/ }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  const picker = screen.getByRole("combobox", { name: "Choose a speaking topic" });
  expect(screen.getAllByRole("option")).toHaveLength(7);
  fireEvent.change(picker, { target: { value: "A balanced diet" } });
  expect(screen.getByRole("status")).toHaveTextContent("3 · 3D-G12-B4");
  fireEvent.change(picker, { target: { value: "Six vital nutrients" } });
  expect(screen.getByRole("status")).toHaveTextContent("3 · 3D-G12-B2");
});
