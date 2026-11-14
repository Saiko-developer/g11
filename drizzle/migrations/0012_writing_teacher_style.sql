-- Writing classroom revision only; historical progress, audio and publications remain intact.
-- Old Writing completion must not skip the new teaching. Other skills and self-study are unchanged.
CREATE OR REPLACE FUNCTION public.save_unit_section(p_user uuid,p_skill text,p_lesson_version text,p_hash text,p_answers jsonb,p_practised boolean,p_finish boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE expected_steps integer; done integer[]; lesson text := 'g10-u1-'||p_skill;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('unit-course:'||p_user::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user AND (status='active' OR (status='suspended' AND suspended_until<=now()))) THEN
  RETURN jsonb_build_object('ok',false,'reason','forbidden'); END IF;
 expected_steps := CASE p_skill WHEN 'reading' THEN 64 WHEN 'vocabulary' THEN 12 WHEN 'grammar' THEN 16 WHEN 'listening' THEN 8 WHEN 'speaking' THEN 12 WHEN 'writing' THEN 16 ELSE 0 END;
 IF expected_steps=0 OR p_lesson_version <> (CASE p_skill WHEN 'reading' THEN 'teacher-v2' WHEN 'grammar' THEN 'rule-first-v1' WHEN 'writing' THEN 'point-first-v2' ELSE 'unit-teacher-v1' END)
 OR p_hash IS NULL OR length(p_hash)<>64 OR p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' OR octet_length(p_answers::text)>16000 THEN RAISE EXCEPTION 'Invalid section'; END IF;
 IF p_finish THEN
  IF NOT EXISTS(SELECT 1 FROM public.classroom_publications WHERE lesson_id=lesson AND version=p_lesson_version AND content_hash=p_hash) THEN
   RETURN jsonb_build_object('ok',false,'reason','teacher_review_required'); END IF;
  SELECT completed INTO done FROM public.classroom_progress WHERE user_id=p_user AND lesson_id=lesson AND version=p_lesson_version;
  IF done IS NULL OR EXISTS(SELECT 1 FROM generate_series(0,expected_steps-1) s WHERE NOT(s=ANY(done))) THEN
   RETURN jsonb_build_object('ok',false,'reason','section_incomplete'); END IF;
  IF p_skill IN ('listening','speaking') AND NOT p_practised THEN RETURN jsonb_build_object('ok',false,'reason','practice_required'); END IF;
 END IF;
 INSERT INTO public.unit_section_learning(user_id,grade,unit,course_version,skill,lesson_version,content_hash,answers,practised,completed_at)
 VALUES(p_user,10,1,'g10-u1-course-v1',p_skill,p_lesson_version,p_hash,p_answers,p_practised,CASE WHEN p_finish THEN now() END)
 ON CONFLICT(user_id,grade,unit,course_version,skill) DO UPDATE SET
  lesson_version=EXCLUDED.lesson_version, content_hash=EXCLUDED.content_hash, answers=EXCLUDED.answers, practised=EXCLUDED.practised,
  completed_at=CASE WHEN p_finish THEN COALESCE(unit_section_learning.completed_at,now()) WHEN unit_section_learning.content_hash=EXCLUDED.content_hash THEN unit_section_learning.completed_at END,
  updated_at=now();
 IF (SELECT count(*) FROM public.unit_section_learning s JOIN public.classroom_publications p ON p.lesson_id='g10-u1-'||s.skill AND p.version=s.lesson_version AND p.content_hash=s.content_hash
     WHERE s.user_id=p_user AND s.grade=10 AND s.unit=1 AND s.course_version='g10-u1-course-v1' AND s.completed_at IS NOT NULL
     AND s.lesson_version=(CASE s.skill WHEN 'reading' THEN 'teacher-v2' WHEN 'grammar' THEN 'rule-first-v1' WHEN 'writing' THEN 'point-first-v2' ELSE 'unit-teacher-v1' END))=6 THEN
  INSERT INTO public.unit_homework(user_id,grade,unit,course_version) VALUES(p_user,10,1,'g10-u1-course-v1') ON CONFLICT DO NOTHING;
 END IF;
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.save_unit_section(uuid,text,text,text,jsonb,boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_unit_section(uuid,text,text,text,jsonb,boolean,boolean) TO service_role;
