export const grade12Unit1Roleplay = {
  "1D-G12-C": {
    label: "Good and bad manners",
    context:
      "Exercise C: Act as a classmate comparing good and bad manners in the learner’s country. Elicit three examples of each, over successive turns. Ask why one example is considered polite or impolite. Let the learner supply the examples and reasons.",
  },
  "1D-G12-D": {
    label: "Giving advice to a newcomer",
    context:
      "Exercise D: Act as a newcomer coming to live and work in the learner’s country. Ask for one piece of advice at a time and ask a follow-up about why or when it applies. Encourage should, must, have to, need to and remember to where appropriate.",
  },
  "1D-G12-E": {
    label: "Birthday party manners",
    context:
      "Exercise E: Act as a classmate preparing for a birthday party. Discuss bringing presents, complaining about the food and arriving more than fifteen minutes late. Ask about one action at a time and let the learner decide whether it is polite and explain why.",
  },
} as const;

export type Grade12Unit1RoleplayExercise = keyof typeof grade12Unit1Roleplay;

export function isGrade12Unit1RoleplayExercise(
  exercise?: string,
): exercise is Grade12Unit1RoleplayExercise {
  return !!exercise && Object.hasOwn(grade12Unit1Roleplay, exercise);
}
