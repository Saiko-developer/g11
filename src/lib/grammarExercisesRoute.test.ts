import { beforeEach, expect, it, vi } from "vitest";

const { requireUser, generateJson } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  generateJson: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@/lib/ai-credit.server", () => ({
  withAiCredit: (_request: Request, _action: string, run: () => Promise<Response>) => run(),
}));
vi.mock("@/lib/api-guard.server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-guard.server")>()),
  requireUser,
}));
vi.mock("@/lib/ai-json.server", () => ({ generateJson }));

import { Route } from "../routes/api/grammar-exercises";

const post = (
  Route as unknown as {
    server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } };
  }
).server.handlers.POST;

function submit(body: Record<string, unknown>) {
  return post({
    request: new Request("https://school.example/api/grammar-exercises", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  requireUser.mockResolvedValue({ userId: "student" });
  generateJson.mockResolvedValue([
    {
      text: "Write a sentence giving advice with ‘should’.",
      translation: "အကြံပြုတဲ့ ဝါကျတစ်ကြောင်း ရေးပါ။",
      answer: "You should get more sleep.",
    },
  ]);
});

it("generates Grade 12 practice for a textbook writing activity without numbered samples", async () => {
  const result = await submit({
    grade: 12,
    title: "Grade 12 Unit 1 Grammar B",
    instructions: "Make six sentences of your own, using must, can and should.",
    samples: [],
  });
  expect(result.status).toBe(200);
  expect(generateJson).toHaveBeenCalledWith({
    system: expect.stringContaining("Myanmar Grade 12 English teacher"),
    prompt: expect.stringContaining("using must, can and should"),
  });
  expect((await result.json()).items[0].answer).toBe("You should get more sleep.");
});

it("uses the textbook references and choices to model Grade 12 practice", async () => {
  const result = await submit({
    grade: 12,
    title: "Grade 12 Grammar",
    instructions: "Choose the correct option.",
    reference: "Verbs followed by a to-infinitive",
    samples: [{ text: "She reminded him ___ the books.", choices: ["buy", "to buy"] }],
  });
  expect(result.status).toBe(200);
  const [{ prompt }] = generateJson.mock.calls[0];
  expect(prompt).toContain('<untrusted label="textbook exercise">');
  expect(prompt).toContain("Verbs followed by a to-infinitive");
  expect(prompt).toContain("She reminded him ___ the books. [Choices: buy / to buy]");
});

it("keeps the original request format and sample requirement for earlier grades", async () => {
  const exercise = { title: "Grammar A", instructions: "Use the correct form." };
  expect((await submit(exercise)).status).toBe(400);
  expect(generateJson).not.toHaveBeenCalled();
  const result = await submit({ ...exercise, samples: [{ text: "She ___ (write) every day." }] });
  expect(result.status).toBe(200);
  expect(generateJson).toHaveBeenCalledWith(
    expect.objectContaining({
      system: expect.stringContaining("Myanmar Grade 10 English teacher"),
    }),
  );
});
