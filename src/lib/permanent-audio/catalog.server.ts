import { grade11AuthoredClips, grade11AudioHash } from "../grade11GrammarAudioCache.server";
import { methodLessons } from "../classroom/method-lessons";
import { readingLessons } from "../classroom/lessons";
import { classroomAudioIdentity } from "../classroom/audio.server";
export type AudioClip = {
  id: string;
  grade: 10 | 11;
  unit: number;
  lesson_id: string;
  section: string;
  segment_id: string;
  segment_order: number;
  script_hash: string;
  script_version: string;
  text: string;
  source: "walkthrough" | "classroom";
  legacy_bucket: string;
  legacy_path: string;
  pilot: boolean;
};
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
        pilot: item.unit === 1,
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
          script_version: `${lesson.version}:${lesson.teachingRevision ?? "legacy"}`,
          text: item.text,
          source: "classroom",
          legacy_bucket: "classroom-narration",
          legacy_path: item.path,
          pilot: lesson.grade === 11 && lesson.unit === 1 && lesson.section === "grammar",
        });
      }
    return clips;
  })());
}
