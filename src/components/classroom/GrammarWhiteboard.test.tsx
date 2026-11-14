import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { getMethodLesson } from "@/lib/classroom/method-lessons";
import { spokenStepAt } from "@/lib/classroom/types";
import { ReadingWhiteboard } from "./ReadingWhiteboard";
const lesson = getMethodLesson(10, 1, "grammar")!;
const board = (cursor: number) => (
  <ReadingWhiteboard
    lesson={lesson}
    cursor={cursor}
    completed={cursor}
    total={16}
    transcript={spokenStepAt(lesson, cursor).narration}
  />
);
it("shows the current apposition structure and role labels rather than a repeated generic note list", () => {
  const { rerender } = render(board(5));
  const structure = screen.getByRole("region", { name: "Sentence structure" });
  expect(structure).toHaveTextContent("My son");
  expect(structure).toHaveTextContent("a musician");
  expect(structure).toHaveTextContent("main verb");
  rerender(board(6));
  expect(screen.queryByRole("region", { name: "Sentence structure" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Rule structure" })).toHaveTextContent("Finland");
  expect(screen.getByRole("region", { name: "Rule structure" })).toHaveTextContent(
    "ထပ်ဖော်ပြသော နာမ်စု",
  );
});
it("compares identifying and extra information at the comma explanation", () => {
  const { container } = render(board(10));
  expect(screen.getByRole("region", { name: "Grammar comparison" })).toHaveTextContent(
    "my friend Aye Aye",
  );
  expect(screen.getByRole("region", { name: "Grammar comparison" })).toHaveTextContent(
    "My son, a musician",
  );
  expect(container.querySelectorAll("mark").length).toBeGreaterThan(0);
  expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
});
it("keeps the full voice transcript collapsed and resets it when the teaching clip changes", () => {
  const { container, rerender } = render(board(5));
  const details = container.querySelector("details")!;
  expect(details.querySelector("p")).not.toBeVisible();
  fireEvent.click(within(details).getByText("ဆရာပြောစာသား ကြည့်မယ်"));
  expect(details.querySelector("p")).toBeVisible();
  rerender(board(6));
  expect(container.querySelector("details")).not.toHaveAttribute("open");
});
it("renders actual formula slots for another grade without changing the lesson text", () => {
  const grammar = getMethodLesson(11, 2, "grammar")!;
  render(
    <ReadingWhiteboard
      lesson={grammar}
      cursor={2}
      completed={2}
      total={grammar.segments.length * 4}
      transcript={spokenStepAt(grammar, 2).narration}
    />,
  );
  expect(screen.getByRole("region", { name: "Rule structure" })).toHaveTextContent("Subject");
  expect(screen.getByRole("region", { name: "Rule structure" })).toHaveTextContent("ကြိယာပုံစံ");
  expect(screen.getAllByText("အငြင်းပြ").length).toBeGreaterThan(0);
});
