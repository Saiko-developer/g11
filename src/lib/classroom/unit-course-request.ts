import type { UnitSkill } from "./unit-course";
export type CourseState = {
  sections: {
    skill: UnitSkill;
    published: boolean;
    completed: boolean;
    answers: Record<string, string>;
    practised: boolean;
    cursor: number;
    steps: number[];
  }[];
  homework: null | {
    assigned_at: string;
    submitted_at: string | null;
    answers: Record<string, string>;
    feedback: null | {
      matched: number;
      objectiveTotal: number;
      note: string;
      teacherFeedback?: string;
    };
  };
};
export async function courseRequest(
  body?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<CourseState> {
  const response = await fetch("/api/unit-classroom?grade=10&unit=1", {
    ...(body
      ? {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(body.action === "review_homework"
              ? { "Idempotency-Key": crypto.randomUUID() }
              : {}),
          },
          body: JSON.stringify({ grade: 10, unit: 1, ...body }),
        }
      : {}),
    cache: "no-store",
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "Unit မှတ်တမ်း ချိတ်ဆက်မရပါ။ ပြန်စမ်းပါ။");
  return data;
}
