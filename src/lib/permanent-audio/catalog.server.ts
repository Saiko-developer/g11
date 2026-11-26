import { grade11AuthoredClips, grade11AudioHash } from "../grade11GrammarAudioCache.server";
import { methodLessons } from "../classroom/method-lessons";
import { readingLessons } from "../classroom/lessons";
import { classroomAudioIdentity } from "../classroom/audio.server";
import { additionalGrammar } from "@/data/grade12/additionalGrammar";
import { unit1Grammar } from "@/data/grade12/unit1-grammar";
import { unit2Grammar } from "@/data/grade12/unit2-grammar";
import { unit3Grammar } from "@/data/grade12/unit3-grammar";
import { unit4Grammar } from "@/data/grade12/unit4-grammar";
import { chunkScript } from "../grammarSpeechChunks";
import { sanitizeForSpeech } from "../sanitizeSpeech";
import { createHash } from "node:crypto";

export const AUDIO_GRADES = [10, 11, 12] as const;
export type AudioClip = {
  id: string;
  grade: (typeof AUDIO_GRADES)[number];
  unit: number;
  lesson_id: string;
  section: string;
  segment_id: string;
  segment_order: number;
  script_hash: string;
  script_version: string;
  text: string;
  source: "walkthrough" | "classroom" | "grade12-grammar";
  lessonTitle?: string;
  legacy_bucket?: string;
  legacy_path?: string;
  pilot: boolean;
};
export function canEditAudioScript(clip: AudioClip) {
  return clip.grade === 10 || clip.grade === 12 || clip.source === "walkthrough";
}
let catalog: Promise<AudioClip[]> | undefined;
export function audioCatalog(): Promise<AudioClip[]> {
  return (catalog ??= (async () => {
    const clips: AudioClip[] = [];
    const positions = new Map<number, number>();
    for (const item of grade11AuthoredClips()) {
      const hash = await grade11AudioHash(item.text),
        order = (positions.get(item.unit) ?? 0) + 1;
      positions.set(item.unit, order);
      clips.push({
        id: `walkthrough-${hash}`,
        grade: 11,
        unit: item.unit,
        lesson_id: `g11-u${item.unit}-grammar-walkthrough`,
        section: "grammar",
        segment_id: hash,
        segment_order: order,
        script_hash: hash,
        script_version: "g11-grammar-v1",
        text: item.text,
        source: "walkthrough",
        legacy_bucket: "grade11-grammar-audio",
        legacy_path: `clips/${hash}.wav`,
        pilot: true,
      });
    }
    for (const lesson of [...methodLessons, ...readingLessons])
      for (let cursor = 0; cursor < lesson.segments.length * 4; cursor++) {
        const item = await classroomAudioIdentity(lesson, cursor);
        clips.push({
          id: `classroom-${item.hash}`,
          grade: lesson.grade,
          unit: lesson.unit,
          lesson_id: lesson.id,
          section: lesson.section ?? "reading",
          segment_id: String(cursor),
          segment_order: cursor + 1,
          script_hash: item.hash,
          script_version: `${item.version}:${lesson.teachingRevision ?? "legacy"}`,
          text: item.text,
          source: "classroom",
          legacy_bucket: "classroom-narration",
          legacy_path: item.path,
          pilot: lesson.grade === 10 || lesson.section === "grammar",
        });
      }
    for (const { unit, sections } of [
      unit1Grammar,
      unit2Grammar,
      unit3Grammar,
      unit4Grammar,
      ...Object.values(additionalGrammar),
    ]) {
      for (const section of sections) {
        const lessonId = section.id;
        const text = sanitizeForSpeech(section.oral.scriptMy);
        if (!text) continue;
        for (const [index, narration] of chunkScript(text).entries()) {
          const hash = createHash("sha256")
            .update(JSON.stringify([lessonId, index, narration, "g12-grammar-v1"]))
            .digest("hex");
          clips.push({
            id: `g12-grammar-${hash}`,
            grade: 12,
            unit,
            lesson_id: lessonId,
            section: "grammar",
            segment_id: String(index),
            segment_order: index + 1,
            script_hash: hash,
            script_version: "g12-grammar-v1",
            text: narration,
            source: "grade12-grammar",
            lessonTitle: section.titleEn,
            pilot: true,
          });
        }
      }
    }
    return clips;
  })());
}
