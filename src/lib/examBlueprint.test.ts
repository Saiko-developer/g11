import { describe, expect, it } from "vitest";
import { ALL_SECTION_IDS, configKey, examTotals, normalizeConfig } from "./examBlueprint";

describe("exam builder totals", () => {
  it("full paper is 95 marks and 180 minutes", () => {
    expect(examTotals({ sections: [...ALL_SECTION_IDS], count: 10 })).toEqual({
      marks: 95,
      minutes: 180,
    });
  });
  it("sections I-III with 10 questions each is 30 marks", () => {
    expect(examTotals({ sections: ["I", "II", "III"], count: 10 }).marks).toBe(30);
  });
  it("sections I-III with 5 questions each is 15 marks", () => {
    expect(examTotals({ sections: ["I", "II", "III"], count: 5 }).marks).toBe(15);
  });
  it("Grade 11 full paper is 100 marks and 120 minutes", () => {
    expect(examTotals({ sections: [...ALL_SECTION_IDS], count: 10, grade: 11 })).toEqual({
      marks: 100,
      minutes: 120,
    });
  });
  it("Grade 11 essay section alone is 15 marks", () => {
    expect(examTotals({ sections: ["IX"], count: 10, grade: 11 }).marks).toBe(15);
  });
  it("Grade 11 papers are cached separately from Grade 10", () => {
    const g10 = normalizeConfig({ units: "1" });
    const g11 = normalizeConfig({ units: "1", grade: "11" });
    expect(configKey(g11)).not.toBe(configKey(g10));
  });
  it("combines chosen units in order without duplicates", () => {
    expect(normalizeConfig({ units: "3,1,3", sections: "I", count: "5" })).toEqual({
      units: [1, 3],
      sections: ["I"],
      count: 5,
    });
  });
});
