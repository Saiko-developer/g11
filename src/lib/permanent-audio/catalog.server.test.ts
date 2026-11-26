import { it, expect } from "vitest";
import { audioCatalog, canEditAudioScript } from "./catalog.server";
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
  expect(clips.filter((c) => c.pilot && c.grade !== 10).every((c) => c.section === "grammar")).toBe(
    true,
  );
  expect(clips.filter((c) => c.pilot && c.source === "walkthrough")).toHaveLength(249);
  expect(
    clips.filter((c) => c.source === "classroom" && c.grade === 10 && c.section === "grammar"),
  ).toHaveLength(688);
  expect(
    clips.filter((c) => c.source === "classroom" && c.grade === 11 && c.section === "grammar"),
  ).toHaveLength(148);
  expect(
    clips.every((c) => /^[a-f0-9]{64}$/.test(c.script_hash) && c.text.trim() && c.script_version),
  ).toBe(true);
});

it("registers every authored Grade 12 grammar unit and exposes the right editable clips", async () => {
  const clips = await audioCatalog();
  const grade12 = clips.filter((clip) => clip.grade === 12);
  expect([...new Set(grade12.map((clip) => clip.unit))]).toEqual(
    Array.from({ length: 12 }, (_, index) => index + 1),
  );
  expect(grade12.every((clip) => clip.pilot && clip.text.length <= 900 && !clip.legacy_path)).toBe(
    true,
  );
  for (const clip of clips) {
    expect(canEditAudioScript(clip)).toBe(clip.grade !== 11 || clip.source === "walkthrough");
  }
});
