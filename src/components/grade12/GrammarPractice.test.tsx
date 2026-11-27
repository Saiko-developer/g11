import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { additionalUnits, isAdditionalUnit } from "@/data/grade12/additionalUnits";
import { textbookUnits } from "@/data/grade12/textbookUnits";
import { unit1Sections } from "@/data/grade12/unit1";
import { AdditionalTextbookLesson } from "./AdditionalTextbookLesson";
import { TextbookUnitLesson } from "./TextbookUnitLesson";
import { Unit1Lesson } from "./Unit1Lesson";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const)(
  "puts extra practice below each textbook grammar exercise in Unit %i",
  (unit) => {
    const { container } = render(
      unit === 1 ? (
        <Unit1Lesson section={unit1Sections[2]} />
      ) : unit === 2 || unit === 3 || unit === 4 ? (
        <TextbookUnitLesson unit={unit} skill="grammar" />
      ) : (
        <AdditionalTextbookLesson unit={unit} skill="grammar" />
      ),
    );
    const instructions =
      unit === 1
        ? [
            "A. Fill each blank with an appropriate modal verb: must, can and should.",
            "B. Make six sentences of your own, using must, can and should.",
          ]
        : isAdditionalUnit(unit)
          ? additionalUnits[unit].sections.grammar.groups
              .filter((group) => !group.informational)
              .map(({ source }) => source.instruction)
          : textbookUnits[unit].exercises.grammar.map(({ instruction }) => instruction);
    expect(screen.getAllByRole("button", { name: /Generate 10 exercises/ })).toHaveLength(
      instructions.length,
    );
    for (const instruction of instructions) {
      const exercise = screen.getByRole("heading", { name: instruction }).closest("section");
      expect(exercise).toBeInTheDocument();
      expect(container).toContainElement(exercise);
      expect(exercise?.lastElementChild).toHaveTextContent("More practice");
    }
  },
);

it("generates Grade 12 practice with its textbook word bank and lets students translate and reveal answers", async () => {
  const item = {
    text: "We thanked the person ______. (Word bank: had helped us)",
    translation: "ကျွန်တော်တို့ကို ကူညီခဲ့သူကို ကျေးဇူးတင်ခဲ့ပါတယ်။",
    answer: "who had helped us",
  };
  const request = vi.fn().mockResolvedValue(Response.json({ items: [item] }));
  vi.stubGlobal("fetch", request);

  render(<TextbookUnitLesson unit={2} skill="grammar" />);
  const exercise = screen
    .getByRole("heading", { name: /^B\. Complete the sentences/ })
    .closest("section")!;
  const panel = within(exercise);
  fireEvent.click(panel.getByRole("button", { name: /Generate 10 exercises/ }));

  expect(await panel.findByText(item.text)).toBeVisible();
  const [url, init] = request.mock.calls[0];
  expect(url).toBe("/api/grammar-exercises");
  expect(JSON.parse(init.body)).toMatchObject({
    grade: 12,
    title: "Grade 12 Unit 2 Grammar 2",
    reference: expect.stringContaining("paid a poor salary"),
    samples: expect.arrayContaining([
      expect.objectContaining({ answer: "who are paid a poor salary" }),
    ]),
  });
  const generated = within(panel.getByText(item.text).closest("li")!);
  fireEvent.click(generated.getByRole("button", { name: "Translate Question" }));
  expect(generated.getByText(item.translation)).toBeVisible();
  fireEvent.click(generated.getByRole("button", { name: "Reveal Answer" }));
  expect(generated.getByText(item.answer)).toBeVisible();
});
