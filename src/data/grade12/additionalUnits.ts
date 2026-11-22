import type { Grade12Skill } from "./syllabus";
import type { TextbookExercise, TextbookItem } from "./unit2";
import unit5 from "./unit5.txt?raw";
import unit6 from "./unit6.txt?raw";
import unit7 from "./unit7.txt?raw";
import unit8 from "./unit8.txt?raw";
import unit9 from "./unit9.txt?raw";
import unit10 from "./unit10.txt?raw";
import unit11 from "./unit11.txt?raw";
import unit12 from "./unit12.txt?raw";

const unit7DialogueAnswersMy = [
  "ပျက်နေသော ပုံနှိပ်စက်",
  "အီလက်ထရွန်းနစ်အမှိုက်",
  "ညစ်ညမ်းစေ",
  "အဆိပ်ရှိ စွန့်ပစ်ပစ္စည်း",
  "သေစေနိုင်သော ဓာတုပစ္စည်း",
  "မီးရှို့",
  "ထိခိုက်စေ",
  "ညစ်ညမ်းမှု",
];

type BilingualText = { en: string; my: string };
export type AdditionalExerciseGroup = {
  source: TextbookExercise;
  translation: { instruction: string; items: string[] };
  structure: string[];
  reference: BilingualText[];
  entries: (
    | { kind: "reference"; line: BilingualText }
    | { kind: "question"; item: TextbookItem; index: number }
  )[];
  informational: boolean;
  input?: "tick" | "personal";
};

// The heading markers preserve printed section and exercise order. A question
// line holds English, Burmese, suggested answer, choices, and a structure hint.
function readUnit(unit: number, raw: string) {
  const sections = {} as Record<Grade12Skill, { pages: string; groups: AdditionalExerciseGroup[] }>;
  const passage: (BilingualText & { heading: boolean })[] = [];
  const shadowing: BilingualText[] = [];
  let skill: Grade12Skill;
  let group: AdditionalExerciseGroup;
  for (const line of raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)) {
    const [en, my, answer, options, structure] = line
      .slice(1)
      .trim()
      .split("|")
      .map((field) => field.trim().replaceAll("\\n", "\n"));
    switch (line[0]) {
      case "#":
        skill = en as Grade12Skill;
        sections[skill] = { pages: my, groups: [] };
        break;
      case "@":
      case "^":
        passage.push({ en, my, heading: line[0] === "^" });
        break;
      case "~":
        shadowing.push({ en, my });
        break;
      case "!":
      case "?":
      case "+":
      case "=":
        group = {
          source: { instruction: en, items: [] },
          translation: { instruction: my, items: [] },
          reference: [],
          entries: [],
          structure: [],
          informational: line[0] === "?",
          input: line[0] === "+" ? "tick" : line[0] === "=" ? "personal" : undefined,
        };
        sections[skill!].groups.push(group);
        break;
      case ">": {
        const reference = { en, my };
        group!.reference.push(reference);
        group!.entries.push({ kind: "reference", line: reference });
        break;
      }
      case "-": {
        const item = {
          text: en,
          answer: answer || undefined,
          choices: options ? options.split(" · ") : undefined,
        };
        group!.entries.push({ kind: "question", item, index: group!.source.items.length });
        group!.source.items.push(item);
        group!.translation.items.push(my);
        group!.structure.push(structure || "");
        break;
      }
    }
  }
  const skills: Grade12Skill[] = [
    "reading",
    "vocabulary",
    "grammar",
    "listening",
    "speaking",
    "writing",
  ];
  return {
    sections,
    passage,
    shadowing:
      unit === 7
        ? sections.listening.groups[0].entries.slice(1).map((entry) =>
            entry.kind === "reference"
              ? entry.line
              : {
                  en: entry.item.text.replace(/\(\d+\) ___/, entry.item.answer ?? "___"),
                  my: sections.listening.groups[0].translation.items[entry.index].replace(
                    /\([၁၂၃၄၅၆၇၈၉၀]+\) ___/,
                    unit7DialogueAnswersMy[entry.index],
                  ),
                },
          )
        : shadowing,
    reading: passage.map(({ en }) => en),
    exercises: Object.fromEntries(
      skills.map((skill) => [
        skill,
        sections[skill].groups.map(({ source, reference, informational, structure }) => ({
          ...source,
          items: informational
            ? source.items.map(({ text }, index) => ({
                text: [text, structure[index]].filter(Boolean).join(" — "),
              }))
            : source.items,
          reference: reference.map(({ en }) => en).join("\n") || undefined,
        })),
      ]),
    ) as Record<Grade12Skill, TextbookExercise[]>,
    references: {} as Partial<Record<Grade12Skill, string[]>>,
  };
}

export const additionalUnits = {
  5: readUnit(5, unit5),
  6: readUnit(6, unit6),
  7: readUnit(7, unit7),
  8: readUnit(8, unit8),
  9: readUnit(9, unit9),
  10: readUnit(10, unit10),
  11: readUnit(11, unit11),
  12: readUnit(12, unit12),
};
export type AdditionalUnitNumber = keyof typeof additionalUnits;

export function isAdditionalUnit(unit: number): unit is AdditionalUnitNumber {
  return Object.hasOwn(additionalUnits, unit);
}
