-- Allow the textbook Speaking activities for Grade 12 Units 8–12 and match the full unit prefix.
CREATE OR REPLACE FUNCTION public.grade11_speaking_prepare(p_unit integer,p_exercise text,p_session uuid,p_request uuid,p_claim uuid,p_operation text,p_revision integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); s public.grade11_speaking_sessions; r public.grade11_speaking_requests; units integer[]; used integer;
BEGIN
 IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','signin'); END IF;
 IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok',false,'reason','suspended'); END IF;
 IF p_unit IS NULL OR p_unit NOT BETWEEN 1 AND 12 OR p_request IS NULL OR p_claim IS NULL OR p_operation IS NULL OR p_operation NOT IN ('open','turn','finish') THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
 IF p_exercise IS NOT NULL AND (p_exercise NOT IN ('1D-30','1D-31','2D-18','3D-33','5D-14','5D-21','1D-G12-C','1D-G12-D','1D-G12-E','3D-G12-B1','3D-G12-B2','3D-G12-B3','3D-G12-B4','3D-G12-B5','3D-G12-B6','4D-G12-E','5D-G12-F','6D-G12-E','7D-G12-D','8D-G12-E','9D-G12-E','10D-G12-C','11D-G12-E','12D-G12-E') OR split_part(p_exercise,'D-',1)<>p_unit::text) THEN RETURN jsonb_build_object('ok',false,'reason','invalid'); END IF;
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


REVOKE ALL ON FUNCTION public.grade11_speaking_prepare(integer,text,uuid,uuid,uuid,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.grade11_speaking_prepare(integer,text,uuid,uuid,uuid,text,integer) TO authenticated;
