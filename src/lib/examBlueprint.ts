/**
 * Exam Builder blueprint: which sections exist, their marks and time,
 * and how a custom selection turns into total marks and minutes.
 * Shared by the Exam Builder page, the mock-exam page and /api/mock-exam.
 * Grade 10 full paper = 95 marks; Grades 11 and 12 full paper = 100 marks (Section IX essay is 15).
 */
export type SectionId = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII" | "IX";
export type Grade = 10 | 11 | 12;

export function parseExamGrade(value: unknown): Grade | undefined {
  if (value === 11 || value === "11") return 11;
  if (value === 12 || value === "12") return 12;
  return undefined; // Grade 10 is the default for legacy links and papers.
}

export type SectionSpec = {
  id: SectionId;
  label: string;
  labelMy: string;
  /** Marks when the section runs at full size. */
  marks: number;
  minutes: number;
  /** Sections I–III let the user pick 5 or 10 questions (1 mark each). */
  countable: boolean;
};

export const SECTION_SPECS: SectionSpec[] = [
  {
    id: "I",
    label: "Vocabulary Completion",
    labelMy: "ဝေါဟာရ ကွက်လပ်ဖြည့်",
    marks: 10,
    minutes: 10,
    countable: true,
  },
  {
    id: "II",
    label: "Multiple Choice Vocabulary",
    labelMy: "အဖြေရွေး (MCQ)",
    marks: 10,
    minutes: 10,
    countable: true,
  },
  {
    id: "III",
    label: "Sentence Transformation (Grammar)",
    labelMy: "ဝါကျပြောင်း Grammar",
    marks: 10,
    minutes: 15,
    countable: true,
  },
  {
    id: "IV",
    label: "Verse & Textbook Questions",
    labelMy: "ကဗျာနှင့် သင်ခန်းစာမေးခွန်းများ",
    marks: 10,
    minutes: 10,
    countable: false,
  },
  {
    id: "V",
    label: "Reading Passage A",
    labelMy: "စာဖတ်ခန်း A",
    marks: 10,
    minutes: 15,
    countable: false,
  },
  {
    id: "VI",
    label: "Extended Reading Passage B",
    labelMy: "စာဖတ်ခန်း B",
    marks: 15,
    minutes: 20,
    countable: false,
  },
  {
    id: "VII",
    label: "Functional English (Dialogues)",
    labelMy: "စကားပြော",
    marks: 10,
    minutes: 10,
    countable: false,
  },
  {
    id: "VIII",
    label: "Guided Writing (Letter)",
    labelMy: "ပေးစာ",
    marks: 10,
    minutes: 15,
    countable: false,
  },
  {
    id: "IX",
    label: "Free Composition (Essay)",
    labelMy: "စာစီစာကုံး",
    marks: 10,
    minutes: 15,
    countable: false,
  },
];

/** Grades 11 and 12: Section V is the textbook (seen) passage, Section IX essay is 15 marks. */
export const G11_SECTION_SPECS: SectionSpec[] = SECTION_SPECS.map((s) =>
  s.id === "IV"
    ? { ...s, label: "Verse & Textbook Questions", labelMy: "ကဗျာနှင့် သင်ခန်းစာမေးခွန်းများ" }
    : s.id === "V"
      ? { ...s, label: "Textbook Reading Passage (Seen)", labelMy: "သင်ခန်းစာ စာဖတ်ခန်း" }
      : s.id === "IX"
        ? { ...s, marks: 15 }
        : s,
);

export const sectionSpecs = (grade: Grade = 10) =>
  grade === 10 ? SECTION_SPECS : G11_SECTION_SPECS;

export const ALL_SECTION_IDS = SECTION_SPECS.map((s) => s.id);

/** Writing word limits per grade (letter, essay). */
export const WRITING_LIMITS: Record<Grade, { letter: number; essay: number }> = {
  10: { letter: 200, essay: 300 },
  11: { letter: 300, essay: 500 },
  12: { letter: 300, essay: 500 },
};

export type ExamConfig = { units: number[]; sections: SectionId[]; count: 5 | 10; grade?: Grade };

export function isFullExam(c: ExamConfig) {
  return c.sections.length === ALL_SECTION_IDS.length && c.count === 10;
}

export function sectionMarks(spec: SectionSpec, count: 5 | 10) {
  return spec.countable ? count : spec.marks;
}

/** Total marks and minutes for a selection. A full paper runs for 180 minutes. */
export function examTotals(c: Pick<ExamConfig, "sections" | "count" | "grade">) {
  const grade = c.grade ?? 10;
  const chosen = sectionSpecs(grade).filter((s) => c.sections.includes(s.id));
  if (chosen.length === ALL_SECTION_IDS.length && c.count === 10)
    return { marks: grade === 10 ? 95 : 100, minutes: 180 };
  const marks = chosen.reduce((t, s) => t + sectionMarks(s, c.count), 0);
  const minutes = chosen.reduce(
    (t, s) => t + (s.countable && c.count === 5 ? Math.ceil(s.minutes / 2) : s.minutes),
    0,
  );
  return { marks, minutes };
}

/** Parse/clean a config coming from the URL or a request body. */
export function normalizeConfig(
  raw: { units?: unknown; sections?: unknown; count?: unknown; grade?: unknown },
  fallbackUnit = 1,
): ExamConfig {
  const grade = parseExamGrade(raw.grade);
  const lastUnit = grade === 12 ? 12 : 20;
  const toList = (v: unknown) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []);
  const units = [
    ...new Set(
      toList(raw.units)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= lastUnit),
    ),
  ].sort((a, b) => a - b);
  const sections = ALL_SECTION_IDS.filter((id) => toList(raw.sections).map(String).includes(id));
  const config: ExamConfig = {
    units: units.length
      ? units
      : [
          grade === 12 &&
          !(Number.isInteger(fallbackUnit) && fallbackUnit >= 1 && fallbackUnit <= lastUnit)
            ? 1
            : fallbackUnit,
        ],
    sections: sections.length ? sections : [...ALL_SECTION_IDS],
    count: Number(raw.count) === 5 ? 5 : 10,
  };
  if (grade) config.grade = grade;
  return config;
}

export function configKey(c: ExamConfig) {
  const base = `${c.units.join(",")}|${c.sections.join(",")}|${c.count}`;
  return `g${c.grade ?? 10}-v2|${base}`;
}
