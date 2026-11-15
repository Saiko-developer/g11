import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { Grade11Unit2Lesson } from "./Grade11Unit2Lesson";
import { Grade11Unit3Lesson } from "./Grade11Unit3Lesson";
import { Grade11Unit4Lesson } from "./Grade11Unit4Lesson";
import { Grade11Unit5Lesson, Grade11Unit6Lesson } from "./Grade11TravelLesson";
import { TRAVEL_LESSONS } from "@/lib/grade11Travel";
vi.mock("@/components/AuthGate", () => ({ useAuth: () => ({ session: null, ready: true }) }));
vi.mock("@/components/lesson/GrammarExerciseGenerator", () => ({
  GrammarExerciseGenerator: () => null,
}));
vi.mock("./Grade11RequireSignIn", () => ({
  Grade11RequireSignIn: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./Grade11RolePlay", () => ({
  Grade11RolePlay: ({ exercise }: { exercise: string }) => <p>AI exercise {exercise}</p>,
}));
beforeEach(() => sessionStorage.clear());
afterEach(cleanup);
const group = (id: string) => document.querySelector(`[data-exercise="${id}"]`) as HTMLElement;
it.each([
  { Lesson: Grade11Unit2Lesson, id: "2A-30" },
  { Lesson: Grade11Unit3Lesson, id: "3A-35" },
  { Lesson: Grade11Unit4Lesson, id: "4A-13" },
  { Lesson: Grade11Unit5Lesson, id: "5A-82" },
])(
  "provides independent semantic Check and source/guidance Reveal for $id without an overall AI button",
  ({ Lesson, id }) => {
    render(<Lesson kind="reading" />);
    const exercise = within(group(id));
    const inputs = exercise.getAllByRole("textbox");
    expect(exercise.getAllByRole("button", { name: "Check Answer" })).toHaveLength(inputs.length);
    expect(exercise.getAllByRole("button", { name: "Reveal Answer" })).toHaveLength(inputs.length);
    expect(exercise.queryByRole("button", { name: "Check Answer with AI" })).toBeNull();
    fireEvent.click(exercise.getAllByRole("button", { name: "Reveal Answer" })[0]);
    expect(exercise.getAllByRole("button", { name: "Hide Answer" })).toHaveLength(1);
    expect(exercise.getAllByRole("button", { name: "Reveal Answer" })).toHaveLength(
      inputs.length - 1,
    );
  },
);
it("checks and reveals each audio-backed Unit 6 listening blank locally", () => {
  render(<Grade11Unit6Lesson kind="listening" />);
  const exercise = within(group("6D-0"));
  expect(exercise.getAllByRole("button", { name: "Check Answer" })).toHaveLength(10);
  fireEvent.change(exercise.getAllByRole("textbox")[0], { target: { value: "negative" } });
  fireEvent.click(exercise.getAllByRole("button", { name: "Check Answer" })[0]);
  expect(exercise.getByText("✅ မှန်ပါတယ်! တော်လိုက်တာ။")).toBeVisible();
  fireEvent.click(exercise.getAllByRole("button", { name: "Reveal Answer" })[1]);
  expect(exercise.getByText("local people")).toBeVisible();
});
it("shows all eight Unit 3 phrasal verbs as cards and restores the supplied questions", () => {
  render(<Grade11Unit3Lesson kind="vocabulary" />);
  expect(within(group("3B-3")).getByText("1. think back")).toBeVisible();
  expect(screen.queryByText(/View original textbook page/)).toBeNull();
  const b = within(group("3B-12"));
  expect(b.getByText(/The two universities have/, { selector: "p" })).toBeVisible();
  expect(b.getByText(/The amount of money he has saved/, { selector: "p" })).toBeVisible();
  expect(b.getByText(/several months of training/, { selector: "p" })).toBeVisible();
  expect(b.getAllByRole("textbox")).toHaveLength(8);
});
it.each([Grade11Unit3Lesson, Grade11Unit4Lesson, Grade11Unit6Lesson])(
  "groups Writing notes with direct Burmese and retains the student's draft",
  (Lesson) => {
    render(<Lesson kind="writing" />);
    expect(screen.getAllByLabelText("Bilingual study notes").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Translate whole section to Burmese" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Show Myanmar Translation" })).toBeNull();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
  },
);
it("directly translates all Unit 6 adjective meanings and speaking expressions", () => {
  const view = render(<Grade11Unit6Lesson kind="vocabulary" />);
  for (const b of TRAVEL_LESSONS[6].sections
    .find((s) => s.code === "6B")!
    .blocks.filter((b) => /^6B-([2-9]|10|11)$/.test(b.id)))
    expect(screen.getByText(b.my)).toBeVisible();
  view.unmount();
  render(<Grade11Unit6Lesson kind="speaking" />);
  expect(screen.getByRole("heading", { name: "Useful language — What to do" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "What not to do" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Sample Tips" })).toBeVisible();
  expect(screen.getByText("You should always / definitely ...")).toBeVisible();
  expect(screen.queryByRole("button", { name: /Translate|Show Myanmar Translation/ })).toBeNull();
});
it("keeps Unit 6 capital and destination tables separate with independent country and reason drafts", () => {
  render(<Grade11Unit6Lesson kind="reading" />);
  expect(screen.getByRole("table", { name: "Countries and capital cities" })).toBeVisible();
  const table = screen.getByRole("table", {
    name: "Tourist destinations, countries and attractions",
  });
  expect(within(table).getByRole("columnheader", { name: "Country" })).toBeVisible();
  expect(within(table).getByText("a historic pagoda")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Country: 2. Mount Popa"), {
    target: { value: "Myanmar" },
  });
  expect(screen.getByLabelText("Your answer: 2. Mount Popa")).toHaveValue("");
});
it.each([
  { Lesson: Grade11Unit2Lesson, id: "2D-18" },
  { Lesson: Grade11Unit3Lesson, id: "3D-33" },
])("launches the exercise-specific AI partner for $id", ({ Lesson, id }) => {
  render(<Lesson kind="speaking" />);
  fireEvent.click(within(group(id)).getByRole("button", { name: "Practise with AI" }));
  expect(screen.getByText(`AI exercise ${id}`)).toBeVisible();
});
