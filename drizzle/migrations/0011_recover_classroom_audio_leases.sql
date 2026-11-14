-- Keep existing ready audio. Recover abandoned generation, never generate twice under one live lease.
ALTER TABLE public.classroom_audio
 ADD COLUMN generation_token uuid DEFAULT gen_random_uuid(),
 ADD COLUMN lease_until timestamptz DEFAULT (now() + interval '150 seconds'),
 ADD COLUMN attempts integer NOT NULL DEFAULT 1 CHECK(attempts BETWEEN 1 AND 3);
UPDATE public.classroom_audio SET lease_until=created_at+interval '150 seconds' WHERE state='preparing';
CREATE FUNCTION public.claim_classroom_audio_lease(p_hash text,p_lesson text,p_version text,p_path text,p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_token IS NULL THEN RAISE EXCEPTION 'Generation token required'; END IF;
 INSERT INTO public.classroom_audio(hash,lesson_id,version,storage_path,generation_token,lease_until,attempts)
 VALUES(p_hash,p_lesson,p_version,p_path,p_token,now()+interval '150 seconds',1)
 ON CONFLICT(hash) DO UPDATE SET generation_token=EXCLUDED.generation_token,
 lease_until=EXCLUDED.lease_until,attempts=classroom_audio.attempts+1,last_error=NULL
 WHERE classroom_audio.state='preparing' AND classroom_audio.lease_until<=now()
 AND classroom_audio.attempts<3 AND classroom_audio.lesson_id=p_lesson AND classroom_audio.version=p_version AND classroom_audio.storage_path=p_path;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_classroom_audio_lease(text,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_classroom_audio_lease(text,text,text,text,uuid) TO service_role;
