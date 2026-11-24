DROP POLICY IF EXISTS "public read grammar questions" ON public.grammar_generated_questions;
REVOKE SELECT ON public.grammar_generated_questions FROM anon, authenticated;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='class_exam_ai_control' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.class_exam_ai_control', p.policyname);
  END LOOP;
END $$;
REVOKE SELECT ON public.class_exam_ai_control FROM anon, authenticated;