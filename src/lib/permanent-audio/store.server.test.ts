import { beforeEach, expect, it, vi } from "vitest";
import { deleteAudioVersion } from "./store.server";
import { AudioDeletionUnavailableError } from "./types";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  remove: vi.fn(),
  bucket: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  not: vi.fn(),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: mocks.rpc,
    storage: { from: mocks.bucket },
    from: () => ({ update: mocks.update }),
  },
}));

const id = "00000000-0000-4000-8000-000000000001";
const folder = `grade-12/unit-01/grammar/${id}`;
const mp3 = `${folder}/audio.mp3`;
const wav = `${folder}/source.wav`;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.rpc.mockResolvedValue({ data: { mp3, wav }, error: null });
  mocks.bucket.mockReturnValue({ remove: mocks.remove });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ not: mocks.not });
  mocks.not.mockResolvedValue({ error: null });
});

it("leaves file paths available on a storage failure and clears them after a retry", async () => {
  mocks.remove.mockResolvedValueOnce({ error: { message: "Connection failed" } });
  await expect(deleteAudioVersion(id, "admin")).rejects.toThrow("Retry deletion");
  expect(mocks.update).not.toHaveBeenCalled();

  await deleteAudioVersion(id, "admin");
  expect(mocks.rpc).toHaveBeenLastCalledWith("lesson_mp3_delete_audio", {
    p_version: id,
    p_user: "admin",
  });
  expect(mocks.bucket).toHaveBeenCalledWith("saya-owl-lesson-audio");
  expect(mocks.remove).toHaveBeenLastCalledWith([mp3, wav]);
  expect(mocks.update).toHaveBeenCalledWith({
    storage_path: null,
    raw_path: null,
    bytes: 0,
    raw_bytes: 0,
    duration: null,
  });
  expect(mocks.eq).toHaveBeenCalledWith("id", id);
  expect(mocks.not).toHaveBeenCalledWith("audio_deleted_at", "is", null);
});

it("leaves private storage untouched when the database rejects the deletion", async () => {
  mocks.rpc.mockResolvedValueOnce({ error: { message: "Version is generating" } });
  await expect(deleteAudioVersion(id, "admin")).rejects.toThrow("Audio deletion failed");
  expect(mocks.remove).not.toHaveBeenCalled();
});

it.each(["PGRST202", "42883", "42703"])(
  "reports the required migration when the deletion schema is unavailable (%s)",
  async (code) => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code } });
    await expect(deleteAudioVersion(id, "admin")).rejects.toBeInstanceOf(
      AudioDeletionUnavailableError,
    );
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  },
);
