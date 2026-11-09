-- Grade 11 only. Legacy speaking_sessions and Grade 10 RPCs remain unchanged.
CREATE TABLE public.grade11_speaking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit integer NOT NULL CHECK (unit BETWEEN 1 AND 12), exercise text,
  practice_day date NOT NULL DEFAULT public.mm_today(),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','active','ended','failed')),
  created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz,
  expires_at timestamptz, ended_at timestamptz,
  revision integer NOT NULL DEFAULT 0, latest_reply jsonb, history jsonb NOT NULL DEFAULT '[]', feedback jsonb
);
CREATE INDEX grade11_speaking_daily_idx ON public.grade11_speaking_sessions(user_id,practice_day,unit) WHERE started_at IS NOT NULL;
CREATE TABLE public.grade11_speaking_requests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, request_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.grade11_speaking_sessions(id) ON DELETE CASCADE,
  operation text NOT NULL CHECK (operation IN ('open','turn','finish')),
  claim uuid NOT NULL, state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','done','failed')),
  created_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz NOT NULL DEFAULT now()+interval '90 seconds',
  PRIMARY KEY(user_id,request_id)
);
CREATE INDEX grade11_speaking_pending_idx ON public.grade11_speaking_requests(user_id,state,lease_until);
ALTER TABLE public.grade11_speaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade11_speaking_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.grade11_speaking_sessions, public.grade11_speaking_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.grade11_speaking_sessions, public.grade11_speaking_requests TO service_role;
CREATE POLICY "no direct session writes" ON public.grade11_speaking_sessions TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY "private completion claims" ON public.grade11_speaking_requests TO authenticated USING(false) WITH CHECK(false);

-- Internal formatter: never exposes the private completion claim.
CREATE FUNCTION public.grade11_speaking_payload(s public.grade11_speaking_sessions) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT COALESCE((s).latest_reply,'{}') || jsonb_build_object('ok',true,'session',(s).id,'unit',(s).unit,
 'exercise',(s).exercise,'revision',(s).revision,'expiresAt',(s).expires_at,'serverNow',now(),
 'history',(s).history,'durationSeconds',300);
$$;
REVOKE ALL ON FUNCTION public.grade11_speaking_payload(public.grade11_speaking_sessions) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.grade11_speaking_status(p_unit integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); units integer[]; used integer; total integer; live public.grade11_speaking_sessions;
BEGIN
 IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 IF p_unit NOT BETWEEN 1 AND 12 THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
 SELECT COALESCE(array_agg(DISTINCT unit ORDER BY unit),'{}'), count(*) FILTER(WHERE unit=p_unit), count(*)
 INTO units,used,total FROM public.grade11_speaking_sessions WHERE user_id=uid AND practice_day=public.mm_today() AND started_at IS NOT NULL;
 SELECT * INTO live FROM public.grade11_speaking_sessions WHERE user_id=uid AND state='active' AND expires_at>now() ORDER BY started_at DESC LIMIT 1;
 RETURN jsonb_build_object('ok',true,'used',used,'limit',2,'unlimited',false,'unitsUsed',units,'unitLimit',2,
 'sessionsUsed',total,'durationSeconds',300,'serverNow',now(),
 'canStart',used<2 AND (p_unit=ANY(units) OR cardinality(units)<2) AND live.id IS NULL,
 'active',CASE WHEN live.id IS NULL THEN NULL ELSE jsonb_build_object('session',live.id,'unit',live.unit,'exercise',live.exercise,'expiresAt',live.expires_at,'revision',live.revision) END);
END $$;

CREATE FUNCTION public.grade11_speaking_prepare(p_unit integer,p_exercise text,p_session uuid,p_request uuid,p_claim uuid,p_operation text,p_revision integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); s public.grade11_speaking_sessions; r public.grade11_speaking_requests; units integer[]; used integer;
BEGIN
 IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 IF p_unit IS NULL OR p_unit NOT BETWEEN 1 AND 12 OR p_request IS NULL OR p_claim IS NULL OR p_operation IS NULL OR p_operation NOT IN ('open','turn','finish') THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
 IF p_exercise IS NOT NULL AND (p_exercise NOT IN ('1D-30','1D-31','5D-14','5D-21') OR left(p_exercise,1)<>p_unit::text) THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text || ':grade11-speaking',0));
 UPDATE public.grade11_speaking_requests SET state='failed' WHERE user_id=uid AND state='pending' AND lease_until<=now();
 UPDATE public.grade11_speaking_sessions x SET state='failed' WHERE x.user_id=uid AND x.state='pending'
 AND NOT EXISTS(SELECT 1 FROM public.grade11_speaking_requests q WHERE q.session_id=x.id AND q.state='pending');
 UPDATE public.grade11_speaking_sessions SET state='ended',ended_at=expires_at WHERE user_id=uid AND state='active' AND expires_at<=now();
 SELECT * INTO r FROM public.grade11_speaking_requests WHERE user_id=uid AND request_id=p_request;
 IF r.request_id IS NOT NULL THEN
  SELECT * INTO s FROM public.grade11_speaking_sessions WHERE id=r.session_id AND user_id=uid;
  IF s.unit<>p_unit OR s.exercise IS DISTINCT FROM p_exercise OR r.operation<>p_operation THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
  IF r.state='done' THEN
   IF p_operation='finish' AND s.feedback IS NOT NULL THEN RETURN s.feedback||jsonb_build_object('ok',true,'cached',true,'session',s.id); END IF;
   IF s.state='active' AND s.expires_at>now() THEN RETURN public.grade11_speaking_payload(s)||jsonb_build_object('cached',true,'resumed',true); END IF;
   RETURN jsonb_build_object('ok',false,'reason','expired');
  END IF;
  RETURN jsonb_build_object('ok',false,'reason',CASE WHEN r.state='pending' THEN 'busy' ELSE 'retry' END);
 END IF;
 IF p_operation='open' THEN
  SELECT * INTO s FROM public.grade11_speaking_sessions WHERE user_id=uid AND state='active' AND expires_at>now() ORDER BY started_at DESC LIMIT 1;
  IF s.id IS NOT NULL THEN
   IF s.unit<>p_unit OR s.exercise IS DISTINCT FROM p_exercise THEN RETURN jsonb_build_object('ok',false,'reason','active_session','activeUnit',s.unit); END IF;
   RETURN public.grade11_speaking_payload(s)||jsonb_build_object('cached',true,'resumed',true);
  END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.grade11_speaking_requests WHERE user_id=uid AND state='pending' AND lease_until>now()) THEN RETURN jsonb_build_object('ok',false,'reason','busy'); END IF;
 IF (SELECT count(*) FROM public.grade11_speaking_requests WHERE user_id=uid AND created_at>=(public.mm_today()::timestamp AT TIME ZONE 'Asia/Yangon'))>=200 THEN RETURN jsonb_build_object('ok',false,'reason','daily_request_limit'); END IF;
 IF (SELECT count(*) FROM public.grade11_speaking_requests WHERE user_id=uid AND created_at>now()-interval '1 minute')>=30 THEN RETURN jsonb_build_object('ok',false,'reason','rate_limit'); END IF;
 IF p_operation='open' THEN
  SELECT COALESCE(array_agg(DISTINCT unit),'{}'),count(*) FILTER(WHERE unit=p_unit) INTO units,used
  FROM public.grade11_speaking_sessions WHERE user_id=uid AND practice_day=public.mm_today() AND started_at IS NOT NULL;
  IF used>=2 THEN RETURN jsonb_build_object('ok',false,'reason','unit_limit'); END IF;
  IF NOT(p_unit=ANY(units)) AND cardinality(units)>=2 THEN RETURN jsonb_build_object('ok',false,'reason','daily_unit_limit'); END IF;
  INSERT INTO public.grade11_speaking_sessions(user_id,unit,exercise) VALUES(uid,p_unit,p_exercise) RETURNING * INTO s;
 ELSE
  SELECT * INTO s FROM public.grade11_speaking_sessions WHERE id=p_session AND user_id=uid FOR UPDATE;
  IF s.id IS NULL OR s.unit<>p_unit OR s.exercise IS DISTINCT FROM p_exercise THEN RETURN jsonb_build_object('ok',false,'reason','no_session'); END IF;
  IF p_operation='finish' THEN
   IF s.feedback IS NOT NULL THEN RETURN s.feedback||jsonb_build_object('ok',true,'cached',true,'session',s.id); END IF;
   IF s.started_at IS NULL OR now()>s.expires_at+interval '10 minutes' THEN RETURN jsonb_build_object('ok',false,'reason','expired'); END IF;
   UPDATE public.grade11_speaking_sessions SET state='ended',ended_at=COALESCE(ended_at,LEAST(now(),expires_at)) WHERE id=s.id;
  ELSE
   IF s.state<>'active' OR s.expires_at<=now() THEN RETURN jsonb_build_object('ok',false,'reason','expired'); END IF;
   IF p_revision IS NULL OR p_revision<>s.revision THEN RETURN jsonb_build_object('ok',false,'reason','stale'); END IF;
  END IF;
 END IF;
 INSERT INTO public.grade11_speaking_requests(user_id,request_id,session_id,operation,claim) VALUES(uid,p_request,s.id,p_operation,p_claim);
 RETURN public.grade11_speaking_payload(s)||jsonb_build_object('fresh',true);
END $$;

-- Completion requires the server's random, unexposed claim. Students cannot release an in-flight API request.
CREATE FUNCTION public.grade11_speaking_complete(p_request uuid,p_claim uuid,p_success boolean,p_reply jsonb,p_history jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); r public.grade11_speaking_requests; s public.grade11_speaking_sessions; units integer[]; used integer;
BEGIN
 IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text || ':grade11-speaking',0));
 SELECT * INTO r FROM public.grade11_speaking_requests WHERE user_id=uid AND request_id=p_request AND claim=p_claim FOR UPDATE;
 IF r.request_id IS NULL OR r.state<>'pending' THEN RETURN jsonb_build_object('ok',false,'reason','stale'); END IF;
 SELECT * INTO s FROM public.grade11_speaking_sessions WHERE id=r.session_id AND user_id=uid FOR UPDATE;
 IF p_success IS DISTINCT FROM true OR r.lease_until<=now() OR NOT public.is_active_ai_account() THEN
  UPDATE public.grade11_speaking_requests SET state='failed' WHERE user_id=uid AND request_id=p_request;
  IF s.started_at IS NULL THEN UPDATE public.grade11_speaking_sessions SET state='failed' WHERE id=s.id; END IF;
  RETURN jsonb_build_object('ok',false,'reason',CASE WHEN NOT public.is_active_ai_account() THEN 'suspended' ELSE 'retry' END);
 END IF;
 IF p_reply IS NULL OR p_history IS NULL OR jsonb_typeof(p_reply)<>'object' OR jsonb_typeof(p_history)<>'array' THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
 IF jsonb_array_length(p_history)>21 OR octet_length(p_reply::text)>60000 OR octet_length(p_history::text)>180000 THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
 IF r.operation='open' THEN
  IF s.state<>'pending' OR s.started_at IS NOT NULL THEN RETURN jsonb_build_object('ok',false,'reason','stale'); END IF;
  SELECT COALESCE(array_agg(DISTINCT unit),'{}'),count(*) FILTER(WHERE unit=s.unit) INTO units,used
  FROM public.grade11_speaking_sessions WHERE user_id=uid AND practice_day=public.mm_today() AND started_at IS NOT NULL;
  IF used>=2 OR (NOT(s.unit=ANY(units)) AND cardinality(units)>=2) THEN
   UPDATE public.grade11_speaking_requests SET state='failed' WHERE user_id=uid AND request_id=p_request;
   UPDATE public.grade11_speaking_sessions SET state='failed' WHERE id=s.id;
   RETURN jsonb_build_object('ok',false,'reason','unit_limit');
  END IF;
  UPDATE public.grade11_speaking_sessions SET state='active',practice_day=public.mm_today(),started_at=now(),expires_at=now()+interval '5 minutes',revision=1,latest_reply=p_reply,history=p_history WHERE id=s.id RETURNING * INTO s;
 ELSIF r.operation='finish' THEN
  UPDATE public.grade11_speaking_sessions SET feedback=p_reply,history=p_history WHERE id=s.id;
 ELSE
  IF s.state<>'active' OR s.expires_at<=now() THEN
   UPDATE public.grade11_speaking_requests SET state='failed' WHERE user_id=uid AND request_id=p_request;
   RETURN jsonb_build_object('ok',false,'reason','expired');
  END IF;
  UPDATE public.grade11_speaking_sessions SET revision=revision+1,latest_reply=p_reply,history=p_history WHERE id=s.id RETURNING * INTO s;
 END IF;
 UPDATE public.grade11_speaking_requests SET state='done' WHERE user_id=uid AND request_id=p_request;
 IF r.operation='finish' THEN RETURN p_reply||jsonb_build_object('ok',true,'session',s.id); END IF;
 RETURN public.grade11_speaking_payload(s);
END $$;

CREATE FUNCTION public.grade11_speaking_end(p_session uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text || ':grade11-speaking',0));
 UPDATE public.grade11_speaking_sessions SET state='ended',ended_at=LEAST(now(),expires_at)
 WHERE id=p_session AND user_id=uid AND state='active';
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','no_session'); END IF;
 RETURN jsonb_build_object('ok',true);
END $$;

CREATE FUNCTION public.grade11_speaking_validate(p_session uuid,p_unit integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.grade11_speaking_sessions WHERE id=p_session AND user_id=auth.uid() AND unit=p_unit AND state='active' AND expires_at>now()) THEN
  RETURN jsonb_build_object('ok',false,'reason','expired');
 END IF;
 RETURN jsonb_build_object('ok',true);
END $$;

REVOKE ALL ON FUNCTION public.grade11_speaking_status(integer), public.grade11_speaking_prepare(integer,text,uuid,uuid,uuid,text,integer),
 public.grade11_speaking_complete(uuid,uuid,boolean,jsonb,jsonb), public.grade11_speaking_end(uuid),public.grade11_speaking_validate(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.grade11_speaking_status(integer), public.grade11_speaking_prepare(integer,text,uuid,uuid,uuid,text,integer),
 public.grade11_speaking_complete(uuid,uuid,boolean,jsonb,jsonb), public.grade11_speaking_end(uuid),public.grade11_speaking_validate(uuid,integer) TO authenticated,service_role;

-- Include Grade 11 time/session usage in the existing protected admin snapshot.
CREATE OR REPLACE FUNCTION public.admin_account_summaries() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) OR NOT public.is_active_ai_account() THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;
  WITH exams AS (
    SELECT user_id, count(*)::integer AS used FROM public.exam_generations
    WHERE created_at >= (public.mm_today()::timestamp AT TIME ZONE 'Asia/Yangon')
      AND created_at < ((public.mm_today() + 1)::timestamp AT TIME ZONE 'Asia/Yangon')
    GROUP BY user_id
  ), speaking AS (
    SELECT user_id, array_agg(DISTINCT unit ORDER BY unit) AS units, count(*)::integer AS sessions,
      sum(greatest(0, floor(extract(epoch FROM (LEAST(COALESCE(ended_at,now()),expires_at)-started_at)))))::integer AS used_seconds
    FROM public.grade11_speaking_sessions WHERE practice_day=public.mm_today() AND started_at IS NOT NULL GROUP BY user_id
  ), accounts AS (
    SELECT p.id, p.email, p.full_name, p.avatar_url, p.status, p.suspended_until, p.created_at, p.last_seen_at,
      COALESCE(w.bonus_left, 0) AS tutor_bonus, COALESCE(w.exam_bonus_left, 0) AS exam_bonus,
      COALESCE(u.used, 0) AS tutor_used_today, COALESCE(e.used, 0) AS exam_used_today,
      COALESCE(NULLIF(w.scholarship, ''), 'none') AS scholarship, w.scholarship_note,
      (public.has_role(p.id, 'admin') OR public.is_main_admin(p.id)) AS is_admin, public.has_role(p.id, 'teacher') AS is_teacher,
      public.is_main_admin(p.id) AS is_main_admin,
      COALESCE(g.units,'{}'::integer[]) AS grade11_speaking_units, COALESCE(g.sessions,0) AS grade11_speaking_sessions,
      COALESCE(g.used_seconds,0) AS grade11_speaking_seconds,
      CASE WHEN live.id IS NULL THEN NULL ELSE jsonb_build_object('unit',live.unit,'expiresAt',live.expires_at,'serverNow',now()) END AS grade11_speaking_active
    FROM public.profiles p
    LEFT JOIN public.tutor_wallets w ON w.user_id = p.id
    LEFT JOIN public.tutor_usage u ON u.user_id = p.id AND u.day = public.mm_today()
    LEFT JOIN exams e ON e.user_id = p.id
    LEFT JOIN speaking g ON g.user_id=p.id
    LEFT JOIN LATERAL (SELECT id,unit,expires_at FROM public.grade11_speaking_sessions WHERE user_id=p.id AND state='active' AND expires_at>now() ORDER BY started_at DESC LIMIT 1) live ON true
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.last_seen_at DESC, a.id), '[]'::jsonb)
  INTO result FROM accounts a;
  RETURN result;
END $$;
