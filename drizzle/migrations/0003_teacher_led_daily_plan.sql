-- Additive daily-class records. Existing auth, textbooks and reading progress are preserved.
CREATE TABLE public.study_enrollments (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 grade integer NOT NULL CHECK(grade IN (10,11)),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.daily_class_completions (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 grade integer NOT NULL CHECK(grade IN (10,11)), plan_version text NOT NULL,
 session_index integer NOT NULL CHECK(session_index>=0),
 completed_on date NOT NULL DEFAULT public.mm_today(), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,grade,plan_version,session_index)
);
CREATE INDEX daily_class_completions_user_day ON public.daily_class_completions(user_id,completed_on);
ALTER TABLE public.study_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_class_completions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.study_enrollments,public.daily_class_completions TO authenticated;
GRANT ALL ON public.study_enrollments,public.daily_class_completions TO service_role;
CREATE POLICY "read own study enrollment" ON public.study_enrollments FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY "read own daily class completions" ON public.daily_class_completions FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
-- Server-only completion RPC checks stored reading progress, previous classes and Myanmar day.
CREATE FUNCTION public.finish_daily_class(p_user uuid,p_grade integer,p_version text,p_session integer,p_lesson text,p_lesson_version text,p_start integer,p_end integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE completed integer[];
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('daily-class:'||p_user::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.study_enrollments WHERE user_id=p_user AND grade=p_grade)
 OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user AND (status='active' OR (status='suspended' AND suspended_until<=now()))) THEN
  RETURN jsonb_build_object('ok',false,'reason','forbidden'); END IF;
 IF p_session<0 OR p_start<0 OR p_end<=p_start OR p_end>1000 THEN RAISE EXCEPTION 'Invalid class'; END IF;
 IF EXISTS(SELECT 1 FROM public.daily_class_completions WHERE user_id=p_user AND grade=p_grade AND plan_version=p_version AND session_index=p_session) THEN
  RETURN jsonb_build_object('ok',true,'already_completed',true); END IF;
 IF EXISTS(SELECT 1 FROM generate_series(0,p_session-1) s WHERE NOT EXISTS(
  SELECT 1 FROM public.daily_class_completions c WHERE c.user_id=p_user AND c.grade=p_grade AND c.plan_version=p_version AND c.session_index=s)) THEN
  RETURN jsonb_build_object('ok',false,'reason','previous_class_required'); END IF;
 IF EXISTS(SELECT 1 FROM public.daily_class_completions WHERE user_id=p_user AND completed_on=public.mm_today()) THEN
  RETURN jsonb_build_object('ok',false,'reason','today_completed'); END IF;
 SELECT p.completed INTO completed FROM public.classroom_progress p WHERE p.user_id=p_user AND p.lesson_id=p_lesson AND p.version=p_lesson_version;
 IF completed IS NULL OR EXISTS(SELECT 1 FROM generate_series(p_start,p_end-1) s WHERE NOT(s=ANY(completed))) THEN
  RETURN jsonb_build_object('ok',false,'reason','class_incomplete'); END IF;
 INSERT INTO public.daily_class_completions(user_id,grade,plan_version,session_index) VALUES(p_user,p_grade,p_version,p_session);
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.finish_daily_class(uuid,integer,text,integer,text,text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_daily_class(uuid,integer,text,integer,text,text,integer,integer) TO service_role;
