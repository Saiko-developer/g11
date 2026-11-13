import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { ReadingWhiteboard } from "./ReadingWhiteboard";
import { getReadingLesson } from "@/lib/classroom/lessons";
import { spokenStepAt } from "@/lib/classroom/types";
import notes from "@/data/classroom/grade10-unit1-board-notes.json";
const lesson = getReadingLesson(10)!;
const board = (cursor: number) => (
  <ReadingWhiteboard
    lesson={lesson}
    cursor={cursor}
    completed={cursor}
    total={16}
    transcript={spokenStepAt(lesson, cursor).narration}
  />
);
it("keeps spoken explanations out of the board until the learner opens the transcript", () => {
  const { container } = render(board(2));
  expect(screen.getByRole("region", { name: "Teaching notes" })).toHaveTextContent(
    "several + plural noun",
  );
  const transcript = container.querySelector("details")!;
  expect(transcript.querySelector("p")).not.toBeVisible();
  fireEvent.click(within(transcript).getByText("ဆရာပြောစာသား ကြည့်မယ်"));
  expect(transcript.querySelector("p")).toBeVisible();
  expect(transcript.querySelector("p")).toHaveTextContent(
    lesson.segments[0].explanation.replace(/\s+/g, " "),
  );
});
it("changes notes and phrase highlights by teaching stage without altering the English sentence", () => {
  const { container, rerender } = render(board(0));
  expect(container.querySelectorAll("mark")).toHaveLength(0);
  expect(screen.queryByRole("region", { name: "Teaching notes" })).not.toBeInTheDocument();
  rerender(board(1));
  expect(screen.getByLabelText("Burmese translation")).toBeVisible();
  rerender(board(2));
  expect([...container.querySelectorAll("mark")].map((m) => m.textContent)).toEqual([
    "several different answers",
    "all of them",
  ]);
  expect(container.querySelector('p[lang="en"]')).toHaveTextContent(lesson.segments[0].english);
  rerender(board(3));
  expect([...container.querySelectorAll("mark")].map((m) => m.textContent)).toEqual([
    "may be acceptable",
  ]);
  expect(screen.getByRole("region", { name: "Teaching notes" })).toHaveTextContent(
    "Your answer may be acceptable.",
  );
  expect(screen.getByRole("region", { name: "Teaching notes" })).toHaveTextContent("မသုံးရ");
  expect(container.querySelector("details")).not.toHaveAttribute("open");
});
it("covers every source sentence and highlights only phrases actually in that sentence", () => {
  expect(notes.map((n) => n.id)).toEqual(lesson.segments.map((s) => s.id));
  notes.forEach((note, i) => {
    for (const cue of [note.meaning, note.grammar]) {
      expect(cue.notes.length).toBeGreaterThan(0);
      cue.focus.forEach((phrase) => {
        expect(phrase.length).toBeGreaterThan(0);
        expect(lesson.segments[i].english).toContain(phrase);
      });
    }
  });
});
