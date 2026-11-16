import type { FillItem } from "./mockExam";
type Poem = { title: string; lines: string[] };
/** Build exact two-line textbook blanks locally. No model transcription or extra API call. */
export function buildTextbookVerseCompletion(poems: Poem[], random = Math.random): FillItem[] {
  const shuffle = <T>(items: T[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const groups = shuffle(
    poems.map((poem) => {
      const pairs: Omit<FillItem, "number">[] = [];
      for (let i = 0; i < poem.lines.length - 1; i++) {
        const sentence = `${poem.lines[i]}\n${poem.lines[i + 1]}`;
        const words = [...poem.lines[i + 1].matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)].filter(
          (word) =>
            word[0].length >= 3 &&
            !/^(the|and|that|with|from|this|they|their|have|your|you|are|was|were)$/i.test(word[0]),
        );
        const target = words.at(-1);
        if (!target) continue;
        const index = poem.lines[i].length + 1 + target.index!;
        pairs.push({
          sentence: sentence.slice(0, index) + "______" + sentence.slice(index + target[0].length),
          answer: target[0],
        });
      }
      return shuffle(pairs);
    }),
  );
  const result: FillItem[] = [];
  const used = new Set<string>();
  while (groups.some((group) => group.length) && result.length < 5) {
    for (const group of groups) {
      const item = group.pop();
      if (item && !used.has(item.sentence) && result.length < 5) {
        used.add(item.sentence);
        result.push({ ...item, number: result.length + 1 });
      }
    }
  }
  if (result.length !== 5)
    throw new Error("Not enough original textbook verse pairs to build five questions");
  return result;
}
