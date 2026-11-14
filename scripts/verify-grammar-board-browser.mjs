import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const origin = process.argv[3] ?? "http://localhost:8080";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${origin}/class?grade=10&unit=1&skill=grammar&start=true`, {
    waitUntil: "networkidle",
  });
  const board = page.getByLabel("Classroom whiteboard");
  await board.waitFor();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("region", { name: "Sentence structure" }).waitFor();
  assert.match(await board.innerText(), /My son/);
  assert.match(await board.innerText(), /a musician/);
  await board.screenshot({
    animations: "disabled",
    path: "/workspace/work/grammar-board-example-desktop.png",
  });
  for (let i = 5; i < 10; i++)
    await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("region", { name: "Grammar comparison" }).waitFor();
  assert.match(await board.innerText(), /Identifying/);
  assert.match(await board.innerText(), /Extra information/);
  await board.screenshot({
    animations: "disabled",
    path: "/workspace/work/grammar-board-commas-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  await board.screenshot({
    animations: "disabled",
    path: "/workspace/work/grammar-board-mobile.png",
  });
  await page.goto(`${origin}/class?grade=11&unit=2&skill=grammar&start=true`, {
    waitUntil: "networkidle",
  });
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("region", { name: "Rule structure" }).waitFor();
  assert.match(await board.innerText(), /Subject/);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  await board.screenshot({
    animations: "disabled",
    path: "/workspace/work/grammar-board-formula-mobile.png",
  });
  assert.deepEqual(errors, []);
  console.log(
    "Grammar board browser checks passed: real classroom phase changes, labelled sentence parts, comma comparison, Grade 11 formula slots, mobile fit and no page errors.",
  );
} finally {
  await browser.close();
}
