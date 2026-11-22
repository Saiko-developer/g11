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
} as const;

export const additionalRoleplayIds = [
  additionalRoleplay[5].id,
  additionalRoleplay[6].id,
  additionalRoleplay[7].id,
] as const;

export function getAdditionalRoleplay(id?: string) {
  return Object.values(additionalRoleplay).find((card) => card.id === id);
}
