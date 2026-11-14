import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { getMethodLesson } from "@/lib/classroom/method-lessons";
import { spokenStepAt } from "@/lib/classroom/types";
import { ReadingWhiteboard } from "./ReadingWhiteboard";
const lesson = getMethodLesson(10, 1, "writing")!;
const board = (cursor: number) => (
  <ReadingWhiteboard
    lesson={lesson}
    cursor={cursor}
    completed={cursor}
    total={16}
    transcript={spokenStepAt(lesson, cursor).narration}
  />
);

it("shows the task, grouped points, outline and short grammar reasons as teaching advances", () => {
  const { container, rerender } = render(board(2));
  expect(screen.getByRole("heading", { name: "Japan" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Writing support notes" })).toHaveTextContent(
    "island nation",
  );
  expect(container.querySelectorAll("mark").length).toBeGreaterThan(0);
  expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  rerender(board(4));
  expect(screen.getByRole("region", { name: "Writing support notes" })).toHaveTextContent(
    "နိုင်ငံအမျိုးအစားဖြင့် မိတ်ဆက်",
  );
  rerender(board(8));
  expect(screen.getByRole("region", { name: "Writing support notes" })).toHaveTextContent(
    "be; လုပ်ဆောင်မှု → action verb",
  );
  expect(screen.getByLabelText("Terms in current audio")).toHaveTextContent("be verb");
});
it("keeps the current spoken transcript collapsed and resets it on the next clip", () => {
  const { container, rerender } = render(board(8));
  const transcript = container.querySelector("details")!;
  expect(transcript.querySelector("p")).not.toBeVisible();
  fireEvent.click(within(transcript).getByText("ဆရာပြောစာသား ကြည့်မယ်"));
  expect(transcript.querySelector("p")).toBeVisible();
  rerender(board(9));
  expect(container.querySelector("details")).not.toHaveAttribute("open");
});
it("supports another grade's summary task without displaying a completed answer", () => {
  const summary = getMethodLesson(11, 8, "writing")!;
  render(
    <ReadingWhiteboard
      lesson={summary}
      cursor={14}
      completed={14}
      total={16}
      transcript={spokenStepAt(summary, 14).narration}
    />,
  );
  expect(screen.getByRole("heading", { name: "A Summary of The Last Leaf" })).toBeVisible();
  expect(screen.getByText("about 100 words summary")).toBeVisible();
  expect(screen.getByRole("region", { name: "Writing support notes" })).toHaveTextContent(
    "Revision",
  );
});
