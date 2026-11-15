// Read-only source audit. Writes preparation metadata, never textbook content or live approvals.
import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const skills = ["reading", "vocabulary", "grammar", "listening", "speaking", "writing"];
const letter = {
  reading: "A",
  vocabulary: "B",
  grammar: "C",
  listening: "D",
  speaking: "D",
  writing: "E",
};
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const audio11 = read("src/data/grade11/listeningAudio.json");
const rows = [];
function questionRecords(value, output = new Map()) {
  if (!value || typeof value !== "object") return output;
  if (typeof value.question === "string") output.set(`${value.id ?? ""}:${value.question}`, value);
  if (value.t === "q" && typeof value.x === "string") output.set(value.id, value);
  if (typeof value.prompt === "string" && value.id) output.set(value.id, value);
  for (const child of Object.values(value))
    if (child && typeof child === "object") questionRecords(child, output);
  return output;
}
for (const grade of [10, 11])
  for (let unit = 1; unit <= 12; unit++) {
    const file =
      grade === 10
        ? `src/data/textbookUnit${unit}.json`
        : `src/data/grade11/textbook/unit${unit}.json`;
    const source = read(file);
    for (const skill of skills) {
      let records = [],
        scans = [],
        texts = 0,
        provided = 0,
        suggested = 0;
      const sourceFiles = [file];
      const supports = [];
      if (grade === 10) {
        records = [...(source.sections ?? []), ...(source.lessons ?? [])].filter((s) =>
          new RegExp(`^${unit}${letter[skill]}(?:\\b|[ -])`, "i").test(
            s.code ?? s.lesson ?? s.id ?? "",
          ),
        );
        for (const record of records) {
          texts += record.reading_passage?.paragraphs?.length ?? 0;
          if (record.intro || record.introMy || record.topic || record.writing_task) texts++;
        }
        const supplement = `src/data/unit${unit}Supplement.ts`;
        if (existsSync(supplement) && ["reading", "vocabulary", "grammar"].includes(skill))
          supports.push(supplement);
        if (skill === "grammar" && existsSync(`src/data/grammar/unit${unit}.ts`))
          supports.push(`src/data/grammar/unit${unit}.ts`);
        if (["listening", "speaking"].includes(skill))
          supports.push("src/data/listeningScripts.ts");
      } else if (Array.isArray(source)) {
        records = source.filter((s) => s.code === `${unit}${letter[skill]}`);
        for (const record of records)
          for (const block of record.blocks ?? []) {
            if (block.t === "scan") scans.push(block.scanPage ?? block.sourcePage);
            else if (block.area === "lesson" && block.x?.trim()) texts++;
          }
      } else {
        const section = source.skills[skill];
        records = section?.groups ?? [];
        scans = (section?.sources ?? []).map((s) => s.page);
        // Exercise prompts are not a transcription of the scanned teaching material.
        if (unit === 7) {
          const transcribed = "src/data/grade11/textbook/unit7-text.json";
          const text = read(transcribed);
          const notes = skill === "vocabulary" ? text.vocabularyNotes : text[skill];
          texts = skill === "listening" ? 1 : notes.length;
          sourceFiles.push(transcribed);
          scans = [];
        } else if (unit >= 8 && unit <= 12) {
          const transcribed = "src/data/grade11/textbook/upper-lesson-text.json";
          const notes = "src/data/grade11/textbook/upper-study-support.json";
          texts = read(transcribed).units[unit][skill].length;
          sourceFiles.push(transcribed, notes);
          scans = [];
        }
      }
      const questions = [...questionRecords(records).values()];
      const origins = new Set();
      for (const q of questions) {
        if (q.suggested_answer || q.suggestedAnswer) suggested++;
        else if (q.answer || q.correct_answer) provided++;
      }
      if (grade === 11) {
        for (const suffix of ["keys", "answer"]) {
          const keyFile = `src/data/grade11/textbook/unit${unit}-${suffix}.json`;
          if (!existsSync(keyFile)) continue;
          const keys = read(keyFile);
          const map = keys.items ?? keys;
          const matching = questions
            .map((q) => map[q.id])
            .filter((key) => key && typeof key === "object" && key.answer);
          if (!matching.length) continue;
          sourceFiles.push(keyFile);
          for (const answer of matching) {
            if (answer.kind === "suggested" || /suggested/i.test(answer.origin ?? "")) suggested++;
            else provided++;
            if (answer.origin) origins.add(answer.origin);
          }
          break;
        }
      }
      const audioUrl = ["listening", "speaking"].includes(skill)
        ? grade === 10
          ? `/audio/unit${unit}.mp3`
          : (audio11.find((a) => a.unit === unit)?.src ?? null)
        : null;
      const audioPath = audioUrl ? `public${audioUrl}` : null;
      const audio =
        audioPath && existsSync(audioPath)
          ? { url: audioUrl, path: audioPath, bytes: statSync(audioPath).size }
          : null;
      const teacherScript =
        grade === 10 && unit === 1 && skill === "reading"
          ? "src/data/classroom/grade10-unit1-teacher-script.json"
          : grade === 11 && unit === 1 && skill === "reading"
            ? "src/data/classroom/grade11-unit1-reading.json"
            : null;
      rows.push({
        id: `g${grade}-u${unit}-${skill}`,
        grade,
        unit,
        skill,
        sourceFiles: sourceFiles.map((path) => ({ path, sha256: hash(path) })),
        supportFiles: supports,
        sourceFormat: scans.length
          ? texts
            ? "mixed"
            : "scan"
          : records.length
            ? "text"
            : "missing",
        lessonTextBlocks: texts,
        scanPages: [...new Set(scans)].sort((a, b) => a - b),
        exerciseCount: questions.length,
        providedAnswers: provided,
        suggestedAnswers: suggested,
        answerOrigins: [...origins],
        audio,
        teacherScript,
        classroomDelivery:
          grade === 10 && unit === 1 && skill === "reading" ? "current-pilot" : "needs-preparation",
      });
    }
  }
if (rows.length !== 144 || new Set(rows.map((r) => r.id)).size !== 144)
  throw new Error("Incomplete curriculum inventory");
const output = "src/data/classroom/curriculum-inventory.json";
const json = JSON.stringify(rows, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (!existsSync(output) || readFileSync(output, "utf8") !== json)
    throw new Error(
      "Curriculum inventory is stale; run node scripts/prepare-classroom-curriculum.mjs",
    );
} else writeFileSync(output, json);
const counts = Object.fromEntries(
  ["text", "mixed", "scan", "missing"].map((kind) => [
    kind,
    rows.filter((r) => r.sourceFormat === kind).length,
  ]),
);
console.log(
  JSON.stringify({
    sections: rows.length,
    sourceFormats: counts,
    originalAudio: rows.filter((r) => r.audio).length,
    currentAutomaticPilot: 1,
  }),
);
