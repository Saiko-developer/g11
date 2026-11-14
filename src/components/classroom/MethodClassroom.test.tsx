import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { MethodClassroom, ClassroomLessonChooser } from "./MethodClassroom";
import { getMethodLesson } from "@/lib/classroom/method-lessons";
const m = vi.hoisted(() => ({
  props: null as null | {
    onDone: (steps: number[]) => void;
    start: number;
    end: number;
    review: boolean;
    lesson: { id: string };
  },
}));
vi.mock("./UnitClassroom", () => ({
  UnitTeachingBlock: (props: NonNullable<typeof m.props>) => {
    m.props = props;
    return <button onClick={() => props.onDone([])}>Finish teaching block</button>;
  },
}));
vi.mock("@/components/RequireSignIn", () => ({ RequireSignIn: () => null }));
beforeEach(() => {
  m.props = null;
});
it("lets learners select both grades and all 12 units inside the classroom only", () => {
  render(<ClassroomLessonChooser grade={11} unit={12} />);
  expect(screen.getByRole("combobox", { name: "Classroom grade" })).toHaveValue("11");
  expect(
    screen.getByRole("combobox", { name: "Classroom unit" }).querySelectorAll("option"),
  ).toHaveLength(12);
  expect(screen.getByRole("button", { name: "Grammar သင်မယ်" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Writing သင်မယ်" })).toBeEnabled();
});
it("teaches the selected canonical lesson and distinguishes section completion from unit completion", () => {
  const lesson = getMethodLesson(11, 12, "writing")!;
  render(<MethodClassroom lesson={lesson} userId="alice" autoStart />);
  expect(m.props?.lesson.id).toBe("g11-u12-writing");
  fireEvent.click(screen.getByRole("button", { name: "Finish teaching block" }));
  expect(
    screen.getByRole("heading", { name: "ဒီ section ရဲ့ သင်ကြားမှု ပြီးပါပြီ" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Unit တစ်ခုလုံးပြီးကြောင်း မဆိုလိုပါ/)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "မူရင်း Self-study / Exercises ဖွင့်မယ်" }),
  ).toHaveAttribute("href", "/grade-11/12/writing");
  fireEvent.click(screen.getByRole("button", { name: "အစက ပြန်နားထောင်မယ်" }));
  expect(m.props?.review).toBe(true);
});
it("keeps a long grammar lesson in bounded audio blocks and exposes the full rule script", () => {
  const lesson = getMethodLesson(11, 2, "grammar")!;
  render(<MethodClassroom lesson={lesson} userId="alice" autoStart />);
  expect(m.props?.end).toBeLessThanOrEqual(16);
  expect(screen.getByText("ဆရာပြောစာသားအပြည့် ကြည့်မယ်")).toBeInTheDocument();
  if (lesson.segments.length * 4 > 16) {
    fireEvent.click(screen.getByRole("button", { name: "Finish teaching block" }));
    expect(m.props?.start).toBe(16);
    expect(
      screen.queryByRole("heading", { name: "ဒီ section ရဲ့ သင်ကြားမှု ပြီးပါပြီ" }),
    ).not.toBeInTheDocument();
  }
});
