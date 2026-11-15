export const GRADE11_ROLEPLAY_EXERCISES = [
  "1D-30",
  "1D-31",
  "2D-18",
  "3D-33",
  "5D-14",
  "5D-21",
] as const;
export type Grade11RoleplayExercise = (typeof GRADE11_ROLEPLAY_EXERCISES)[number];
