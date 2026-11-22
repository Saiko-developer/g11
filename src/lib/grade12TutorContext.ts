import { unit2Exercises, unit2Reading, unit2References } from "@/data/grade12/unit2";
import core from "@/data/grade12/unit1-core.json";
import activities from "@/data/grade12/unit1-listening-speaking.json";
import { compounds, modals } from "@/data/grade12/unit1-reference";
import { grade12SkillTopics, grade12Units, type Grade12Skill } from "@/data/grade12/syllabus";
import { matchColumns } from "@/data/grade12/unit1-support";
import { unit1Sections } from "@/data/grade12/unit1";

function question(group: string, index: number, text: string, detail: string, unit = 1) {
  return `[${group ? `Exercise ${group} · ` : ""}Question ${index + 1} | source Grade 12 Unit ${unit}] ${text}\n${detail}`;
}

export function grade12TutorContext(skill?: Grade12Skill, unit: 1 | 2 = 1): string {
  if (!skill) {
    return [
      "Grade 12 English · Curriculum explorer",
      "The following entries are curriculum headings. In-app textbook lesson and exercise content is currently available for Units 1 and 2.",
      ...grade12Units.map(({ number, title }) => {
        const topics = grade12SkillTopics[number];
        return `Unit ${number} · ${title}: ${Object.entries(topics)
          .map(([kind, topic]) => `${kind}: ${topic}`)
          .join("; ")}`;
      }),
    ].join("\n");
  }

  if (unit === 2) {
    let paragraph = 0;
    const reference =
      skill === "reading"
        ? unit2Reading.map((text) =>
            /^\d+\. /.test(text) ? text : `[Paragraph ${++paragraph}] ${text}`,
          )
        : skill === "grammar" || skill === "vocabulary" || skill === "writing"
          ? unit2References[skill]
          : [];
    return [
      `Grade 12 English · Unit 2 · ${skill} · ${grade12SkillTopics[2][skill]}`,
      ...reference,
      skill === "listening" ? "Original audio and transcript are pending." : undefined,
      ...unit2Exercises[skill].flatMap(({ instruction, reference: example, items }) => [
        instruction,
        example,
        ...items.map(({ text, choices }, index) =>
          question(
            /^[A-Z]\./.test(instruction) ? instruction[0] : "",
            index,
            text,
            choices?.join(" · ") ?? instruction,
            2,
          ),
        ),
      ]),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const heading = `Grade 12 English · Unit 1 · ${skill} · ${grade12SkillTopics[1][skill]}`;
  if (skill === "listening") {
    const { instructionA, topics, instructionB, questions } = activities.listening;
    return [
      heading,
      "Original audio and transcript are pending. Do not infer an official answer from an unavailable recording.",
      instructionA,
      ...topics.map((topic, index) => question("A", index, topic, instructionA)),
      instructionB,
      ...questions.map(({ prompt, options }, index) =>
        question(
          "B",
          index,
          prompt,
          options.map((option, i) => `(${String.fromCharCode(97 + i)}) ${option}`).join(" "),
        ),
      ),
    ].join("\n\n");
  }
  if (skill === "speaking") {
    return [
      heading,
      ...activities.speaking.map(({ instruction, body }) => `${instruction}\n${body}`),
    ].join("\n\n");
  }
  if (skill === "writing") {
    return [heading, unit1Sections.find((section) => section.id === "writing")?.text].join("\n\n");
  }

  const reference = {
    reading: [
      ...core.paragraphs.map((paragraph, index) => `[Paragraph ${index + 1}] ${paragraph}`),
      "Pre-reading",
      ...core.people,
      ...core.manners,
      ...core.discussion,
    ],
    vocabulary: compounds.map(
      ({ title, description, examples }) =>
        `${title}\n${description}\n${examples.map(([word, pattern]) => `${word} (${pattern})`).join("\n")}`,
    ),
    grammar: modals.map(({ word, negative, uses }) =>
      [
        `${word}: Subject + ${word.toLowerCase()} + base verb`,
        `Negative: Subject + ${negative} + base verb`,
        `Question: ${word} + subject + base verb?`,
        ...uses.map(([use, example]) => `${use} ${example}`),
      ].join("\n"),
    ),
  }[skill];
  const exercises = core[skill].flatMap(({ instruction, questions }) => [
    instruction,
    ...(skill === "vocabulary" && instruction.startsWith("A.")
      ? [
          `Column A: ${matchColumns[0].join(", ")}
Column B: ${matchColumns[1].join(", ")}`,
        ]
      : []),
    ...questions.map((prompt, index) => question(instruction[0], index, prompt, instruction)),
  ]);
  return [heading, ...reference, ...exercises].join("\n\n");
}
