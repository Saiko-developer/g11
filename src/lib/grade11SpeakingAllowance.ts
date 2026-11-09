import { z } from "zod";
export type Grade11ActiveSpeaking = {
  session: string;
  unit: number;
  exercise?: string | null;
  expiresAt: string;
  revision: number;
};
export type Grade11SpeakingAllowance = {
  used: number;
  limit: number;
  unitsUsed: number[];
  unitLimit: number;
  sessionsUsed: number;
  durationSeconds: number;
  serverNow: string;
  canStart: boolean;
  active: Grade11ActiveSpeaking | null;
};
export function speakingSeconds(
  expiresAt: string,
  serverNow: string,
  receivedAt: number,
  now: number,
) {
  const available = Date.parse(expiresAt) - Date.parse(serverNow);
  return Number.isFinite(available)
    ? Math.max(0, Math.ceil((available - (now - receivedAt)) / 1000))
    : 0;
}
export function speakingTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function notifySpeakingAllowanceChanged() {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.BroadcastChannel === "function") {
      const channel = new window.BroadcastChannel("grade11-speaking");
      channel.postMessage("changed");
      channel.close();
      return;
    }
  } catch {
    /* Blocked cross-tab channels fall back to this document. */
  }
  window.dispatchEvent(new Event("grade11-speaking-updated"));
}
export function onSpeakingAllowanceChanged(refresh: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("grade11-speaking-updated", refresh);
  let channel: BroadcastChannel | null = null;
  try {
    if (typeof window.BroadcastChannel === "function") {
      channel = new window.BroadcastChannel("grade11-speaking");
      channel.onmessage = refresh;
    }
  } catch {
    /* Document events still work. */
  }
  return () => {
    window.removeEventListener("grade11-speaking-updated", refresh);
    channel?.close();
  };
}

const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)));
export const speakingAllowanceSchema = z.object({
  ok: z.literal(true),
  used: z.number().int().min(0).max(2),
  limit: z.literal(2),
  unitsUsed: z.array(z.number().int().min(1).max(12)).max(2),
  unitLimit: z.literal(2),
  sessionsUsed: z.number().int().min(0).max(4),
  durationSeconds: z.literal(300),
  serverNow: timestamp,
  canStart: z.boolean(),
  active: z
    .object({
      session: z.string().uuid(),
      unit: z.number().int().min(1).max(12),
      exercise: z.string().nullable().optional(),
      expiresAt: timestamp,
      revision: z.number().int().min(1),
    })
    .nullable(),
});
