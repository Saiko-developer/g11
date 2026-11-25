DROP POLICY IF EXISTS "read approved classroom versions" ON public.classroom_publications;
REVOKE SELECT ON public.classroom_publications FROM anon, authenticated;