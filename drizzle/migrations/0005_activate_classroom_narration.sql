-- Actual narration/credit backend for the existing classroom. No textbook or auth replacement.
-- Run only through the existing migration runner after reconciling the target schema.
CREATE TABLE public.ai_credit_control (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), enabled boolean NOT NULL DEFAULT true,
 daily_requests integer NOT NULL DEFAULT 500 CHECK(daily_requests BETWEEN 1 AND 100000)
);
INSERT INTO public.ai_credit_control DEFAULT VALUES;
CREATE TABLE public.ai_credit_requests (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL, operation text NOT NULL CHECK(operation IN ('tutor','check','generate','speech','classroom')),
 day date NOT NULL DEFAULT public.mm_today(), source text NOT NULL CHECK(source IN ('daily','bonus','unlimited')),
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','succeeded','refunded')),
 created_at timestamptz NOT NULL DEFAULT now(), settled_at timestamptz,
 PRIMARY KEY(user_id,request_id)
);
CREATE INDEX ai_credit_requests_day ON public.ai_credit_requests(day);
CREATE INDEX ai_credit_requests_user_time ON public.ai_credit_requests(user_id,created_at DESC);
CREATE TABLE public.ai_credit_ledger (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid, topup_id uuid, amount integer NOT NULL CHECK(amount<>0),
 source text NOT NULL, event text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,request_id,event), UNIQUE(topup_id,event)
);
CREATE INDEX ai_credit_ledger_user_time ON public.ai_credit_ledger(user_id,created_at DESC);
ALTER TABLE public.ai_credit_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_ledger ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ai_credit_requests,public.ai_credit_ledger TO authenticated;
CREATE POLICY "own credit requests" ON public.ai_credit_requests FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY "own credit ledger" ON public.ai_credit_ledger FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
GRANT ALL ON public.ai_credit_control,public.ai_credit_requests,public.ai_credit_ledger TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.ai_credit_ledger_id_seq TO service_role;

-- Only the authenticated application server can reserve/settle; clients cannot claim refunds.
CREATE FUNCTION public.reserve_ai_credit(p_user uuid,p_request uuid,p_operation text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q jsonb; src text; cfg public.ai_credit_control;
BEGIN
 IF p_user IS NULL OR p_request IS NULL OR p_operation NOT IN ('tutor','check','generate','speech','classroom') THEN RAISE EXCEPTION 'Invalid request'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('ai-credit-budget',0));
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user AND (status='active' OR (status='suspended' AND suspended_until<=now()))) THEN
  RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 IF EXISTS(SELECT 1 FROM public.ai_credit_requests WHERE user_id=p_user AND request_id=p_request) THEN
  RETURN jsonb_build_object('ok',false,'reason','duplicate'); END IF;
 SELECT * INTO cfg FROM public.ai_credit_control WHERE id=true;
 IF NOT FOUND OR NOT cfg.enabled OR (SELECT count(*) FROM public.ai_credit_requests WHERE day=public.mm_today())>=cfg.daily_requests THEN
  RETURN jsonb_build_object('ok',false,'reason','platform_limit'); END IF;
 IF (SELECT count(*) FROM public.ai_credit_requests WHERE user_id=p_user AND day=public.mm_today())>=100
 OR (SELECT count(*) FROM public.ai_credit_requests WHERE user_id=p_user AND created_at>now()-interval '1 minute')>=10
 OR (SELECT count(*) FROM public.ai_credit_requests WHERE user_id=p_user AND state='reserved')>=2 THEN
  RETURN jsonb_build_object('ok',false,'reason','rate_limit'); END IF;
 -- tutor_quota uses auth.uid(). Keep the caller identity local to this transaction.
 PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
 q:=public.tutor_quota();
 IF (q->>'unlimited')::boolean THEN src:='unlimited';
 ELSIF (q->>'daily_left')::integer>0 THEN
  src:='daily';
  INSERT INTO public.tutor_usage(user_id,day,used) VALUES(p_user,public.mm_today(),1)
  ON CONFLICT(user_id,day) DO UPDATE SET used=public.tutor_usage.used+1;
 ELSE
  UPDATE public.tutor_wallets SET bonus_left=bonus_left-1,updated_at=now() WHERE user_id=p_user AND bonus_left>0;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','limit'); END IF;
  src:='bonus';
 END IF;
 INSERT INTO public.ai_credit_requests(user_id,request_id,operation,source) VALUES(p_user,p_request,p_operation,src);
 INSERT INTO public.ai_credit_ledger(user_id,request_id,amount,source,event) VALUES(p_user,p_request,-1,src,'reserve');
 RETURN jsonb_build_object('ok',true);
END $$;
CREATE FUNCTION public.settle_ai_credit(p_user uuid,p_request uuid,p_success boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.ai_credit_requests;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 SELECT * INTO r FROM public.ai_credit_requests WHERE user_id=p_user AND request_id=p_request FOR UPDATE;
 IF NOT FOUND OR r.state<>'reserved' THEN RETURN; END IF;
 IF NOT p_success THEN
  IF r.source='daily' THEN UPDATE public.tutor_usage SET used=greatest(used-1,0) WHERE user_id=p_user AND day=r.day;
  ELSIF r.source='bonus' THEN UPDATE public.tutor_wallets SET bonus_left=bonus_left+1,updated_at=now() WHERE user_id=p_user; END IF;
  INSERT INTO public.ai_credit_ledger(user_id,request_id,amount,source,event) VALUES(p_user,p_request,1,r.source,'refund');
 END IF;
 UPDATE public.ai_credit_requests SET state=CASE WHEN p_success THEN 'succeeded' ELSE 'refunded' END,settled_at=now() WHERE user_id=p_user AND request_id=p_request;
END $$;
REVOKE ALL ON FUNCTION public.reserve_ai_credit(uuid,uuid,text),public.settle_ai_credit(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credit(uuid,uuid,text),public.settle_ai_credit(uuid,uuid,boolean) TO service_role;

-- Serialize legacy tutor calls with reservations, preserving existing daily and scholarship rules.
CREATE OR REPLACE FUNCTION public.consume_tutor_message() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); q jsonb;
BEGIN
 IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 q:=public.tutor_quota();
 IF (q->>'unlimited')::boolean THEN RETURN jsonb_build_object('ok',true); END IF;
 IF (q->>'daily_left')::integer>0 THEN
  INSERT INTO public.tutor_usage(user_id,day,used) VALUES(uid,public.mm_today(),1)
  ON CONFLICT(user_id,day) DO UPDATE SET used=public.tutor_usage.used+1;
  RETURN jsonb_build_object('ok',true);
 END IF;
 UPDATE public.tutor_wallets SET bonus_left=bonus_left-1,updated_at=now() WHERE user_id=uid AND bonus_left>0;
 RETURN jsonb_build_object('ok',FOUND,'reason',CASE WHEN FOUND THEN NULL ELSE 'limit' END);
END $$;
REVOKE ALL ON FUNCTION public.consume_tutor_message() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consume_tutor_message() TO authenticated;

CREATE TABLE public.classroom_audio (
 hash text PRIMARY KEY CHECK(length(hash)=64), lesson_id text NOT NULL, version text NOT NULL,
 state text NOT NULL DEFAULT 'preparing' CHECK(state IN ('preparing','ready','failed')),
 storage_path text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), bytes integer,
 last_error text
);
ALTER TABLE public.classroom_audio ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.classroom_audio TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('classroom-narration','classroom-narration',false,8388608,ARRAY['audio/wav','audio/mpeg']) ON CONFLICT(id) DO NOTHING;
-- No client storage policies on classroom-narration.
CREATE FUNCTION public.claim_classroom_audio(p_hash text,p_lesson text,p_version text,p_path text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('classroom-audio-budget',0));
 IF (SELECT count(*) FROM public.classroom_audio WHERE created_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Yangon') AT TIME ZONE 'Asia/Yangon')>=20 THEN RETURN false; END IF;
 INSERT INTO public.classroom_audio(hash,lesson_id,version,storage_path) VALUES(p_hash,p_lesson,p_version,p_path) ON CONFLICT DO NOTHING;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_classroom_audio(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_classroom_audio(text,text,text,text) TO service_role;

CREATE TABLE public.classroom_live_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), live_enabled boolean NOT NULL DEFAULT false,
 updated_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.classroom_live_settings DEFAULT VALUES;
ALTER TABLE public.classroom_live_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.classroom_live_settings TO service_role;
