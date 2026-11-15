import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const origin = process.argv[3] ?? "http://localhost:8080";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
const skills = ["reading", "vocabulary", "grammar", "listening", "speaking", "writing"];
const counts = {
  8: [32, 24, 25, 8, 6, 7],
  9: [22, 10, 15, 8, 4, 1],
  10: [20, 19, 20, 9, 6, 6],
  11: [28, 18, 30, 10, 6, 9],
  12: [17, 50, 50, 12, 5, 10],
};
try {
  for (const unit of [8, 9, 10, 11, 12])
    for (const [index, skill] of skills.entries()) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
      page.on("pageerror", (error) => errors.push(`${unit}/${skill}: ${error.message}`));
      let paidRequests = 0;
      page.on("request", (request) => {
        if (/\/api\/(g11-check|answer-hint|g11-roleplay)/.test(request.url())) paidRequests++;
      });
      await page.goto(`${origin}/grade-11/${unit}/${skill}`, { waitUntil: "networkidle" });
      await page
        .getByText(`Progress: 0 / ${counts[unit][index]} answered`, { exact: true })
        .waitFor();
      assert.ok(
        await page.getByRole("button", { name: "Check Answer", exact: true }).count(),
        `${unit}/${skill} checks`,
      );
      assert.equal(
        await page.locator('img[src*="/grade11/upper/"]').count(),
        0,
        `${unit}/${skill} must be text only`,
      );
      await page.getByRole("article", { name: `Unit ${unit} ${skill} textbook text` }).waitFor();
      const exercise = page.getByRole("region", { name: `${skill} exercises`, exact: true });
      if (skill === "listening") {
        await exercise.getByRole("button", { name: "Reveal Answer", exact: true }).first().click();
        await page.getByText("Recording transcript · Suggested answer", { exact: true }).waitFor();
        assert.equal(await page.locator(`audio[src="/grade11/audio/unit${unit}.mp3"]`).count(), 1);
      }
      if (unit === 10 && skill === "reading")
        await page.getByText("Others", { exact: true }).waitFor();
      if (unit === 11 && skill === "vocabulary") {
        assert.equal(await exercise.getByRole("combobox").count(), 8);
        await exercise.getByRole("combobox").nth(5).selectOption("state");
        await exercise.getByRole("button", { name: "Check Answer", exact: true }).nth(5).click();
        await page.getByRole("status").filter({ hasText: "✅" }).waitFor();
      }
      if (unit === 9 && skill === "writing") {
        await page
          .getByText(/My fourteen-year-old sister seems/)
          .first()
          .waitFor();
        const field = exercise.getByRole("textbox");
        await field.fill("Hi Hsu Latt, I understand your concern.");
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(
          await page
            .getByRole("region", { name: "writing exercises" })
            .getByRole("textbox")
            .inputValue(),
          "Hi Hsu Latt, I understand your concern.",
        );
      }
      if (unit === 12 && skill === "writing") {
        await page.getByRole("textbox").fill("Teenagers need to communicate with their parents.");
        await page.getByText("Words: 7 · 200–250", { exact: true }).waitFor();
        await page.locator('[id="12-composition"]').screenshot({
          animations: "disabled",
          path: "/workspace/work/units8-12-writing-desktop.png",
        });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `mobile overflow ${unit}/${skill}`,
      );
      if (unit === 11 && skill === "vocabulary")
        await page.locator('[id="11-reporting"]').screenshot({
          animations: "disabled",
          path: "/workspace/work/units8-12-vocabulary-mobile.png",
        });
      assert.equal(paidRequests, 0, `No automatic paid requests ${unit}/${skill}`);
      await page.close();
      console.log(`PASS ${unit}/${skill} desktop + mobile`);
    }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
