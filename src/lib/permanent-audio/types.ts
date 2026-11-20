export type AudioVersion = {
  id: string;
  clip_id: string;
  script_hash: string;
  script_version: string;
  status: "queued" | "generating" | "pending" | "approved" | "rejected" | "failed";
  storage_path: string | null;
  raw_path: string | null;
  bytes: number;
  duration: number | null;
  voice: string;
  model: string | null;
  provider: string | null;
  format: string;
  created_at: string;
  last_error: string | null;
};
export type AudioCatalogRow = {
  id: string;
  grade: number;
  unit: number;
  lesson_id: string;
  section: string;
  segment_id: string;
  segment_order: number;
  script_hash: string;
  script_version: string;
  approved_version: string | null;
};
export type AudioJob = {
  id: string;
  version_id: string;
  clip_id: string;
  state: string;
  token: string;
  regenerate: boolean;
  attempts: number;
};
export const AUDIO_BUCKET = "saya-owl-lesson-audio";
