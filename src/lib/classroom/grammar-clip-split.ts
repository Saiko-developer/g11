import { CLASSROOM_STEPS, type ReadingSegment } from "./types";

const CLIP_BYTES = 650;
const encoder = new TextEncoder();
const graphemes = new Intl.Segmenter("my", { granularity: "grapheme" });
const byteLength = (text: string) => encoder.encode(text).length;

function cutBefore(text: string, maxBytes: number) {
  let end = 0;
  let usedBytes = 0;
  for (const { segment, index } of graphemes.segment(text)) {
    usedBytes += byteLength(segment);
    if (usedBytes > maxBytes) break;
    end = index + segment.length;
  }
  if (!end) throw Error("Grammar narration has no safe split within the byte limit");

  const prefix = text.slice(0, end);
  for (const boundaries of [/\n+|[။!?]+\s*|\.(?=\s)\s*/gu, /[၊,;:]\s*|\s+/gu]) {
    const matches = [...prefix.matchAll(boundaries)];
    for (const match of matches.reverse()) {
      const candidate = match.index + match[0].length;
      if (candidate >= end / 2 && text.slice(candidate).trim().length > 10) return candidate;
    }
  }
  return end;
}

function splitStep(text: string, originalCursor: number) {
  if (byteLength(text) <= CLIP_BYTES) return [{ text, originalCursor }];
  const pieces: { text: string; originalCursor: number | null }[] = [];
  while (byteLength(text) > CLIP_BYTES) {
    const end = cutBefore(text, CLIP_BYTES);
    pieces.push({ text: text.slice(0, end), originalCursor: null });
    text = text.slice(end);
  }
  if (text) pieces.push({ text, originalCursor: null });
  return pieces;
}

/** Keep the four-step classroom layout while splitting only the original long narration. */
export function splitGrade10GrammarClips(segments: ReadingSegment[], originalVersion: string) {
  return segments.flatMap((segment, segmentIndex) => {
    const pieces = CLASSROOM_STEPS.flatMap((step, index) =>
      splitStep(segment[step], segmentIndex * CLASSROOM_STEPS.length + index),
    );

    // Every classroom card has four playable slots. Put any extra cuts into the
    // longest already-split passages so existing short steps stay intact.
    while (pieces.length % CLASSROOM_STEPS.length) {
      const index = pieces.reduce(
        (best, part, i) =>
          part.originalCursor === null &&
          (best === -1 || byteLength(part.text) > byteLength(pieces[best].text))
            ? i
            : best,
        -1,
      );
      const { text } = pieces[index];
      const end = cutBefore(text, Math.floor(byteLength(text) / 2));
      pieces.splice(
        index,
        1,
        { text: text.slice(0, end), originalCursor: null },
        { text: text.slice(end), originalCursor: null },
      );
    }

    const cards: ReadingSegment[] = [];
    for (let offset = 0; offset < pieces.length; offset += CLASSROOM_STEPS.length) {
      cards.push({
        ...segment,
        id: offset ? `${segment.id}-part-${offset / CLASSROOM_STEPS.length + 1}` : segment.id,
        openingNarration: pieces[offset].text,
        translation: pieces[offset + 1].text,
        explanation: pieces[offset + 2].text,
        reasoning: pieces[offset + 3].text,
        originalAudio: {
          version: originalVersion,
          cursors: pieces
            .slice(offset, offset + CLASSROOM_STEPS.length)
            .map((piece) => piece.originalCursor),
        },
      });
    }
    return cards;
  });
}
