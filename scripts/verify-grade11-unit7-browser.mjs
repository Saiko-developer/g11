import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const origin = process.argv[3] ?? "http://localhost:8080";
try {
  const errors = [];
  for (const skill of ["reading", "vocabulary", "grammar", "listening", "speaking", "writing"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${origin}/grade-11/7/${skill}`, { waitUntil: "networkidle" });
    await page.getByText(/Progress: 0 \/ /).waitFor();
    assert.equal(await page.locator('img[src*="/grade11/upper/"]').count(), 0, skill);
    assert.equal(await page.getByLabel("Original textbook", { exact: true }).count(), 0, skill);
    if (skill === "reading") {
      assert.match(
        await page.getByRole("article", { name: "Unit 7 reading passage" }).innerText(),
        /glycogen/,
      );
      const group = page.locator('[data-exercise="7-comprehension"]');
      assert.equal(
        await group.getByRole("button", { name: "Check Answer", exact: true }).count(),
        10,
      );
      await group.getByRole("button", { name: "Reveal Answer", exact: true }).first().click();
      await group.getByText(/The systems of the human body are made up/).waitFor();
      assert.equal(
        await page.locator('[data-exercise="7-functions"]').getByRole("textbox").count(),
        5,
      );
      await page
        .getByRole("article", { name: "Unit 7 reading passage" })
        .screenshot({ animations: "disabled", path: "/workspace/work/unit7-reading-desktop.png" });
    }
    if (skill === "vocabulary") {
      assert.equal(await page.getByRole("radio").count(), 28);
      await page.getByRole("radio").first().check();
      await page.getByRole("button", { name: "Check Answer", exact: true }).first().click();
      await page.getByRole("status").filter({ hasText: "✅" }).waitFor();
      await page
        .locator('[data-question="7-homonyms-1"]')
        .screenshot({
          animations: "disabled",
          path: "/workspace/work/unit7-vocabulary-desktop.png",
        });
    }
    if (skill === "grammar") {
      assert.equal(await page.locator("[data-grammar-question]").count(), 22);
      assert.equal(
        await page.getByRole("button", { name: "Oral Explanation", exact: true }).count(),
        2,
      );
      await page.getByRole("button", { name: "Text Explanation", exact: true }).first().click();
      await page
        .getByText(/They expected that about 1,000 people/, { exact: false })
        .first()
        .waitFor();
    }
    if (skill === "listening") {
      assert.equal(await page.getByRole("textbox").count(), 10);
      await page.getByRole("textbox").first().fill("seen");
      await page.getByRole("button", { name: "Check Answer", exact: true }).first().click();
      await page.getByText("✅ မှန်ပါတယ်! တော်လိုက်တာ။", { exact: true }).waitFor();
    }
    if (skill === "speaking") {
      assert.equal(await page.getByRole("textbox").count(), 5);
      await page
        .getByRole("heading", {
          name: "Describing what you did to overcome the problem",
          exact: true,
        })
        .waitFor();
    }
    if (skill === "writing") {
      await page.getByText("extra fat in liver", { exact: true }).waitFor();
      await page
        .getByText("apples, carrots, green and leafy vegetables, lemon and green tea", {
          exact: true,
        })
        .waitFor();
      await page.getByRole("textbox").fill("The liver is an important organ.");
      await page.getByText("Words: 6", { exact: true }).waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      true,
      `mobile overflow ${skill}`,
    );
    if (skill === "writing")
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: "/workspace/work/unit7-writing-mobile.png",
      });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "Unit 7 browser checks passed: all six text-first skills, no textbook scan UI, original task counts, local checks/reveals, grammar text/oral controls, real writing notes, mobile fit, no page errors. No paid AI generation or hosted student writes.",
  );
} finally {
  await browser.close();
}
