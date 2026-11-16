import { sectionSpecs, type ExamConfig } from "./examBlueprint";
import type { MockExamPaper, LetterScenario } from "./mockExam";
import type { Grade11ExamSource } from "./grade11ExamSource.server";
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
function requireFormat(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`Invalid exam format: ${message}`);
}
export function letterPrompt(s: LetterScenario): string {
  requireFormat(s && ["personal", "formal"].includes(s.kind), "letter type");
  for (const key of [
    "writerName",
    "writerAddress",
    "recipientName",
    "relationship",
    "purpose",
  ] as const)
    requireFormat(typeof s[key] === "string" && s[key].trim().length >= 2, `letter ${key}`);
  requireFormat(
    Array.isArray(s.points) &&
      s.points.length >= 3 &&
      s.points.every((p) => typeof p === "string" && p.trim()),
    "letter task points",
  );
  requireFormat(
    /no\.?\s*\d/i.test(s.writerAddress) && s.writerAddress.split(",").length >= 3,
    "writer house number, road and town",
  );
  if (s.kind === "formal") requireFormat(s.recipientAddress?.trim(), "formal recipient address");
  return `You are ${s.writerName}. You live at ${s.writerAddress}. Write a letter to ${s.recipientName}, ${s.relationship}${s.recipientAddress ? `, at ${s.recipientAddress}` : ""}, ${s.purpose}. In your letter, ${s.points.join("; ")}.`;
}
/** Reject malformed generated papers before they can be recorded or consume an exam allowance. */
export function applyGrade11Format(
  paper: MockExamPaper,
  config: ExamConfig,
  source: Grade11ExamSource,
) {
  requireFormat(paper.sections.length === config.sections.length, "section count");
  requireFormat(
    new Set(paper.sections.map((s) => s.id)).size === config.sections.length,
    "duplicate sections",
  );
  const number = <T extends { number: number }>(items: T[], count: number, start = 1) => {
    requireFormat(Array.isArray(items) && items.length === count, `expected ${count} questions`);
    items.forEach((q, i) => {
      q.number = start + i;
    });
  };
  paper.sections = config.sections.map((id) => {
    const s = paper.sections.find((section) => section.id === id);
    const spec = sectionSpecs(11).find((section) => section.id === id);
    requireFormat(s && spec, `missing section ${id}`);
    s.marks = spec.countable ? config.count : spec.marks;
    const expected = {
      I: "fill",
      II: "mcq",
      III: "transformation",
      IV: "poetry",
      V: "passage",
      VI: "passage_extended",
      VII: "functional",
      VIII: "writing",
      IX: "writing",
    };
    requireFormat(s.type === expected[id], `section ${id} type`);
    if (s.type === "fill" || s.type === "mcq" || s.type === "transformation") {
      number(s.items, config.count);
      for (const item of s.items)
        requireFormat(item.sentence?.trim() && item.answer?.trim(), "question and answer");
      if (s.type === "mcq")
        for (const item of s.items)
          requireFormat(
            item.options?.length === 3 &&
              ["A", "B", "C"].every((label) =>
                item.options.some((o) => o.label === label && o.text?.trim()),
              ) &&
              ["A", "B", "C"].includes(item.answer),
            "MCQ choices",
          );
      if (s.type === "transformation")
        for (const item of s.items)
          requireFormat(
            item.instruction?.trim() && (!item.underline || item.sentence.includes(item.underline)),
            "grammar instruction / underline",
          );
    } else if (s.type === "poetry") {
      number(s.partA, 5);
      number(s.partB, 5, 6);
      for (const q of s.partA)
        requireFormat(
          q.sentence?.includes("______") &&
            q.answer &&
            source.poems.some((p) =>
              normalize(p.lines.join(" ")).includes(
                normalize(q.sentence.replace("______", q.answer)),
              ),
            ),
          "textbook verse completion",
        );
      for (const q of s.partB.slice(0, 4))
        requireFormat(
          q.answer?.trim() &&
            q.sourceEvidence &&
            source.readings.some(
              (r) =>
                r.unit === q.sourceUnit &&
                normalize(r.passage).includes(normalize(q.sourceEvidence!)),
            ),
          "Reading answer source evidence",
        );
      const q = s.partB[4];
      requireFormat(
        q.answer?.trim() &&
          /what do these lines mean/i.test(q.question) &&
          source.poems.some((p) =>
            p.lines
              .slice(0, -1)
              .some((line, i) =>
                normalize(q.question).includes(normalize(`${line} ${p.lines[i + 1]}`)),
              ),
          ),
        "two-line poem interpretation",
      );
      s.title = "Verse Completion and Textbook Questions";
      s.instructions =
        "(A) Write the appropriate words or groups of words to complete the lines of verse. (5 marks) (B) Answer the questions in complete sentences. (5 marks)";
    } else if (s.type === "passage") {
      number(s.partA, 5);
      number(s.partB, 5, 6);
    } else if (s.type === "passage_extended") {
      number(s.definitions, 5);
      number(s.partB, 5, 6);
      const words = [...s.passage.matchAll(/\*\*(.+?)\*\*/g)].map((m) => normalize(m[1]));
      requireFormat(
        new Set(words).size === 6 &&
          new Set(s.definitions.map((d) => normalize(d.answer))).size === 5 &&
          s.definitions.every((d) => words.includes(normalize(d.answer))),
        "six bold words with one extra",
      );
      s.distractorDefinition = "";
    } else if (s.type === "functional") {
      requireFormat(
        s.wordBank?.length === 6 &&
          new Set(s.wordBank).size === 6 &&
          s.phraseBank?.length === 6 &&
          new Set(s.phraseBank).size === 6,
        "six distinct expressions in each bank",
      );
      requireFormat(s.dialogue.length >= 8, "complete dialogue context");
      const blanks = s.dialogue.filter((t) => t.answer);
      requireFormat(
        s.dialogue.every((t) => t.speaker?.trim() && t.text?.trim()) &&
          s.dialogue.filter((t) => t.text.includes("______")).length === 5,
        "dialogue speakers and blanks",
      );
      requireFormat(
        blanks.length === 5 &&
          new Set(blanks.map((t) => t.answer)).size === 5 &&
          blanks.every((t) => t.text.includes("______") && s.wordBank.includes(t.answer!)),
        "five dialogue blanks",
      );
      s.dialogue.forEach((t, i) => {
        t.number = i + 1;
      });
      blanks.forEach((t, i) => {
        t.text = t.text.replace("______", `(${i + 1}) ______`);
      });
      number(s.matches, 5, 6);
      requireFormat(
        new Set(s.matches.map((q) => q.answer)).size === 5 &&
          s.matches.every(
            (q) =>
              /A:/.test(q.question) &&
              /B:/.test(q.question) &&
              q.question.includes("______") &&
              s.phraseBank.includes(q.answer),
          ),
        "five A/B exchanges",
      );
    } else if (s.type === "writing") {
      s.maxWords = id === "VIII" ? 300 : 500;
      if (id === "VIII") {
        requireFormat(
          s.letterScenarios?.length === 2 &&
            s.letterScenarios[0].kind === "personal" &&
            s.letterScenarios[1].kind === "formal",
          "personal and formal letter alternatives",
        );
        s.prompts = s.letterScenarios.map(letterPrompt);
      }
      requireFormat(
        s.prompts?.length === (id === "VIII" ? 2 : 3) &&
          s.sampleAnswers?.length === s.prompts.length &&
          s.sampleAnswers.every(
            (a) => typeof a === "string" && a.trim() && a.trim().split(/\s+/).length <= s.maxWords,
          ),
        "writing alternatives and model answers",
      );
      s.instructions =
        id === "VIII"
          ? "Choose a situation given below and write a letter. Do not write more than 300 words."
          : "Write an essay on ONE of the following. Do not write more than 500 words.";
    }
    return s;
  });
}
