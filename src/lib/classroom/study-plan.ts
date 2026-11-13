import type { ReadingLesson } from "./types";

export const STUDY_PLAN_VERSION = "reading-daily-v1";
/** Keep legacy Grade 11 history; revised teaching gets its own completion namespace. */
export function studyPlanVersion(lesson: ReadingLesson) {
  return lesson.teachingRevision ? `reading-${lesson.teachingRevision}` : STUDY_PLAN_VERSION;
}
export type DailyClass = {
  index: number;
  title: string;
  objective: string;
  start: number;
  end: number; // exclusive, in the canonical lesson's teaching-step coordinates
  opening: string;
  closing: string;
};
export type ClassHistory = { session_index: number; completed_on: string }[];
export function myanmarDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
export function buildDailyClasses(lesson: ReadingLesson): DailyClass[] {
  const sessions: DailyClass[] = [];
  for (let sentence = 0; sentence < lesson.segments.length; sentence += 4) {
    const end = Math.min(sentence + 4, lesson.segments.length);
    const index = sessions.length;
    sessions.push({
      index,
      title: `အတန်း ${index + 1} · ${lesson.title}`,
      objective:
        lesson.grade === 10
          ? [
              "ဘာသာစကားနှင့် စွမ်းရည်လေးမျိုး",
              "စွမ်းရည်အတွဲများနှင့် ဆက်သွယ်ရေး",
              "စကားပြော၊ စာရေးနှင့် ဆက်သွယ်မှုပုံစံများ",
              "လူမှုဆက်ဆံရေးနှင့် ယဉ်ကျေးမှု",
            ][index]
          : `ဝါကျ ${sentence + 1} မှ ${end} အထိ အဓိပ္ပာယ်၊ စကားလုံးနဲ့ သဒ္ဒါကို ဆက်စပ်နားလည်မယ်။`,
      start: sentence * 4,
      end: end * 4,
      opening: `မင်္ဂလာပါ။ ဆရာဇီးကွက်နဲ့ ဒီနေ့အတန်း စကြမယ်နော်။ ဒီနေ့ ${lesson.title} ကို ဝါကျ ${sentence + 1} ကနေ ${end} အထိ လေ့လာမယ်။ အင်္ဂလိပ်တစ်ကြောင်းစီ ဖတ်ပြပြီး မြန်မာလို အဓိပ္ပာယ်နဲ့ ဘာကြောင့် ဒီလိုသုံးလဲ ရှင်းပြပေးမယ်။ နားမလည်ရင် ကြားဖြတ်မေးလို့ရပါတယ်။ အခု ပထမဝါကျကို အတူလေ့လာကြရအောင်။`,
      closing:
        end === lesson.segments.length
          ? "ဒီနေ့အတန်းပြီးပါပြီ။ ဖတ်စာအပြည့်အစုံကို ရှင်းပြပြီးပြီဆိုတော့ နားလည်မှုမေးခွန်းတွေကို အခုဖြေကြည့်ကြမယ်။ မသေချာတဲ့အချက်ကို ပြန်နားထောင်နိုင်ပါတယ်။"
          : "ဒီနေ့အတန်းပြီးပါပြီ။ ဝါကျတစ်ကြောင်းမှာ ဘာပြောချင်သလဲ၊ ဘယ်စကားလုံးက အရေးပါလဲဆိုတာ ပြန်စဉ်းစားကြည့်ပါ။ နောက်အတန်းမှာ ရပ်ထားတဲ့နေရာက ဆက်သင်ပေးမယ်။",
    });
  }
  return sessions;
}
/** Absence never skips a class. A completed class is available for review all day. */
export function dailyAssignment(lesson: ReadingLesson, history: ClassHistory, today: string) {
  const classes = buildDailyClasses(lesson);
  const valid = history.filter(
    (h) =>
      Number.isInteger(h.session_index) && h.session_index >= 0 && h.session_index < classes.length,
  );
  const done = new Set(valid.map((h) => h.session_index));
  const firstUnfinished = classes.findIndex((s) => !done.has(s.index));
  const todaySession = valid
    .filter((h) => h.completed_on === today)
    .sort((a, b) => b.session_index - a.session_index)[0];
  const index =
    todaySession?.session_index ?? (firstUnfinished < 0 ? classes.length - 1 : firstUnfinished);
  return {
    session: classes[index],
    classes,
    todayDone: !!todaySession,
    allDone: firstUnfinished < 0,
    completedClasses: done.size,
  };
}
