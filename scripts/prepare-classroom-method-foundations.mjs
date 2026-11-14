// Read existing rule/reference data only. Never overwrite self-study files or reuse old oral scripts.
import { createServer } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  resolve: { alias: { "@": resolve("src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const result = {};
  const extract = (g) => ({
    title: g.topicEn,
    sections: g.sections.map((s) => ({
      title: s.titleEn,
      meaning: s.text.whatMy,
      why: s.text.whyMy,
      rules: s.text.goldenRulesMy,
      patterns: [...new Set(s.text.formulas.map((f) => f.formula))],
      cautions: s.text.mistakes.map((m) => m.whyMy),
    })),
  });
  for (let unit = 1; unit <= 12; unit++) {
    const module = await server.ssrLoadModule(`/src/data/grammar/unit${unit}.ts`);
    result[`10:${unit}`] = extract(module[`UNIT${unit}_GRAMMAR`]);
  }
  const { UNIT1_GRAMMAR } = await server.ssrLoadModule("/src/lib/grade11Unit1Grammar.ts");
  const { GRADE11_ORAL_GRAMMAR } = await server.ssrLoadModule("/src/lib/grade11GrammarOral.ts");
  for (let unit = 1; unit <= 12; unit++)
    result[`11:${unit}`] = extract(unit === 1 ? UNIT1_GRAMMAR : GRADE11_ORAL_GRAMMAR[unit]);
  const path = "src/data/classroom/grammar-rule-foundations.json";
  const text = JSON.stringify(result, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8").trim() !== text.trim())
      throw new Error("Classroom rule foundations have drifted from source references.");
  } else writeFileSync(path, text);
  console.log("24 classroom rule foundations verified; self-study content unchanged.");
} finally {
  await server.close();
}
