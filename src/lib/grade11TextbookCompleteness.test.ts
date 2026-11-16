import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  G11_REVIEWS,
  G11_POEMS,
  G11_REVIEW_KEYS,
  G11_POEM_KEYS,
  G11_REVISION_PAGES,
  grade11RevisionContext,
} from "./grade11Revision";
import coverage from "@/data/grade11/textbook/source-coverage.json";
import { grade11PopupQuestion } from "./grade11PopupQuestion";
import { grade11LessonContext } from "./grade11LessonContext";
import { grade11ReadingPassage } from "./grade11ExamPassage.server";
import { UNIT1_SECTIONS, UNIT1_KEYS } from "./grade11Unit1";
import { UNIT3_SECTIONS } from "./grade11Unit3";
import { UPPER_LESSON_TEXT } from "./grade11UpperStudy";
import { getGrade11Lesson, GRADE11_SKILLS } from "./grade11Navigation";

describe("144-page user-provided Grade 11 source coverage", () => {
  it("retains verifiable page evidence for all three 48-page PDFs without broken source paths", () => {
    expect(coverage.files.map((f) => f.pages)).toEqual([48, 48, 48]);
    expect(coverage.files.map((f) => f.offset)).toEqual([0, 48, 96]);
    expect(coverage.pages.map((p) => p.page)).toEqual(Array.from({ length: 144 }, (_, i) => i + 1));
    for (const page of coverage.pages) {
      expect(page.pdfPage).toBe(((page.page - 1) % 48) + 1);
      const path = `public${page.evidence}`;
      expect(existsSync(path)).toBe(true);
      expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe(page.sha256);
    }
    expect(coverage.sourceLimitations.map((x) => x.page)).toEqual(
      expect.arrayContaining([15, 32, 79, 109]),
    );
  });
  it("makes all 72 unit-skill destinations and all eight supplements available", () => {
    for (let unit = 1; unit <= 12; unit++)
      for (const skill of GRADE11_SKILLS)
        expect(getGrade11Lesson(String(unit), skill.kind)).not.toBeNull();
    expect(Object.keys(G11_REVISION_PAGES)).toHaveLength(8);
    expect(Object.values(G11_REVISION_PAGES).every((x) => x.ready)).toBe(true);
    expect(G11_REVIEWS.map((r) => r.groups.map((g) => g.items.length))).toEqual([
      [10, 10],
      [10, 10],
      [4, 6, 10],
      [10, 10],
    ]);
    expect(G11_REVIEWS.map((r) => r.sourcePage)).toEqual([37, 73, 108, 143]);
    expect(G11_POEMS.map((r) => r.sourcePage)).toEqual([38, 74, 109, 144]);
  });
  it("preserves original word banks, emphasis targets and multiple blanks", () => {
    expect(G11_REVIEWS[1].groups[0].wordBox).toEqual([
      "additionally",
      "cultural",
      "encompass",
      "fast food",
      "nevertheless",
      "offers",
      "primitive",
      "showcases",
      "unique",
      "whole food",
    ]);
    expect(G11_REVIEWS[2].groups[0].items.map((i) => i.highlights?.[0])).toEqual([
      "right",
      "lost",
      "function",
      "form",
    ]);
    expect(G11_REVIEWS[3].groups[1].items[4].highlights).toEqual(["from my mistakes and failures"]);
    expect(G11_REVIEW_KEYS[3]["review4-A-6"].answer).toBe("explains, points out");
    expect(G11_REVIEWS[3].groups[0].items[5].question).toContain("(points out / mentions)");
  });
  it("retains every poem line, glossary, printed example and creative task", () => {
    expect(G11_POEMS.map((p) => p.stanzas.flat().length)).toEqual([15, 18, 14, 16]);
    expect(G11_POEMS.map((p) => p.glossary.length)).toEqual([3, 3, 3, 5]);
    expect(G11_POEMS[1].stanzas[2][5].english).toBe("Over my private zoo.");
    expect(G11_POEMS[2].stanzas[5][1].english).toBe("Enrich that smile her eyes began.");
    expect(G11_POEMS[3].stanzas[3].slice(-2).map((x) => x.english)).toEqual([
      "And miles to go before I sleep,",
      "And miles to go before I sleep.",
    ]);
    expect(G11_POEMS[1].groups[2].example?.english).toContain("whale");
    expect(G11_POEMS[2].groups[2].example?.english).toContain("We must find time");
    expect(G11_POEMS[2].groups[2].sourceNote).toBeTruthy();
    expect(G11_POEMS[3].groups[1].items[9].clues).toHaveLength(4);
    for (const poem of G11_POEMS) {
      expect(poem.stanzas.flat().every((l) => l.english && l.myanmar)).toBe(true);
      expect(
        poem.groups.every((g) => g.instructionMy && g.items.every((i) => i.translationMy)),
      ).toBe(true);
    }
  });
  it("keeps personal/creative work unkeyed and answers separate from the tutor reference", () => {
    for (let n = 1; n <= 4; n++) {
      const keys = G11_POEM_KEYS[n - 1];
      const ids = new Set(G11_POEMS[n - 1].groups.flatMap((g) => g.items.map((i) => i.id)));
      for (const key of Object.keys(keys)) expect(ids.has(key)).toBe(true);
      for (const item of G11_POEMS[n - 1].groups.flatMap((g) => g.items))
        if (item.writing) expect(keys[item.id]).toBeUndefined();
    }
    expect(grade11RevisionContext("review-2")).not.toContain(
      "My brother working for an online banking company is too busy",
    );
    expect(grade11RevisionContext("poem-4")).not.toContain("The speaker is a traveller");
    expect(grade11RevisionContext("poem-2")).toContain("Norma Gillett");
    expect(grade11RevisionContext("poem-2")).toContain("sail through a sea of blue");
  });
  it("resolves Exercise F in real unit data and questions in new supplements", () => {
    const context = grade11LessonContext(5, "reading").context;
    expect(grade11PopupQuestion(context, "Exercise F question 2")).toContain("Exercise F");
    expect(
      grade11PopupQuestion(grade11RevisionContext("poem-3"), "Exercise A question 3"),
    ).toContain("Beauty");
  });
  it("restores confirmed omitted/mis-copied textbook material without replacing original task IDs", () => {
    const all = UNIT1_SECTIONS.flatMap((s) => s.blocks);
    expect(all.find((b) => b.id === "1C-71")?.x).toBe(
      "7. She went through her assignment again. She submitted it to the teacher.",
    );
    expect(UNIT1_KEYS["1C-71"].answer).toContain("before submitting it");
    expect(all.find((b) => b.id === "1E-19")?.x).toContain("recovered from illegal trade");
    expect(all.find((b) => b.id === "1E-17")?.x).toContain("[source text unclear]");
    expect(
      UNIT3_SECTIONS.find((s) => s.code === "3B")?.blocks.find((b) => b.id === "3B-18")?.x,
    ).toContain("the job he is doing");
    expect(
      UPPER_LESSON_TEXT[8].writing.some((b) => b.en.startsWith("Steps to follow in writing")),
    ).toBe(true);
    expect(
      UPPER_LESSON_TEXT[12].grammar.some((b) =>
        b.en.includes("I had so little time that I could not finish my project in time."),
      ),
    ).toBe(true);
  });
  it("supplies actual seen passages for every unit, including the formerly empty Units 7–12", async () => {
    for (let u = 1; u <= 12; u++) {
      const passage = await grade11ReadingPassage(u);
      expect(passage.length).toBeGreaterThan(300);
      expect(passage.length).toBeLessThanOrEqual(2500);
      expect(passage).not.toMatch(/official_answer_key|source-derived|correctMy/);
    }
    expect(await grade11ReadingPassage(7)).toContain(
      "The human body is made up of systems and organs.",
    );
    expect(await grade11ReadingPassage(8)).toContain("Greenwich Village");
    expect(await grade11ReadingPassage(0)).toBe("");
    expect(await grade11ReadingPassage(13)).toBe("");
    expect((await grade11ReadingPassage(12, 100)).length).toBeLessThanOrEqual(100);
  });
});
