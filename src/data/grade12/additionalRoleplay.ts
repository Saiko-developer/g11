export const additionalRoleplay = {
  5: {
    id: "5D-G12-F",
    label: "Discuss your favourite colour",
    context:
      "Exercise F. Act as one other member of a group discussing favourite colours. Invite the learner to choose red, grey, blue or purple. Choose a different colour for your own role. Ask the learner for three reasons and a colour they like least, one question at a time. Keep their answers in their own words.",
  },
  6: {
    id: "6D-G12-E",
    label: "Present an AI-powered machine or application",
    context:
      "Exercises D and E. Act as an audience member. Invite the learner to give a presentation on a self-driving car, Google Maps, or a security camera. Let them explain what it is, its advantages, and its disadvantages. Ask a relevant follow-up once they are ready for questions. Give English presentation feedback.",
  },
  7: {
    id: "7D-G12-D",
    label: "Practise the e-waste dialogue",
    context:
      "Exercise D. Follow the textbook dialogue about an old UPS, a broken printer, and safe ways to dispose of unwanted electronics. Play Khant Hpone. Greet Kaung Htet and ask what is in the bag. Let the learner be Kaung Htet. Work through one turn at a time and accept natural paraphrases.",
  },
  8: {
    id: "8D-G12-E",
    label: "Discuss the hydropower plant",
    context:
      "Practise Exercise E as Student B. Ask the student to open with Student A’s question. Use Exercise C as the reference dialogue and practise agreeing and disagreeing politely. Cover construction costs, dam impacts, and operational costs, one turn at a time.",
  },
  9: {
    id: "9D-G12-E",
    label: "Discuss what helps people succeed",
    context:
      "Exercise E. Act as a classmate in a group discussion. Ask the learner to choose from tolerance, perseverance, intelligence, diligence, determination, or talent, then give their reasons. Use Helen Keller from the reading as an optional example. Listen to the learner’s view before asking a follow-up.",
  },
  10: {
    id: "10D-G12-C",
    label: "Prepare for a student exchange interview",
    context:
      "Exercise C. Play the learner’s older sister. Ask the learner to begin by asking for interview preparation advice. Practise the textbook prompts for arrival time, clothes, interview behaviour, and follow-up advice. When the learner asks to switch roles, be Student A and ask one question at a time.",
  },
  11: {
    id: "11D-G12-E",
    label: "Present a personal story",
    context:
      "Exercises D and E. Act as a classmate listening to the learner’s personal story. Invite a title and help them plan with the textbook prompts about setting, characters, plot, and resolution. Give one relevant follow-up at a time. Let the learner tell the story in their own words.",
  },
  12: {
    id: "12D-G12-E",
    label: "Talk about a visit to a traditional festival",
    context:
      "Exercise E. Act as Student A and ask about a traditional festival the learner visited. Ask one question at a time about kind of festival, time, companions, activities, food or feelings. Use the expressions for interest and surprise from the textbook. If the learner has never visited one, invite them to practise with an imagined visit.",
  },
} as const;

export const additionalRoleplayIds = [
  additionalRoleplay[5].id,
  additionalRoleplay[6].id,
  additionalRoleplay[7].id,
  additionalRoleplay[8].id,
  additionalRoleplay[9].id,
  additionalRoleplay[10].id,
  additionalRoleplay[11].id,
  additionalRoleplay[12].id,
] as const;

export function getAdditionalRoleplay(id?: string) {
  return Object.values(additionalRoleplay).find((card) => card.id === id);
}
