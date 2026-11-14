import grammarNotes from "@/data/classroom/writing-board-notes.json";
import profiles from "@/data/classroom/writing-teaching-profiles.json";
import narration from "@/data/classroom/writing-teacher-narration.json";
import { spokenStepAt, type ReadingLesson } from "./types";

export function writingBoardCue(lesson: ReadingLesson, cursor: number) {
  const p = profiles.find((p) => p.grade === lesson.grade && p.unit === lesson.unit)!;
  const t = narration.find((p) => p.grade === lesson.grade && p.unit === lesson.unit)!;
  const grammar = (grammarNotes as Record<string, string[]>)[`${lesson.grade}:${lesson.unit}`];
  const clip = Math.max(0, Math.min(15, cursor));
  const part = Math.floor(clip / 4);
  const { narration: text } = spokenStepAt(lesson, clip);
  // Highlight only terms spoken in this clip. These are clip cues, not word timestamps.
  const terms = [
    ...new Set(text.match(/[A-Za-z][A-Za-z0-9 /+–…-]*/g)?.map((s) => s.trim()) ?? []),
  ].filter((s) => s.length > 1 && s.length < 90);
  const items =
    part === 0
      ? p.points
      : part === 1
        ? p.outline
        : part === 2
          ? grammar
          : [
              "Content → မူရင်း points ပြည့်မီမှု",
              "Organisation → အကြောင်းအရာ ဆက်စပ်မှု",
              "Grammar → ရည်ရွယ်တဲ့အဓိပ္ပာယ်နဲ့ ပုံစံ ကိုက်ညီမှု",
              "Revision → ကိုယ့်မူကြမ်းကို ကိုယ်တိုင်ပြင်",
            ];
  return {
    title: p.title,
    task: p.task,
    part,
    phase: clip % 4,
    label: [
      "အကြောင်းအရာကို နားလည်မယ်",
      "အတွေးကို အစီအစဉ်ချမယ်",
      "အဓိပ္ပာယ်အလိုက် grammar ရွေးမယ်",
      "ကိုယ့်မူကြမ်းကို ရေးပြီးပြင်မယ်",
    ][part],
    focus: [
      p.focus,
      "ဆိုင်တဲ့ points ကို အတူထား → ဘာကြောင့် အရင်/နောက်ထားလဲ စဉ်းစား",
      "ပြောချင်တဲ့အဓိပ္ပာယ် → ပုံစံရွေး → အကြောင်းရင်းစစ်",
      "ကိုယ့်အတွေးနဲ့ရေး → ပြန်ဖတ် → လိုအပ်တဲ့နေရာကို ပြင်",
    ][part],
    terms,
    items: items.map((note) => ({
      note,
      active: terms.some((term) => note.toLowerCase().includes(term.toLowerCase())),
    })),
    question: t.question,
    // Short vocabulary/grammar anchors come from actual narration, never a model essay.
    text,
  };
}
