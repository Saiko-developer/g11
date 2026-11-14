import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const origin = process.argv[3] ?? "http://localhost:8080";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  for (const viewport of [
    { width: 1365, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${origin}/#lessons`, { waitUntil: "networkidle" });
    const start = page.getByRole("link", { name: "အတန်းစမယ် / ဆက်သင်မယ်", exact: true });
    await start.waitFor();
    assert.match(await start.getAttribute("href"), /grade=10/);
    await start.click();
    await page.waitForURL(/\/class\?/);
    await page.waitForLoadState("networkidle");
    await page.getByRole("navigation", { name: "Unit teaching sections" }).waitFor();
    assert.equal(await page.getByText("ဒီနေ့အတန်းပြီးပါပြီ", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Grammar", exact: true }).click();
    await page.getByRole("region", { name: "Grammar teaching" }).waitFor();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByLabel("Teaching notes").waitFor();
    assert.equal(
      await page.getByRole("button", { name: "ကျောင်းသားသင်ကြားမှု ဖွင့်မယ်" }).count(),
      0,
    );
    await page.getByRole("button", { name: /Homework/ }).click();
    await page.getByRole("heading", { name: "Exam Practice Homework", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Homework တင်မယ်" }).count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      true,
      "Mobile horizontal overflow",
    );
    await page.goto(`${origin}/grade-11/unit-1`, { waitUntil: "networkidle" });
    await page
      .getByRole("heading", { name: "The Ayeyarwady Dolphins", exact: true })
      .first()
      .waitFor();
    assert.equal(
      await page.getByRole("navigation", { name: "Unit 1 skills" }).getByRole("link").count(),
      6,
    );
    await page.close();
  }
  const request = await browser.newContext();
  const unauth = await request.request.get(`${origin}/api/unit-classroom?grade=10&unit=1`);
  assert.equal(unauth.status(), 401);
  await request.close();
  console.log(
    "Unit teaching browser smoke passed: Unit start link, six sections, notes, homework lock, no student admin controls, Grade 11 self-study, desktop/mobile, anonymous API rejection.",
  );
} finally {
  await browser.close();
}
