import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve(process.argv[2]))("playwright");
const base = process.argv[3] ?? "http://127.0.0.1:8091";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Admin Login" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Generate missing (up to 3)" }).count(), 0);
  for (const path of [
    "/api/audio-manager",
    "/api/audio-manager?format=zip&grade=11",
    "/api/audio-manager?version=00000000-0000-4000-8000-000000000001",
  ])
    assert.equal((await page.request.get(base + path)).status(), 401);
  assert.equal(
    (await page.request.post(`${base}/api/audio-manager`, { data: { action: "work" } })).status(),
    401,
  );
  assert.ok([401, 503].includes((await page.request.post(`${base}/api/audio-worker`)).status()));
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  );
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "/tmp/audio-manager-admin-guest.png", fullPage: true });
  console.log(
    "PASS: real mobile browser admin gate, hidden generation UI, private asset/ZIP endpoints and worker authorization. No hosted admin login or generation attempted.",
  );
} finally {
  await browser.close();
}
