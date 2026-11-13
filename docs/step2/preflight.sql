-- READ ONLY: run only against the confirmed existing backend with authorized access.
SELECT current_database(),version();
SELECT table_schema,table_name FROM information_schema.tables
 WHERE table_schema='public' ORDER BY table_name;
SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
 WHERE schemaname IN ('public','storage') ORDER BY schemaname,tablename,policyname;
SELECT p.oid::regprocedure AS signature,p.prosecdef AS security_definer,p.proconfig,p.proacl
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN
 ('mm_today','tutor_quota','consume_tutor_message','is_admin','my_access','is_active_ai_account','admin_review_topup')
 ORDER BY p.proname;
SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets ORDER BY id;
-- Review function bodies and the authoritative migration ledger separately;
-- this checklist intentionally returns no student records or credential values.
