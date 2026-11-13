CREATE TABLE public.classroom_publications (
 lesson_id text NOT NULL CHECK (lesson_id IN ('g10-u1-reading','g11-u1-reading')),
 version text NOT NULL, content_hash text NOT NULL CHECK (length(content_hash)=64),
 reviewed_by uuid NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (lesson_id,version)
);
GRANT SELECT ON public.classroom_publications TO authenticated;
GRANT ALL ON public.classroom_publications TO service_role;
ALTER TABLE public.classroom_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read approved classroom versions" ON public.classroom_publications FOR SELECT TO authenticated USING (true);
CREATE TABLE public.classroom_progress (
 user_id uuid NOT NULL, lesson_id text NOT NULL, version text NOT NULL,
 cursor integer NOT NULL DEFAULT 0, audio_offset double precision NOT NULL DEFAULT 0,
 completed integer[] NOT NULL DEFAULT '{}', revision integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id,lesson_id,version)
);
GRANT SELECT ON public.classroom_progress TO authenticated;
GRANT ALL ON public.classroom_progress TO service_role;
ALTER TABLE public.classroom_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own classroom progress" ON public.classroom_progress FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE FUNCTION public.save_classroom_progress(p_user uuid,p_lesson text,p_version text,p_cursor integer,p_offset double precision,p_completed integer[],p_revision integer,p_steps integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.classroom_progress; merged integer[];
BEGIN
 IF p_user IS NULL OR p_lesson NOT IN ('g10-u1-reading','g11-u1-reading') OR p_steps NOT BETWEEN 1 AND 1000
 OR p_cursor NOT BETWEEN 0 AND p_steps-1 OR NOT(p_offset>=0 AND p_offset<=3600)
 OR cardinality(p_completed)>p_steps OR EXISTS(SELECT 1 FROM unnest(p_completed) x WHERE x IS NULL OR x<0 OR x>=p_steps) THEN RAISE EXCEPTION 'Invalid progress'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('classroom:'||p_user::text||p_lesson||p_version,0));
 SELECT * INTO r FROM public.classroom_progress WHERE user_id=p_user AND lesson_id=p_lesson AND version=p_version;
 IF COALESCE(r.revision,0)<>p_revision THEN RETURN jsonb_build_object('ok',false,'reason','stale'); END IF;
 SELECT COALESCE(array_agg(DISTINCT x ORDER BY x),'{}') INTO merged FROM unnest(COALESCE(r.completed,'{}')||p_completed) x;
 INSERT INTO public.classroom_progress(user_id,lesson_id,version,cursor,audio_offset,completed,revision)
 VALUES(p_user,p_lesson,p_version,p_cursor,p_offset,merged,p_revision+1)
 ON CONFLICT(user_id,lesson_id,version) DO UPDATE SET cursor=EXCLUDED.cursor,audio_offset=EXCLUDED.audio_offset,completed=EXCLUDED.completed,revision=EXCLUDED.revision,updated_at=now();
 RETURN jsonb_build_object('ok',true,'revision',p_revision+1,'completed',merged);
END $$;
REVOKE ALL ON FUNCTION public.save_classroom_progress(uuid,text,text,integer,double precision,integer[],integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_classroom_progress(uuid,text,text,integer,double precision,integer[],integer,integer) TO service_role;