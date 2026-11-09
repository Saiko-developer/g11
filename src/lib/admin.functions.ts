import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { z } from "zod";
import { walletUpdateSchema } from "./admin-account";
export const listStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAdminAccounts } = await import("./admin-account-service.server");
    return loadAdminAccounts(
      context.supabase,
      async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin,
    );
  });

export const setStudentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "suspended"]),
      days: z.number().int().min(1).max(3650).nullable().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { assertActiveAdmin, assertNotMainAdmin } =
      await import("./admin-account-service.server");
    await assertActiveAdmin(context.supabase);
    if (data.id === context.userId) throw new Error("You cannot change your own account");
    await assertNotMainAdmin(context.supabase, data.id);
    const until =
      data.status === "suspended" && data.days
        ? new Date(Date.now() + data.days * 86400000).toISOString()
        : null;
    const { error } = await context.supabase
      .from("profiles")
      .update({ status: data.status, suspended_until: until })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { assertActiveAdmin, assertNotMainAdmin } =
      await import("./admin-account-service.server");
    await assertActiveAdmin(context.supabase);
    if (data.id === context.userId) throw new Error("You cannot delete your own account");
    await assertNotMainAdmin(context.supabase, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), admin: z.boolean() }).parse)
  .handler(async ({ data, context }) => {
    const { assertActiveAdmin, assertNotMainAdmin } =
      await import("./admin-account-service.server");
    await assertActiveAdmin(context.supabase);
    if (data.id === context.userId) throw new Error("You cannot change your own role");
    await assertNotMainAdmin(context.supabase, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    if (data.admin) {
      const { error } = await db
        .from("user_roles")
        .upsert({ user_id: data.id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("user_roles")
        .delete()
        .eq("user_id", data.id)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setTeacherRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), teacher: z.boolean() }).parse)
  .handler(async ({ data, context }) => {
    const { assertActiveAdmin, assertNotMainAdmin } =
      await import("./admin-account-service.server");
    await assertActiveAdmin(context.supabase);
    if (data.id === context.userId) throw new Error("You cannot change your own role");
    await assertNotMainAdmin(context.supabase, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    if (data.teacher) {
      const { error } = await db
        .from("user_roles")
        .upsert({ user_id: data.id, role: "teacher" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("user_roles")
        .delete()
        .eq("user_id", data.id)
        .eq("role", "teacher");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateTutorWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(walletUpdateSchema.parse)
  .handler(async ({ data, context }) => {
    const { adjustWallet } = await import("./admin-account-service.server");
    return adjustWallet(context.supabase, data);
  });
