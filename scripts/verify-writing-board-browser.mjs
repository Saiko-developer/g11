import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const origin = process.argv[3] ?? "http://localhost:8080";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const errors = [];
  for (const [grade, unit] of [10, 11].flatMap((grade) =>
    Array.from({ length: 12 }, (_, i) => [grade, i + 1]),
  )) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/class?grade=${grade}&unit=${unit}&skill=writing&start=true`, {
      waitUntil: "networkidle",
    });
    const board = page.getByLabel("Classroom whiteboard");
    await board.waitFor();
    if (
      ![
        [10, 1],
        [10, 10],
        [11, 8],
        [11, 12],
      ].some(([g, u]) => g === grade && u === unit)
    ) {
      assert.match(await board.innerText(), /Writing/);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
      );
      await page.close();
      continue;
    }
    const notes = page.getByRole("region", { name: "Writing support notes" });
    const points = await notes.innerText();
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Next", exact: true }).click();
    assert.notEqual(await notes.innerText(), points);
    for (let i = 4; i < 8; i++)
      await page.getByRole("button", { name: "Next", exact: true }).click();
    if (grade === 10 && unit === 1) {
      assert.match(await notes.innerText(), /present simple/);
      assert.match(await notes.innerText(), /Japan/);
      await board.screenshot({
        animations: "disabled",
        path: "/workspace/work/writing-board-grammar-desktop.png",
      });
      const transcript = board.locator("details");
      assert.equal(await transcript.getAttribute("open"), null);
      await transcript.locator("summary").click();
      assert.match(await transcript.innerText(), /နိုင်ငံက ဘာဖြစ်တယ်/);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      true,
    );
    await board.screenshot({
      animations: "disabled",
      path: `/workspace/work/writing-board-g${grade}-u${unit}-mobile.png`,
    });
    assert.equal(await page.getByRole("button", { name: /generate|approve/i }).count(), 0);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "All 24 Writing routes passed: both classroom players, real phase changes, topic-specific grammar notes, collapsed narration, mobile fit, no exposed admin actions or page errors. Guest checks do not generate paid audio.",
  );
} finally {
  await browser.close();
}
