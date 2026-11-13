-- Keep one owner per narration hash; remove the calendar-based clip quota.
-- Authentication, publication approval and canonical script checks stay in the server route.
CREATE OR REPLACE FUNCTION public.claim_classroom_audio(p_hash text,p_lesson text,p_version text,p_path text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.classroom_audio(hash,lesson_id,version,storage_path)
 VALUES(p_hash,p_lesson,p_version,p_path) ON CONFLICT DO NOTHING;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_classroom_audio(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_classroom_audio(text,text,text,text) TO service_role;
