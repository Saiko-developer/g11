import { grade12Unit3RoleplayIds } from "@/data/grade12/unit3-roleplay";

export const GRADE11_ROLEPLAY_EXERCISES = [
  ...grade12Unit3RoleplayIds,
  "1D-G12-C",
  "1D-G12-D",
  "1D-G12-E",
  "1D-30",
  "1D-31",
  "2D-18",
  "3D-33",
  "5D-14",
  "5D-21",
] as const;
export type Grade11RoleplayExercise = (typeof GRADE11_ROLEPLAY_EXERCISES)[number];
