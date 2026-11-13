// Browser smoke checks against a local server. No real login, AI, or payment calls.
// node scripts/verify-step2-browser.mjs /tmp/saya-browser/package.json http://localhost:8080
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve(process.argv[2]));
const { chromium } = require("playwright");
const base = process.argv[3] ?? "http://localhost:8080";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.goto(`${base}/classroom/10`, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Language: Skill, Tool, Form, and Function", exact: true })
    .waitFor();
  // The teacher introduction and authored explanation are normal lesson content, not hidden help.
  await page.getByText(/ကဲ သားတို့သမီးတို့ရေ၊ ဒီနေ့ ဆရာတို့ Language/).waitFor();
  await page.getByRole("checkbox", { name: /Manual Mode/ }).check();
  // Skipping a step must leave comprehension locked, even after reaching the end.
  await page.getByRole("button", { name: "Next", exact: true }).click();
  for (let i = 1; i < 64; i++) {
    await page.getByRole("button", { name: /ဖတ်ပြီး/ }).click();
    if (i === 2) await page.getByText(/Your answer is acceptable/).waitFor();
  }
  assert.equal(
    await page.getByText("The four language skills are: ___________.", { exact: true }).count(),
    0,
  );
  for (let i = 0; i < 63; i++)
    await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByRole("button", { name: /ဖတ်ပြီး/ }).click();
  await page.getByText("64 / 64 steps", { exact: true }).waitFor();
  await page.getByText("The four language skills are: ___________.", { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
  );
  await page.getByRole("main").getByRole("link", { name: "Grade 11", exact: true }).click();
  await page.getByRole("heading", { name: "The Ayeyarwady Dolphins", exact: true }).waitFor();
  await page.getByText("0 / 152 steps", { exact: true }).waitFor();
  const response = await page.request.post(`${base}/api/classroom`, {
    data: { grade: 10, action: "ask", question: "hello" },
  });
  assert.equal(response.status(), 401);
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "အတန်းစမယ်", exact: true }).click();
  await page.getByRole("heading", { name: "ဒီနေ့အတန်းအတွက် အဆင်သင့်ပဲလား?" }).waitFor();
  await page.getByRole("button", { name: "အတန်းပုံစံ ကြည့်မယ်" }).click();
  await page.getByLabel("Classroom whiteboard").waitFor();
  assert.equal(await page.getByRole("button", { name: "Next", exact: true }).count(), 0);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
  );
  const planResponse = await page.request.get(`${base}/api/study-plan`);
  assert.equal(planResponse.status(), 401);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: both-grade routes, mobile layout, manual completion/skip gating, grade isolation, API authentication, no browser exceptions.",
  );
} finally {
  await browser.close();
}
