import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const origin = process.argv[3] ?? "http://localhost:8080";
const profiles = JSON.parse(
  readFileSync("src/data/classroom/writing-teaching-profiles.json", "utf8"),
);
const grammar = JSON.parse(
  readFileSync("src/data/classroom/grammar-rule-foundations.json", "utf8"),
);
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const errors = [];
  for (const grade of [10, 11])
    for (let unit = 1; unit <= 12; unit++)
      for (const skill of ["grammar", "writing"]) {
        const page = await browser.newPage();
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`${origin}/class?grade=${grade}&unit=${unit}&skill=${skill}&start=true`, {
          waitUntil: "networkidle",
        });
        assert.equal(
          await page.getByRole("combobox", { name: "Classroom grade" }).inputValue(),
          String(grade),
        );
        assert.equal(
          await page.getByRole("combobox", { name: "Classroom unit" }).inputValue(),
          String(unit),
        );
        if (grade === 10 && unit === 1) {
          await page
            .getByRole("region", { name: `${skill[0].toUpperCase() + skill.slice(1)} teaching` })
            .waitFor();
        } else {
          const title =
            skill === "grammar"
              ? grammar[`${grade}:${unit}`].title
              : profiles.find((p) => p.grade === grade && p.unit === unit).title;
          await page.getByRole("heading", { name: title, exact: true }).waitFor();
          await page.getByText("ဆရာပြောစာသားအပြည့် ကြည့်မယ်", { exact: true }).waitFor();
        }
        assert.equal(
          await page
            .getByRole("button", { name: "ကျောင်းသားသင်ကြားမှု ဖွင့်မယ်", exact: true })
            .count(),
          0,
        );
        await page.close();
      }
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/class?grade=11&unit=12&skill=writing&start=true`, {
    waitUntil: "networkidle",
  });
  await page.getByLabel("Classroom whiteboard").waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
    "Classroom mobile overflow",
  );
  await page.goto(`${origin}/practice/1/grammar`, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: /Text Explanation/ })
    .first()
    .waitFor();
  assert.equal(
    await page.getByRole("region", { name: "Choose AI classroom lesson" }).count(),
    0,
    "Self-study must not receive classroom selector",
  );
  await page.goto(`${origin}/grade-11/12/writing`, { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "Unit 12 skills" }).waitFor();
  assert.equal(await page.getByRole("region", { name: "Choose AI classroom lesson" }).count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "All 48 classroom routes, classroom-only controls, mobile layout, and unchanged self-study entry points passed.",
  );
} finally {
  await browser.close();
}
