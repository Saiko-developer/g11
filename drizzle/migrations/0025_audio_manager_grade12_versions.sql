ALTER TABLE public.lesson_mp3_catalog
  DROP CONSTRAINT lesson_mp3_catalog_grade_check,
  ADD CONSTRAINT lesson_mp3_catalog_grade_check CHECK (grade IN (10, 11, 12));
--> statement-breakpoint
ALTER TABLE public.lesson_mp3_versions ADD COLUMN audio_deleted_at timestamptz;
--> statement-breakpoint
CREATE FUNCTION public.lesson_mp3_regenerate(p_clip text, p_user uuid, p_engine text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  clip lesson_mp3_catalog;
  narration text;
BEGIN
  SELECT * INTO STRICT clip FROM lesson_mp3_catalog WHERE id = p_clip FOR UPDATE;
  IF clip.removed_from_lesson THEN RAISE EXCEPTION 'Clip is removed'; END IF;
  IF p_engine NOT IN ('gemini', 'voxcpm2') OR p_engine IS NULL THEN
    RAISE EXCEPTION 'Unsupported audio provider';
  END IF;
  IF EXISTS (SELECT 1 FROM lesson_mp3_versions WHERE clip_id = p_clip
             AND status IN ('queued', 'generating', 'pending')) THEN
    RAISE EXCEPTION 'This clip already has an active audio version';
  END IF;

  narration := clip.script_draft;
  IF narration IS NULL THEN
    SELECT script_text INTO narration
    FROM lesson_mp3_versions
    WHERE clip_id = p_clip AND script_hash = clip.script_hash AND script_text IS NOT NULL
    ORDER BY created_at DESC, id DESC LIMIT 1;
  END IF;

  IF narration IS NOT NULL THEN
    -- The existing draft functions snapshot the text, serialize queueing and clear the draft.
    IF clip.script_draft IS NULL THEN
      UPDATE lesson_mp3_catalog SET script_draft = narration WHERE id = p_clip;
    END IF;
    IF p_engine = 'voxcpm2' THEN
      RETURN lesson_mp3_local_enqueue(p_clip, p_user, true, narration);
    END IF;
    RETURN lesson_mp3_enqueue_draft(p_clip, p_user, narration);
  END IF;

  IF p_engine = 'voxcpm2' THEN
    RETURN lesson_mp3_local_enqueue(p_clip, p_user, true);
  END IF;
  RETURN lesson_mp3_enqueue(p_clip, p_user, true);
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.lesson_mp3_delete_audio(p_version uuid, p_user uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  asset lesson_mp3_versions;
  clip lesson_mp3_catalog;
  prefix text;
BEGIN
  SELECT * INTO STRICT asset FROM lesson_mp3_versions WHERE id = p_version FOR UPDATE;
  IF asset.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Only generated or previously reviewed audio can be deleted';
  END IF;
  SELECT * INTO STRICT clip FROM lesson_mp3_catalog WHERE id = asset.clip_id FOR UPDATE;
  prefix := format('grade-%s/unit-%s/%s/%s/', clip.grade, lpad(clip.unit::text, 2, '0'),
                   clip.section, asset.id);
  IF (asset.storage_path IS NOT NULL AND NOT starts_with(asset.storage_path, prefix)) OR
     (asset.raw_path IS NOT NULL AND NOT starts_with(asset.raw_path, prefix)) THEN
    RAISE EXCEPTION 'Audio object does not belong to this version';
  END IF;
  IF EXISTS (
    SELECT 1 FROM lesson_mp3_versions other
    WHERE other.id <> asset.id
      AND (other.storage_path IN (asset.storage_path, asset.raw_path)
           OR other.raw_path IN (asset.storage_path, asset.raw_path))
  ) THEN
    RAISE EXCEPTION 'Audio object is shared with another version';
  END IF;
  IF asset.audio_deleted_at IS NULL AND asset.storage_path IS NULL AND asset.raw_path IS NULL THEN
    RAISE EXCEPTION 'This version has no generated audio to delete';
  END IF;

  -- Detach before calling Storage. Keep paths available for a retry if Storage is unavailable.
  IF asset.audio_deleted_at IS NULL THEN
    UPDATE lesson_mp3_catalog SET approved_version = NULL
      WHERE id = clip.id AND approved_version = asset.id;
    UPDATE lesson_mp3_versions SET status = 'rejected', audio_deleted_at = now(),
      reviewed_by = p_user, reviewed_at = now(), updated_at = now(), last_error = NULL
      WHERE id = asset.id;
    INSERT INTO lesson_mp3_events(version_id, kind) VALUES (asset.id, 'audio_delete_requested');
  END IF;
  RETURN jsonb_build_object('mp3', asset.storage_path, 'wav', asset.raw_path);
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.lesson_mp3_link_backup(p_version uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE asset lesson_mp3_versions;
BEGIN
  SELECT * INTO STRICT asset FROM lesson_mp3_versions WHERE id = p_version FOR UPDATE;
  IF asset.status <> 'approved' OR asset.audio_deleted_at IS NOT NULL
     OR asset.storage_path IS NULL THEN RETURN false; END IF;
  UPDATE lesson_mp3_catalog SET approved_version = p_version
    WHERE id = asset.clip_id AND script_hash = asset.script_hash
      AND NOT removed_from_lesson AND approved_version IS NULL;
  RETURN FOUND;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.lesson_mp3_regenerate(text, uuid, text),
  public.lesson_mp3_delete_audio(uuid, uuid), public.lesson_mp3_link_backup(uuid)
  FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.lesson_mp3_regenerate(text, uuid, text),
  public.lesson_mp3_delete_audio(uuid, uuid), public.lesson_mp3_link_backup(uuid)
  TO service_role;
