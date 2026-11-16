import { describe, it, expect } from "vitest";
import { buildTextbookVerseCompletion } from "./examVerse";
import { grade11ExamSource } from "./grade11ExamSource.server";
describe("textbook verse completion without AI transcription", () => {
  it("builds five distinct two-line questions whose restored answers exactly match original verse", async () => {
    const source = await grade11ExamSource([1]);
    for (const seed of [0, 0.25, 0.75, 0.999]) {
      const items = buildTextbookVerseCompletion(source.poems, () => seed);
      expect(items.map((i) => i.number)).toEqual([1, 2, 3, 4, 5]);
      expect(new Set(items.map((i) => i.sentence)).size).toBe(5);
      const seenPoems = new Set<number>();
      for (const item of items) {
        expect(item.sentence.split("\n")).toHaveLength(2);
        expect(item.sentence.match(/______/g)).toHaveLength(1);
        const restored = item.sentence.replace("______", item.answer);
        const poemIndex = source.poems.findIndex((p) =>
          p.lines.slice(0, -1).some((line, i) => `${line}\n${p.lines[i + 1]}` === restored),
        );
        expect(poemIndex).toBeGreaterThanOrEqual(0);
        seenPoems.add(poemIndex);
      }
      expect(seenPoems.size).toBe(4);
    }
  });
  it("preserves punctuation and fails explicitly when original material is insufficient", () => {
    expect(() => buildTextbookVerseCompletion([{ title: "Short", lines: ["One line."] }])).toThrow(
      "Not enough original",
    );
  });
});
