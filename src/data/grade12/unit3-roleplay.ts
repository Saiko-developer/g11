export const grade12Unit3SpeakingCards = [
  { id: "3D-G12-B1", label: "Your food preferences" },
  { id: "3D-G12-B2", label: "Six vital nutrients" },
  { id: "3D-G12-B3", label: "A relationship between diet and nutrition" },
  { id: "3D-G12-B4", label: "A balanced diet" },
  { id: "3D-G12-B5", label: "Negative effects of processed foods" },
  { id: "3D-G12-B6", label: "Foods essential for nutrition" },
] as const;

export const grade12Unit3RoleplayIds = grade12Unit3SpeakingCards.map(({ id }) => id);
export const unit3SpeakingTopics = grade12Unit3SpeakingCards.map(({ label }) => label);

export function getGrade12Unit3SpeakingCard(exercise?: string) {
  return grade12Unit3SpeakingCards.find(({ id }) => id === exercise);
}
