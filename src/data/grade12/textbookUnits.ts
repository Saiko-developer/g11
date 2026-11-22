import { unit2Exercises, unit2Reading, unit2References } from "./unit2";
import { unit3Exercises, unit3Reading, unit3References } from "./unit3";
import { unit4Exercises, unit4Reading, unit4References } from "./unit4";

export const textbookUnits = {
  2: { exercises: unit2Exercises, reading: unit2Reading, references: unit2References },
  3: { exercises: unit3Exercises, reading: unit3Reading, references: unit3References },
  4: { exercises: unit4Exercises, reading: unit4Reading, references: unit4References },
};

export const textbookUnitNumbers = [2, 3, 4] as const;
export type TextbookUnitNumber = (typeof textbookUnitNumbers)[number];
export type AvailableGrade12Unit = 1 | TextbookUnitNumber;
