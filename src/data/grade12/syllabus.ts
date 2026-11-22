// Grade 12 English textbook contents, printed page i.
export const grade12Units = [
  { number: 1, title: "Good Manners", page: 1 },
  { number: 2, title: "Key to Happiness", page: 11 },
  { number: 3, title: "Diet and Nutrition", page: 21 },
  { number: 4, title: "Emotional Well-Being", page: 34 },
  { number: 5, title: "Colours", page: 45 },
  { number: 6, title: "Artificial Intelligence", page: 58 },
  { number: 7, title: "Pollution: A Hazard to Our Environment", page: 74 },
  { number: 8, title: "Renewable Energy", page: 85 },
  { number: 9, title: "Helen Keller", page: 97 },
  { number: 10, title: "Why Improve Communication Skills?", page: 113 },
  { number: 11, title: "A Day’s Wait", page: 123 },
  { number: 12, title: "Intercultural Communication", page: 135 },
] as const;

export const grade12Reviews = [
  { reviewPage: 32, poem: "The Library", poemPage: 33 },
  { reviewPage: 72, poem: "The Quiet Life", poemPage: 73 },
  { reviewPage: 111, poem: "The Road Not Taken", poemPage: 112 },
  { reviewPage: 145, poem: "Windy Nights", poemPage: 146 },
] as const;

export const grade12Skills = [
  "reading",
  "vocabulary",
  "grammar",
  "listening",
  "speaking",
  "writing",
] as const;
export type Grade12Skill = (typeof grade12Skills)[number];
