import { CLASSROOM_STEPS, segmentNarration, type ReadingSegment } from "./types";

const encoder = new TextEncoder();
const graphemes = new Intl.Segmenter("my", { granularity: "grapheme" });

function splitLongClip(text: string, bytes: number) {
  const parts = [];
  for (let remaining = bytes > 6000 ? 5 : 4; remaining > 1; remaining--) {
    const target = encoder.encode(text).length / remaining;
    let cut = 0;
    let current = 0;
    for (const { segment, index } of graphemes.segment(text)) {
      current += encoder.encode(segment).length;
      if (current > target) break;
      cut = index + segment.length;
    }
    const before = text.slice(0, cut);
    for (const stops of [/\n+|[။!?]+\s*|\.(?=\s)\s*/gu, /[၊,;:]\s*|\s+/gu]) {
      const pause = [...before.matchAll(stops)].at(-1);
      if (!pause) continue;
      const end = pause.index + pause[0].length;
      if (encoder.encode(before.slice(0, end)).length < target * 0.8) continue;
      cut = end;
      break;
    }
    parts.push(text.slice(0, cut));
    text = text.slice(cut);
  }
  parts.push(text);
  return parts;
}

/** Keep the full classroom script and attach splits only to its longest audio clips. */
export function splitGrade10GrammarClips(segments: ReadingSegment[]) {
  const parts: Record<number, string[]> = {};
  for (const [index, segment] of segments.entries()) {
    for (const [stage, step] of CLASSROOM_STEPS.entries()) {
      const text = segmentNarration(segment, step);
      const bytes = encoder.encode(text).length;
      if (bytes > 5200) parts[index * CLASSROOM_STEPS.length + stage] = splitLongClip(text, bytes);
    }
  }
  return parts;
}
