import { it, expect } from "vitest";
import { audioCatalog } from "./catalog.server";
it("inventories canonical authored clips without changing scripts or generating audio", async () => {
  const clips = await audioCatalog();
  expect(new Set(clips.map((c) => c.id)).size).toBe(clips.length);
  expect(clips.filter((c) => c.source === "walkthrough")).toHaveLength(249);
  for (let unit = 1; unit <= 12; unit++) {
    const enabled = clips.filter((c) => c.pilot && c.unit === unit);
    expect(enabled.some((c) => c.grade === 10 && c.source === "classroom")).toBe(true);
    expect(enabled.some((c) => c.source === "walkthrough")).toBe(true);
    expect(enabled.some((c) => c.source === "classroom")).toBe(true);
  }
  expect(clips.filter((c) => c.pilot).every((c) => c.section === "grammar")).toBe(true);
  expect(clips.filter((c) => c.pilot && c.source === "walkthrough")).toHaveLength(249);
  expect(clips.filter((c) => c.pilot && c.source === "classroom")).toHaveLength(280);
  expect(
    clips.filter((c) => c.source === "classroom" && c.grade === 10 && c.section === "grammar"),
  ).toHaveLength(132);
  expect(
    clips.filter((c) => c.source === "classroom" && c.grade === 11 && c.section === "grammar"),
  ).toHaveLength(148);
  expect(
    clips.every((c) => /^[a-f0-9]{64}$/.test(c.script_hash) && c.text.trim() && c.script_version),
  ).toBe(true);
});
