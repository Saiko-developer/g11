REVOKE ALL ON public.ai_credit_control,public.ai_credit_requests,public.ai_credit_ledger,public.classroom_audio,public.classroom_live_settings FROM anon,authenticated;
GRANT SELECT ON public.ai_credit_requests,public.ai_credit_ledger TO authenticated;
GRANT ALL ON public.ai_credit_control,public.ai_credit_requests,public.ai_credit_ledger,public.classroom_audio,public.classroom_live_settings TO service_role;
REVOKE ALL ON SEQUENCE public.ai_credit_ledger_id_seq FROM anon,authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.ai_credit_ledger_id_seq TO service_role;