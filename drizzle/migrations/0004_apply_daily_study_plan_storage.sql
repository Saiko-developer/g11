GRANT SELECT ON public.study_enrollments, public.daily_class_completions TO authenticated;
GRANT ALL ON public.study_enrollments, public.daily_class_completions TO service_role;
REVOKE ALL ON FUNCTION public.finish_daily_class(uuid,integer,text,integer,text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_daily_class(uuid,integer,text,integer,text,text,integer,integer) TO service_role;
COMMENT ON TABLE public.study_enrollments IS 'Daily study grade enrollment; caller-scoped reads, server-only enrollment writes.';
COMMENT ON TABLE public.daily_class_completions IS 'Daily study completion history; caller-scoped reads, server-only validated completion writes.';