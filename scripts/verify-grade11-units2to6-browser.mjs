import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const origin = process.argv[3] ?? "http://localhost:8080";
const cases = [
  [2, "reading"],
  [2, "speaking"],
  [3, "reading"],
  [3, "vocabulary"],
  [3, "speaking"],
  [3, "writing"],
  [4, "reading"],
  [4, "vocabulary"],
  [4, "writing"],
  [5, "reading"],
  [6, "reading"],
  [6, "vocabulary"],
  [6, "listening"],
  [6, "speaking"],
  [6, "writing"],
];
try {
  const errors = [];
  for (const [unit, skill] of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${origin}/grade-11/${unit}/${skill}`, { waitUntil: "networkidle" });
    const id = { 2: "2A-30", 3: "3A-35", 4: "4A-13", 5: "5A-82" }[unit];
    if (skill === "reading" && id) {
      const exercise = page.locator(`[data-exercise="${id}"]`);
      await exercise.waitFor();
      const count = await exercise.getByRole("textbox").count();
      assert.equal(
        await exercise.getByRole("button", { name: "Check Answer", exact: true }).count(),
        count,
      );
      assert.equal(
        await exercise.getByRole("button", { name: "Reveal Answer", exact: true }).count(),
        count,
      );
      assert.equal(
        await exercise.getByRole("button", { name: "Check Answer with AI", exact: true }).count(),
        0,
      );
      await exercise.getByRole("button", { name: "Reveal Answer", exact: true }).first().click();
      assert.equal(
        await exercise.getByRole("button", { name: "Hide Answer", exact: true }).count(),
        1,
      );
    }
    if (unit === 2 && skill === "speaking") {
      assert.equal(
        await page
          .getByText(
            "1. Learn new skills such as communication skills, professional skills and IT skills.",
            { exact: true },
          )
          .count(),
        1,
      );
      assert.equal(
        await page
          .locator('[data-exercise="2D-18"]')
          .getByRole("button", { name: "Practise with AI", exact: true })
          .count(),
        1,
      );
    }
    if (unit === 3 && skill === "vocabulary") {
      assert.equal(await page.getByText("1. think back", { exact: true }).count(), 1);
      assert.equal(await page.getByText(/View original textbook page/).count(), 0);
      assert.equal(await page.locator('[data-exercise="3B-12"]').getByRole("textbox").count(), 8);
    }
    if (unit === 3 && skill === "speaking")
      assert.equal(
        await page
          .locator('[data-exercise="3D-33"]')
          .getByRole("button", { name: "Practise with AI", exact: true })
          .count(),
        1,
      );
    if (skill === "writing" && [3, 4, 6].includes(unit))
      assert.equal(
        await page
          .getByRole("button", { name: /Translate whole section|Show Myanmar Translation/ })
          .count(),
        0,
      );
    if (unit === 6 && skill === "listening") {
      const exercise = page.locator('[data-exercise="6D-0"]');
      await exercise.getByRole("textbox").first().fill("negative");
      await exercise.getByRole("button", { name: "Check Answer", exact: true }).first().click();
      await exercise.getByText("✅ မှန်ပါတယ်! တော်လိုက်တာ။", { exact: true }).waitFor();
      await exercise.getByRole("button", { name: "Reveal Answer", exact: true }).nth(1).click();
      await exercise.getByText(/^Answer: local people/).waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      true,
      `mobile overflow ${unit}/${skill}`,
    );
    if (
      [
        [3, "vocabulary"],
        [6, "reading"],
        [6, "writing"],
      ].some(([u, s]) => u === unit && s === skill)
    )
      await page.screenshot({
        animations: "disabled",
        path: `/workspace/work/g11-${unit}-${skill}-mobile.png`,
        fullPage: true,
      });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "15 requested Grade 11 views passed: per-question controls/reveals, local listening checks, dialogue AI launchers, preserved source content, direct translations, mobile fit, no page errors. No paid AI or authenticated writes used.",
  );
} finally {
  await browser.close();
}
