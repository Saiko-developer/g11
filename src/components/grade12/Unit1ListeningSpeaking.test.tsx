import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Unit1ListeningSpeaking } from "./Unit1ListeningSpeaking";

afterEach(cleanup);

it("shows the listening audio status and updates progress for textbook selections", () => {
  render(<Unit1ListeningSpeaking skill="listening" />);
  expect(screen.getByRole("region", { name: "Grade 12 Unit 1 listening audio" })).toBeVisible();
  expect(screen.getAllByRole("checkbox")).toHaveLength(6);
  expect(screen.getAllByRole("radio")).toHaveLength(15);
  expect(screen.getByText("Progress: 0 / 5 answered")).toBeVisible();
  fireEvent.click(screen.getByRole("radio", { name: "(a) anyone" }));
  expect(screen.getByText("Progress: 1 / 5 answered")).toBeVisible();
  fireEvent.click(screen.getByRole("radio", { name: "(b) people who are older than you" }));
  expect(screen.getByText("Progress: 1 / 5 answered")).toBeVisible();
});

it("switches between the textbook, Grade 12 shadowing and exercise-specific role-play", () => {
  render(<Unit1ListeningSpeaking skill="speaking" />);
  const note = screen.getAllByRole("textbox", { name: "Practice notes" })[0];
  fireEvent.change(note, { target: { value: "Greet your neighbours." } });
  expect(screen.getByText("Progress: 1 / 3 answered")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /လိုက်ဆို/ }));
  expect(screen.getByRole("region", { name: "Grade 12 shadowing practice" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /သင်ခန်းစာ/ }));
  expect(screen.getByDisplayValue("Greet your neighbours.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Practise D with AI" }));
  expect(screen.getByRole("button", { name: "D · Giving advice to a newcomer" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
