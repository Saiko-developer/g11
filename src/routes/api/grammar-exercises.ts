import { withAiCredit } from "@/lib/ai-credit.server";
import { requireUser, untrusted } from "@/lib/api-guard.server";
import { withTone } from "@/lib/tone-rules";
import { createFileRoute } from "@tanstack/react-router";

import { generateJson } from "@/lib/ai-json.server";

type Item = { text: string; translation: string; answer: string };

const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export const Route = createFileRoute("/api/grammar-exercises")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        withAiCredit(request, "generate", async () => {
          const authed = await requireUser(request, { enforceAccountStatus: true });
          if (authed instanceof Response) return authed;
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const grade = body.grade === 12 ? 12 : 10;
          const reference = grade === 12 ? s(body.reference, 2400) : "";
          const title = s(body.title, 200);
          const instructions = s(body.instructions, 600);
          const samples = (Array.isArray(body.samples) ? body.samples : [])
            .slice(0, 8)
            .map((x: { text?: unknown; answer?: unknown; choices?: unknown } | null) => ({
              text: s(x?.text, 400),
              answer: s(x?.answer, 400),
              choices: (Array.isArray(x?.choices) ? x.choices : [])
                .slice(0, 8)
                .map((choice) => s(choice, 100))
                .filter(Boolean),
            }))
            .filter((x) => x.text);
          const avoid = (Array.isArray(body.avoid) ? body.avoid : [])
            .slice(-40)
            .map((x) => s(x, 200))
            .filter(Boolean);
          if (!title || (!samples.length && (grade !== 12 || !instructions))) {
            return Response.json({ error: "Invalid exercise" }, { status: 400 });
          }
          try {
            const raw = await generateJson<Item[]>({
              system: withTone`You are Saya Owl, a Myanmar Grade ${grade} English teacher. Write exactly 10 NEW practice items for the textbook grammar exercise below.
Copy the exact task type, format, sentence length and difficulty of the real textbook items. Do not invent a different kind of task, do not add explanations or lessons.
${grade === 12 ? `Use the textbook instruction to determine the task type, including when it has no numbered examples. Include any options, word bank, or passage context needed to answer each new item in its question text so it can be answered on its own. For open-ended sentence-writing exercises, ask the student to write one sentence per item and give a valid model sentence as the answer.` : ""}
Each item: "text" (the question, same style as the samples), "translation" (natural Burmese Unicode translation of the question), "answer" (the correct answer in the same style as the sample answers).
Return a JSON array: [{"text": string, "translation": string, "answer": string}]`,
              prompt: untrusted(
                "textbook exercise",
                `Exercise: ${title}
Instructions: ${instructions}
${reference ? `Textbook reference:\n${reference}\n` : ""}Real textbook items:
${samples
  .map(
    ({ text, answer, choices }, index) =>
      `${index + 1}. ${text}${choices.length ? ` [Choices: ${choices.join(" / ")}]` : ""}${answer ? ` => ${answer}` : ""}`,
  )
  .join("\n")}
Do not repeat: ${avoid.join(" || ") || "none"}`,
                24000,
              ),
            });
            const items = (Array.isArray(raw) ? raw : [])
              .filter((q) => q && typeof q.text === "string" && typeof q.answer === "string")
              .slice(0, 10)
              .map((q) => ({
                text: q.text,
                translation: typeof q.translation === "string" ? q.translation : "",
                answer: q.answer,
              }));
            if (!items.length) throw new Error("No usable items generated");
            return Response.json({ items });
          } catch (error) {
            console.error("[grammar-exercises]", error);
            const msg = error instanceof Error ? error.message : "unknown";
            const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
            return Response.json({ error: msg }, { status });
          }
        }),
    },
  },
});
