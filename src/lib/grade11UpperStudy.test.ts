import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { UPPER_UNITS, UPPER_KEYS, type UpperUnitNumber } from "./grade11Upper";
import {
  UPPER_LESSON_TEXT,
  UPPER_STUDY_NOTES,
  upperRecordingAnswer,
  upperStudyContext,
} from "./grade11UpperStudy";

const units: UpperUnitNumber[] = [8, 9, 10, 11, 12];
describe("Units 8–12 textbook audit corrections", () => {
  it("restores all three printed sleep-cause columns without reusing draft IDs", () => {
    const items = UPPER_UNITS[10].skills.reading.groups.find((g) => g.id === "10-causes")!.items;
    expect(items.map((i) => [i.id, i.prompt])).toEqual([
      ["10-causes-1", "Irregular sleep patterns"],
      ["10-causes-2", "Medical problems"],
      ["10-causes-3", "Others"],
    ]);
  });
  it("restores the final three reporting-verb questions from textbook page 119", () => {
    const items = UPPER_UNITS[11].skills.vocabulary.groups[0].items;
    expect(items).toHaveLength(8);
    expect(items[3].prompt).toContain("Ko Ko (described / pointed out)");
    expect(items[4].prompt).toContain("The scientists (mentioned / proposed)");
    expect(UPPER_KEYS[11][items[3].id].answer).toBe("described");
    expect(UPPER_KEYS[11][items[4].id].answer).toBe("mentioned");
    expect(items.slice(-3).map((i) => UPPER_KEYS[11][i.id].answer)).toEqual([
      "state",
      "argue",
      "said",
    ]);
  });
  it("retains the original writing letter, topic and numbered essay statements", () => {
    expect(UPPER_STUDY_NOTES["9-composition"].rows.map((r) => r.en).join(" ")).toContain(
      "My fourteen-year-old sister",
    );
    expect(UPPER_UNITS[12].skills.writing.groups[1].items[0].prompt).toContain(
      "What can they do to build a healthy one?",
    );
    expect(
      UPPER_UNITS[12].skills.writing.groups[0].items.every((i) => !i.prompt.includes("______")),
    ).toBe(true);
    expect(UPPER_UNITS[9].skills.reading.groups[2].items[9].prompt.endsWith("______ it.")).toBe(
      true,
    );
  });
  it("supplies full meaning labels for letter-only matching options", () => {
    for (const [unit, kind, groupId] of [
      [10, "reading", "10-gaps"],
      [11, "reading", "11-quotations"],
      [12, "vocabulary", "12-match-verbs"],
      [12, "writing", "12-functions"],
    ] as const) {
      const group = UPPER_UNITS[unit].skills[kind].groups.find((g) => g.id === groupId)!;
      for (const item of group.items)
        for (const choice of item.choices ?? [])
          expect(UPPER_STUDY_NOTES[groupId].choiceLabels?.[choice]).toBeTruthy();
    }
  });
  it.each(units)(
    "binds Unit %i listening suggestions to the original MP3 and existing cues",
    (unit) => {
      const hash = createHash("sha256")
        .update(readFileSync(`public/grade11/audio/unit${unit}.mp3`))
        .digest("hex");
      for (const group of UPPER_UNITS[unit].skills.listening.groups)
        for (const item of group.items) {
          const key = upperRecordingAnswer(unit, item.id);
          if (item.id === "10-listen-3") {
            expect(key).toBeUndefined();
            continue;
          }
          expect(key, item.id).toBeTruthy();
          expect(key!.audioSha256).toBe(hash);
          expect(key!.cues.length).toBeGreaterThan(0);
          expect(upperRecordingAnswer(unit === 12 ? 8 : unit + 1, item.id)).toBeUndefined();
          if (item.choices) expect(item.choices).toContain(key!.answer);
        }
    },
  );
  it("keeps evidence-based listening separate from textbook keys", () => {
    expect(upperRecordingAnswer(12, "12-statements-3")!.answer).toBe("NOT MENTIONED");
    for (const unit of units)
      for (const group of UPPER_UNITS[unit].skills.listening.groups)
        for (const item of group.items) expect(UPPER_KEYS[unit][item.id]).toBeUndefined();
  });
  it.each(units)("bounds Unit %i review contexts and excludes suggested answers", (unit) => {
    for (const kind of ["reading", "vocabulary", "listening", "speaking", "writing"] as const) {
      const context = upperStudyContext(unit, kind);
      expect(context.length).toBeLessThanOrEqual(18000);
      expect(context).not.toContain("source-derived suggested answer");
      expect(context).toContain("Manually transcribed textbook reference");
    }
  });
  it.each(units)("provides bilingual textbook text for all six Unit %i sections", (unit) => {
    for (const [kind, blocks] of Object.entries(UPPER_LESSON_TEXT[unit])) {
      expect(blocks.length, kind).toBeGreaterThan(0);
      expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
      for (const block of blocks) {
        expect(block.en.trim()).toBeTruthy();
        expect(block.my).toMatch(/[\u1000-\u109f]/);
        expect(
          UPPER_UNITS[unit].skills[
            kind as keyof (typeof UPPER_UNITS)[typeof unit]["skills"]
          ].sources.map((s) => s.page),
        ).toContain(block.page);
      }
    }
  });
  it("preserves story ending, source grammar examples and the full sample essay", () => {
    expect(UPPER_LESSON_TEXT[8].reading.map((b) => b.en).join(" ")).toContain(
      "the night that the last leaf fell",
    );
    expect(UPPER_LESSON_TEXT[11].vocabulary.map((b) => b.en).join(" ")).toContain(
      "economy of this town is largely based on mining",
    );
    expect(UPPER_LESSON_TEXT[12].writing.map((b) => b.en).join(" ")).toContain("(10) Therefore");
    expect(UPPER_LESSON_TEXT[12].grammar.map((b) => b.en).join(" ")).toContain(
      "She could swim when she was five",
    );
  });
});
