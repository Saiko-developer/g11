import { z } from "zod";
export const accountSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  status: z.string(),
  suspended_until: z.string().nullable(),
  created_at: z.string(),
  last_seen_at: z.string(),
  tutor_bonus: z.number().int().nonnegative(),
  exam_bonus: z.number().int().nonnegative(),
  tutor_used_today: z.number().int().nonnegative(),
  exam_used_today: z.number().int().nonnegative(),
  scholarship: z.string(),
  scholarship_note: z.string().nullable(),
  is_admin: z.boolean(),
  is_teacher: z.boolean(),
  is_main_admin: z.boolean(),
});
export const walletUpdateSchema = z
  .object({
    id: z.string().uuid(),
    addBonus: z.number().int().min(1).max(100000).optional(),
    addExam: z.number().int().min(1).max(100000).optional(),
    scholarship: z.enum(["none", "approved", "rejected"]).optional(),
  })
  .strict()
  .refine(
    (data) =>
      [data.addBonus, data.addExam, data.scholarship].filter((value) => value !== undefined)
        .length === 1,
    "Choose one account adjustment per request.",
  );
