import { sanitizeForSpeech } from "./sanitizeSpeech";

/** Clip boundaries for the Grade 11 (Units 2–12) oral player. Shared with the server audio cache. */
export function grade11OralChunks(text: string): string[] {
  const sentences = sanitizeForSpeech(text).match(/[^။.!?]+[။.!?]*|[။.!?]+/g) ?? [];
  const output: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > 900 && current) {
      output.push(current.trim());
      current = "";
    }
    if (sentence.length > 900) {
      for (let offset = 0; offset < sentence.length; offset += 900)
        output.push(sentence.slice(offset, offset + 900).trim());
    } else current += sentence;
  }
  if (current.trim()) output.push(current.trim());
  return output.filter(Boolean);
}
