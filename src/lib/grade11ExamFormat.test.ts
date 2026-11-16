import { describe, expect, it } from "vitest";
import { applyGrade11Format, letterPrompt, normalizeExamSectionId } from "./grade11ExamFormat";
import { grade11ExamSource } from "./grade11ExamSource.server";
import { questionBody } from "./examPrint";
import type { MockExamPaper, ExamSection, LetterScenario } from "./mockExam";
const scenario: LetterScenario = {
  kind: "personal",
  writerName: "Htet Htet",
  writerAddress: "No. 29, Tharyar Gon Road, Pathein",
  recipientName: "Lin Lin",
  relationship: "your cousin studying in New Delhi",
  purpose: "asking about her scholarship",
  points: [
    "ask about her studies",
    "ask about social life",
    "request scholarship application details",
  ],
};
const source = {
  readings: [{ unit: 1, passage: "Dolphins live in rivers. They eat fish." }],
  poems: [{ title: "Test", lines: ["The trees give shade", "Beside the river bank"] }],
};
function paper(section: ExamSection): MockExamPaper {
  return {
    title: "Practice",
    unit: 1,
    unitTopics: "Test",
    totalMarks: 0,
    durationMinutes: 0,
    sections: [section],
  };
}
function apply(p: MockExamPaper) {
  applyGrade11Format(
    p,
    { grade: 11, units: [1], sections: [p.sections[0].id as "VIII"], count: 10 },
    source,
  );
}
const letters = (): ExamSection => ({
  id: "VIII",
  type: "writing",
  title: "Letter",
  marks: 0,
  instructions: "",
  maxWords: 200,
  prompts: [],
  letterScenarios: [
    scenario,
    {
      ...scenario,
      kind: "formal",
      recipientName: "the manager",
      recipientAddress: "Golden Valley Road, Yangon",
      relationship: "of Wallets Collection",
      purpose: "complaining about a broken wallet",
      points: [
        "state when you bought the wallet",
        "describe the broken zipper",
        "request a refund or replacement",
      ],
    },
  ],
  sampleAnswers: ["A personal model letter.", "A formal model letter."],
});
describe("Grade 11 exam paper contract", () => {
  it.each([
    "I",
    "I.",
    "Section I",
    "section: 1",
    1,
    "Ⅰ",
    "1. Vocabulary Completion",
    "I — Vocabulary Completion",
  ])("accepts section I numbering variant %s", (value) => {
    expect(normalizeExamSectionId(value)).toBe("I");
    const section: ExamSection = {
      id: value as string,
      type: "fill",
      title: "Vocabulary",
      instructions: "",
      marks: 10,
      items: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        sentence: "A ______ sentence.",
        hint: "t",
        answer: "test",
      })),
    };
    const p = paper(section);
    applyGrade11Format(p, { grade: 11, units: [1], sections: ["I"], count: 10 }, source);
    expect(p.sections[0].id).toBe("I");
  });
  it.each([null, undefined, "", "X", "10", "Intro", "IIIA", "Section VIIIa"])(
    "does not guess invalid or missing section ids: %s",
    (value) => {
      expect(normalizeExamSectionId(value)).toBeNull();
    },
  );
  it("rejects duplicated sections after normalization", () => {
    const p = paper(letters());
    p.sections = [
      { ...letters(), id: "VIII" },
      { ...letters(), id: "8" },
    ];
    expect(() =>
      applyGrade11Format(p, { grade: 11, units: [1], sections: ["VIII", "IX"], count: 10 }, source),
    ).toThrow("duplicate sections");
  });
  it("still rejects a genuinely missing section I instead of relabeling another section", () => {
    const p = paper(letters());
    expect(() =>
      applyGrade11Format(p, { grade: 11, units: [1], sections: ["I"], count: 10 }, source),
    ).toThrow("missing section I");
  });

  it("creates detailed alternatives with correct marks, word limit and OR in print", () => {
    const p = paper(letters());
    apply(p);
    const s = p.sections[0];
    expect(s.marks).toBe(10);
    if (s.type !== "writing") throw Error();
    expect(s.maxWords).toBe(300);
    expect(s.prompts[0]).toContain("No. 29, Tharyar Gon Road, Pathein");
    expect(s.prompts[1]).toContain("request a refund or replacement");
    expect(questionBody(s)).toContain("(OR)");
  });
  it("rejects incomplete letter scenarios and missing model letters", () => {
    expect(() => letterPrompt({ ...scenario, points: [] })).toThrow("task points");
    expect(() => letterPrompt({ ...scenario, kind: "formal" })).toThrow("recipient address");
    const s = letters();
    if (s.type !== "writing") throw Error();
    s.sampleAnswers = ["only one"];
    expect(() => apply(paper(s))).toThrow("model answers");
  });
  it("requires Reading evidence and two consecutive textbook poem lines for IV(B)", () => {
    const s: ExamSection = {
      id: "IV",
      title: "",
      marks: 0,
      instructions: "",
      type: "poetry",
      poemTitle: "Test",
      partA: Array.from({ length: 5 }, () => ({
        number: 0,
        sentence: "The trees give ______\nBeside the river bank",
        answer: "shade",
      })),
      partB: [
        ...Array.from({ length: 4 }, () => ({
          number: 0,
          question: "Where do dolphins live?",
          answer: "They live in rivers.",
          sourceUnit: 1,
          sourceEvidence: "Dolphins live in rivers.",
        })),
        {
          number: 0,
          question: "What do these lines mean?\nThe trees give shade\nBeside the river bank",
          answer: "The trees shelter the river bank.",
        },
      ],
    };
    apply(paper(s));
    expect(s.partB.map((q) => q.number)).toEqual([6, 7, 8, 9, 10]);
    s.partB[0].sourceEvidence = "Invented text";
    expect(() => apply(paper(s))).toThrow("source evidence");
  });
  it("requires an extra bold WORD, not an extra definition", () => {
    const words = ["permeable", "vapour", "precipitation", "fluctuation", "arid", "moisture"];
    const s: ExamSection = {
      id: "VI",
      type: "passage_extended",
      title: "",
      instructions: "",
      marks: 0,
      passage: words.map((w) => `**${w}**`).join(" "),
      definitions: words.slice(0, 5).map((w) => ({ number: 0, definition: w, answer: w })),
      distractorDefinition: "wrong extra",
      partB: Array.from({ length: 5 }, () => ({ number: 0, question: "Why?", answer: "Because." })),
    };
    apply(paper(s));
    expect(s.distractorDefinition).toBe("");
    expect(s.partB[0].number).toBe(6);
    s.passage = s.passage.replace("**moisture**", "moisture");
    expect(() => apply(paper(s))).toThrow("six bold words");
  });
  it("requires a complete dialogue and five exchanges with one extra expression each", () => {
    const bank = ["Yes", "Certainly", "Excuse me", "Thank you", "How are you", "Unused"];
    const section: ExamSection = {
      id: "VII",
      title: "",
      instructions: "",
      marks: 0,
      type: "functional",
      wordBank: bank,
      phraseBank: bank,
      dialogue: Array.from({ length: 10 }, (_, i) => ({
        number: i,
        speaker: i % 2 ? "B" : "A",
        text: i % 2 ? "A complete response." : "______",
        ...(i % 2 ? {} : { answer: bank[i / 2] }),
      })),
      matches: bank
        .slice(0, 5)
        .map((answer) => ({ number: 0, question: "A: ______\nB: Here you are.", answer })),
    };
    apply(paper(section));
    expect(section.matches.map((q) => q.number)).toEqual([6, 7, 8, 9, 10]);
    expect(section.dialogue[0].text).toBe("(1) ______");
    expect(questionBody(section)).toContain("A: ______");
    section.phraseBank.pop();
    expect(() => apply(paper(section))).toThrow("six distinct expressions");
  });
  it("rejects model letters longer than the actual exam word limit", () => {
    const section = letters();
    if (section.type !== "writing") throw Error();
    section.sampleAnswers![0] = Array(301).fill("word").join(" ");
    expect(() => apply(paper(section))).toThrow("model answers");
  });
  it("loads all twelve Grade 11 readings and four original poems", async () => {
    const data = await grade11ExamSource(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(data.readings).toHaveLength(12);
    expect(data.readings.every((r) => r.passage.length > 300)).toBe(true);
    expect(data.poems.map((p) => p.title)).toEqual([
      "Bridges",
      "Cloud Zoo",
      "Leisure",
      "Stopping by Woods on a Snowy Evening",
    ]);
  });
  it("renders exact grammar emphasis and escapes model HTML", () => {
    const s: ExamSection = {
      id: "III",
      type: "transformation",
      title: "",
      instructions: "",
      marks: 10,
      items: [
        {
          number: 1,
          sentence: "My cousin <script> came.",
          underline: "My cousin",
          instruction: "Use a cleft.",
          answer: "It was my cousin who came.",
        },
      ],
    };
    const html = questionBody(s);
    expect(html).toContain("<u>My cousin</u>");
    expect(html).not.toContain("<script>");
  });
});
