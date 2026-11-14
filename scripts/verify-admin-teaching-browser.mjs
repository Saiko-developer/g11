import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const base = process.argv[3] ?? "http://localhost:8080";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/teaching-setup`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Admin Login" }).waitFor();
  assert.match(page.url(), /\/admin\?panel=teaching/);
  assert.equal(
    await page.getByRole("button", { name: "ကျောင်းသားသင်ကြားမှု ဖွင့်မယ်" }).count(),
    0,
  );
  await page.goto(`${base}/class?grade=10&unit=1&skill=grammar&start=true`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("region", { name: "Grammar teaching" }).waitFor();
  assert.equal(
    await page
      .getByText("အဆင်သင့်အသံကို ကျောင်းသားများ ပြန်သုံးနိုင်ပါမယ်။", { exact: false })
      .count(),
    0,
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  const result = await page.request.post(`${base}/api/classroom`, {
    data: { grade: 10, action: "warm_audio", cursor: 0 },
  });
  assert.equal(result.status(), 401);
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: legacy setup redirects into protected admin panel, guests cannot approve/generate audio, classroom loads without removed text, mobile layout fits.",
  );
} finally {
  await browser.close();
}
