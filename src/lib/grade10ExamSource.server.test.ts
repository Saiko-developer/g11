import { describe, expect, it } from "vitest";
import { grade10ExamSource, readingQuestions } from "./grade10ExamSource.server";
describe("Grade 10 textbook exam sources", () => {
  it("takes answered comprehension questions, excluding personal sample answers and blanks", () => {
    expect(
      readingQuestions({
        exercises: [
          { question: "What is language?", answer: "Language is a tool." },
          { question: "Do you like it?", answer: "Sample answer: Yes." },
          { text: "Language is ____", answer: "a tool" },
        ],
      }),
    ).toEqual([{ question: "What is language?", answer: "Language is a tool." }]);
  });
  it("numbers four distinct Reading questions 6–9 and provides original verse and passage", async () => {
    const source = await grade10ExamSource([1, 2, 3, 4]);
    expect(source.readingQuestions.map((q) => q.number)).toEqual([6, 7, 8, 9]);
    expect(new Set(source.readingQuestions.map((q) => q.question)).size).toBe(4);
    expect(source.passage).toContain("language");
    expect(source.poems[0][0][0]).toBe("I wandered lonely as a cloud");
  });
  it("fails explicitly when selected textbook material is unavailable", async () => {
    await expect(grade10ExamSource([20])).rejects.toThrow("textbook source unavailable");
  });
});
