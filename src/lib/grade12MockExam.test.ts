import { beforeEach, expect, it, vi } from "vitest";
import { grade12ExamSource } from "./grade12ExamSource.server";
import type { ExamSection, MockExamPaper } from "./mockExam";
import { answerKeyHtml } from "./examPrint";

const { rpc, generateJson, requireActiveAccount } = vi.hoisted(() => ({
  rpc: vi.fn(),
  generateJson: vi.fn(),
  requireActiveAccount: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@/lib/ai-json.server", () => ({ generateJson }));
vi.mock("@/lib/account-access.server", () => ({ requireActiveAccount }));

import { Route } from "@/routes/api/mock-exam";

const post = (
  Route as unknown as {
    server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } };
  }
).server.handlers.POST;

beforeEach(() => {
  vi.resetAllMocks();
  requireActiveAccount.mockResolvedValue(null);
  rpc.mockResolvedValue({ data: { role: "teacher", limit: 4, used: 1 }, error: null });
});

function generate(sections: string[], token = "test-token") {
  return post({
    request: new Request("https://school.example/api/mock-exam", {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: JSON.stringify({ grade: 12, units: [1], sections, fresh: true }),
    }),
  });
}

it("has textbook reading sources for every Grade 12 unit and enough original verse", () => {
  const source = grade12ExamSource(Array.from({ length: 12 }, (_, i) => i + 1));
  expect(source.readings).toHaveLength(12);
  expect(source.readings.every(({ passage }) => passage.length > 400)).toBe(true);
  expect(source.poems.map(({ title }) => title)).toEqual([
    "The Quiet Life",
    "The Road Not Taken",
    "Windy Nights",
  ]);
});

it("builds and records a Grade 12 mock paper using the selected textbook reading and verse", async () => {
  const source = grade12ExamSource([1]);
  const passage = source.readings[0].passage;
  const answerItems = Array.from({ length: 5 }, (_, i) => ({
    number: i,
    question: `Reading question ${i + 1}?`,
    answer: "A complete answer.",
    sourceUnit: 1,
    sourceEvidence: passage.split(/\s+/).slice(0, 8).join(" "),
  }));
  const common = { title: "", instructions: "", marks: 0 };
  const sections: ExamSection[] = [
    { ...common, id: "IV", type: "poetry", poemTitle: "", partA: [], partB: answerItems },
    {
      ...common,
      id: "V",
      type: "passage",
      passage: "[TEXTBOOK]",
      partA: answerItems.map((item) => ({ ...item, sentence: "Complete this ______." })),
      partB: answerItems.map((item) => ({ ...item })),
    },
    {
      ...common,
      id: "IX",
      type: "writing",
      maxWords: 300,
      prompts: ["Topic A", "Topic B", "Topic C"],
      sampleAnswers: ["Essay A.", "Essay B.", "Essay C."],
    },
  ];
  generateJson.mockResolvedValue({ title: "Practice paper", sections });
  const response = await generate(["IV", "V", "IX"]);
  expect(response.status).toBe(200);
  const { paper } = (await response.json()) as { paper: MockExamPaper };
  expect(paper).toMatchObject({ grade: 12, units: [1], totalMarks: 35, durationMinutes: 40 });
  expect(paper.configKey).toBe("g12-v2|1|IV,V,IX|10");
  const [poetry, reading, essay] = paper.sections;
  if (poetry.type !== "poetry" || reading.type !== "passage" || essay.type !== "writing")
    throw new Error("Unexpected exam sections");
  expect(poetry.partA).toHaveLength(5);
  expect(poetry.partB[4].question).toMatch(/^What do these lines mean\?\n[^\n]+\n[^\n]+$/);
  expect(poetry.partB[4].number).toBe(10);
  expect(reading.passage.length).toBeGreaterThan(400);
  expect(passage.startsWith(reading.passage)).toBe(true);
  expect(essay.maxWords).toBe(500);
  expect(answerKeyHtml(paper)).toContain("Grade 12 English");
  expect(generateJson).toHaveBeenCalledWith(
    expect.objectContaining({
      system: expect.stringMatching(/Grade 12 English[\s\S]+Good Manners[\s\S]+grade12_textbook/),
    }),
  );
  expect(rpc).toHaveBeenCalledWith(
    "record_exam_generation",
    expect.objectContaining({ _unit: 1, _paper: expect.objectContaining({ grade: 12 }) }),
  );
});

it("requires sign-in before generation or use of the shared quota", async () => {
  expect((await generate(["I"], "")).status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
  expect(generateJson).not.toHaveBeenCalled();
});
