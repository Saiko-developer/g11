import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { additionalUnits } from "@/data/grade12/additionalUnits";
import { grade12SkillTopics, grade12Skills } from "@/data/grade12/syllabus";
import { AdditionalTextbookLesson } from "./AdditionalTextbookLesson";

vi.mock("@/components/grade11/Grade11RequireSignIn", () => ({
  Grade11RequireSignIn: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/grade11/Grade11RolePlay", () => ({
  Grade11RolePlay: ({ unit, exercise }: { unit: number; exercise: string }) => (
    <div role="status">
      {unit} · {exercise}
    </div>
  ),
}));

describe.each([
  [5, [5, 6, 4, 9, 5, 5], "5D-G12-F"],
  [6, [3, 6, 9, 10, 14], "6D-G12-E"],
  [7, [3, 10, 10, 10], "7D-G12-D"],
] as const)("Grade 12 Unit %i", (unit, readingCounts, exerciseId) => {
  it("includes each skill and has a corresponding Burmese translation per item", () => {
    const { sections, passage } = additionalUnits[unit];
    expect(passage.every((paragraph) => paragraph.en && /[က-၏]/.test(paragraph.my))).toBe(true);
    expect(sections.reading.groups.map(({ source }) => source.items.length)).toEqual(readingCounts);
    for (const skill of grade12Skills) {
      const { groups, pages } = sections[skill];
      expect(groups.length).toBeGreaterThan(0);
      expect(pages).toMatch(/^\d/);
      for (const group of groups) {
        expect(group.translation.instruction).toMatch(/[က-၏]/);
        expect(group.translation.items).toHaveLength(group.source.items.length);
        for (const translation of group.translation.items) {
          expect(translation).toMatch(/[က-၏]/);
        }
      }
    }
  });

  it("shows grammar explanations and exercise translations", () => {
    render(<AdditionalTextbookLesson unit={unit} skill="grammar" />);
    expect(
      screen.getByRole("heading", { level: 2, name: grade12SkillTopics[unit].grammar }),
    ).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Oral Explanation" })[0]).toBeVisible();
    const button = screen.getAllByRole("button", { name: "Translate question" })[0];
    fireEvent.click(button);
    expect(
      within(button.closest(".border-t") as HTMLElement).getByText(/[က-၏]/, {
        selector: "p[lang=my]",
      }),
    ).toBeVisible();
  });

  it("opens the correct textbook role-play", () => {
    render(<AdditionalTextbookLesson unit={unit} skill="speaking" />);
    fireEvent.click(screen.getByRole("button", { name: "Practise with AI" }));
    expect(screen.getByRole("status")).toHaveTextContent(`${unit} · ${exerciseId}`);
  });
});
