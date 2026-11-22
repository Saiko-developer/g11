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

// Transcribed from the opening page of each unit, listed above.
export const grade12SkillTopics: Record<number, Record<Grade12Skill, string>> = {
  1: {
    reading: "Good Manners",
    vocabulary: "Compound nouns and adjectives",
    grammar: "Can, should, must",
    listening: "Good manners in four countries",
    speaking: "Good and bad manners",
    writing: "Writing a reply",
  },
  2: {
    reading: "Key to Happiness",
    vocabulary: "Synonyms",
    grammar: "Relative clauses",
    listening: "Listening to four students talking about what makes them happy",
    speaking: "Talking about what makes people happy",
    writing: "Summary writing",
  },
  3: {
    reading: "Diet and Nutrition",
    vocabulary: "Affixes in English",
    grammar: "Participle phrases; It is / It was … who / that …; Not only … but also",
    listening: "Listening to a man talking about nutrition",
    speaking: "Talking about diet and nutrition",
    writing: "Opinion writing",
  },
  4: {
    reading: "Emotional Well-Being",
    vocabulary: "-ed and -ing adjectives",
    grammar: "Adjectives with prepositions",
    listening: "Listening to a talk on some strategies to deal with stress",
    speaking: "Talking about stress",
    writing: "Essay writing",
  },
  5: {
    reading: "Colours",
    vocabulary: "Colour idioms",
    grammar: "Subordinating conjunctions in adverbial clauses",
    listening: "Listening to a psychologist talking about colours",
    speaking: "Talking about one’s favourite colour",
    writing: "Essay writing",
  },
  6: {
    reading: "Artificial Intelligence",
    vocabulary: "Adverbial phrases",
    grammar: "No matter who, whose, what, which, where, when, how, whether, etc.",
    listening: "Listening to a talk on self-driving cars",
    speaking: "Giving a presentation on AI machines",
    writing: "Argumentative essay",
  },
  7: {
    reading: "Pollution: A Hazard to Our Environment",
    vocabulary: "Words related to pollution and environment",
    grammar: "Verbs of cause and effect; Linking words to show cause",
    listening: "Listening to a talk on e-waste",
    speaking: "Talking about pollution, using cause and effect words",
    writing: "Cause and effect essay",
  },
  8: {
    reading: "Renewable Energy",
    vocabulary: "Energy collocations",
    grammar: "Conditionals",
    listening: "Listening to a talk on renewable energy",
    speaking: "Talking about a hydropower plant",
    writing: "Expository essay",
  },
  9: {
    reading: "Helen Keller",
    vocabulary: "Phrasal verbs",
    grammar:
      "Verbs followed by a noun group and a bare infinitive; Verbs followed by a noun group and a to-infinitive",
    listening: "Listening to a TV programme about famous people with disabilities",
    speaking: "Talking about what makes disabled people successful in their careers or in life",
    writing: "Letter of encouragement",
  },
  10: {
    reading: "Why Improve Communication Skills?",
    vocabulary: "Words related to communication",
    grammar: "to / in order to / so as to; so that / in order that",
    listening:
      "Listening to a professor talking about some useful guidelines for effective communication",
    speaking: "Talking about dos and don’ts at an interview",
    writing: "Writing about experiences in learning English",
  },
  11: {
    reading: "A Day’s Wait",
    vocabulary: "Words related to illness",
    grammar: "As if / As though; Introductory phrases",
    listening: "Listening to two friends talking about their favourite author",
    speaking: "Giving a presentation about a personal story",
    writing: "Writing a narrative",
  },
  12: {
    reading: "Intercultural Communication",
    vocabulary: "Aspects of culture; Phrasal verbs",
    grammar: "Relative pronouns and relative adverbs",
    listening: "Listening to three friends talking about a snow festival in Japan",
    speaking: "Talking about a traditional festival",
    writing: "Writing a blog post",
  },
};
