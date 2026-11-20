-- New private library only. Existing narration scripts, WAV caches and quotas are untouched.
CREATE TABLE public.lesson_mp3_catalog (
 id text PRIMARY KEY, grade int NOT NULL CHECK(grade IN (10,11)), unit int NOT NULL CHECK(unit BETWEEN 1 AND 12),
 lesson_id text NOT NULL, section text NOT NULL, segment_id text NOT NULL, segment_order int NOT NULL,
 script_hash text NOT NULL, script_version text NOT NULL, approved_version uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lesson_mp3_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), clip_id text NOT NULL REFERENCES public.lesson_mp3_catalog(id),
 script_hash text NOT NULL, script_version text NOT NULL, status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','generating','pending','approved','rejected','failed')),
 storage_path text, raw_path text, bytes bigint NOT NULL DEFAULT 0, raw_bytes bigint NOT NULL DEFAULT 0, duration double precision,
 voice text NOT NULL DEFAULT 'Puck', format text NOT NULL DEFAULT 'mp3', provider text, model text,
 created_by uuid, reviewed_by uuid, reviewed_at timestamptz, last_error text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_mp3_catalog ADD CONSTRAINT lesson_mp3_approved_fk FOREIGN KEY(approved_version) REFERENCES public.lesson_mp3_versions(id);
CREATE UNIQUE INDEX lesson_mp3_active_version ON public.lesson_mp3_versions(clip_id) WHERE status IN ('queued','generating','pending');
CREATE TABLE public.lesson_mp3_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), version_id uuid NOT NULL UNIQUE REFERENCES public.lesson_mp3_versions(id),
 clip_id text NOT NULL REFERENCES public.lesson_mp3_catalog(id), state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','complete','failed','interrupted')),
 token uuid, lease_until timestamptz, allow_generation boolean NOT NULL DEFAULT true, regenerate boolean NOT NULL DEFAULT false, attempts int NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lesson_mp3_control(id int PRIMARY KEY CHECK(id=1), lease_until timestamptz, blocked_until timestamptz, next_request_at timestamptz, provider_next jsonb NOT NULL DEFAULT '{}');
INSERT INTO public.lesson_mp3_control(id) VALUES(1);
CREATE TABLE public.lesson_mp3_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), version_id uuid REFERENCES public.lesson_mp3_versions(id),
 kind text NOT NULL, provider text, model text, http_status int, input_tokens_estimate int,
 detail text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_mp3_events_time ON public.lesson_mp3_events(created_at);
ALTER TABLE public.lesson_mp3_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_mp3_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_mp3_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_mp3_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_mp3_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lesson_mp3_catalog,public.lesson_mp3_versions,public.lesson_mp3_jobs,public.lesson_mp3_control,public.lesson_mp3_events FROM anon,authenticated;
GRANT ALL ON public.lesson_mp3_catalog,public.lesson_mp3_versions,public.lesson_mp3_jobs,public.lesson_mp3_control,public.lesson_mp3_events TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('saya-owl-lesson-audio','saya-owl-lesson-audio',false,33554432,ARRAY['audio/mpeg','audio/wav']) ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
-- Restrictive policy also protects this bucket from unrelated permissive client policies.
CREATE POLICY lesson_mp3_private_server_only ON storage.objects AS RESTRICTIVE FOR ALL TO anon,authenticated USING(bucket_id<>'saya-owl-lesson-audio') WITH CHECK(bucket_id<>'saya-owl-lesson-audio');
CREATE FUNCTION public.lesson_mp3_enqueue(p_clip text,p_user uuid,p_regenerate boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c lesson_mp3_catalog; v uuid;
BEGIN
 SELECT * INTO STRICT c FROM lesson_mp3_catalog WHERE id=p_clip FOR UPDATE;
 SELECT id INTO v FROM lesson_mp3_versions WHERE clip_id=p_clip AND status IN ('queued','generating','pending') LIMIT 1;
 IF v IS NOT NULL THEN RETURN v; END IF;
 IF c.approved_version IS NOT NULL AND NOT p_regenerate THEN RETURN c.approved_version; END IF;
 INSERT INTO lesson_mp3_versions(clip_id,script_hash,script_version,created_by) VALUES(p_clip,c.script_hash,c.script_version,p_user) RETURNING id INTO v;
 INSERT INTO lesson_mp3_jobs(version_id,clip_id,regenerate) VALUES(v,p_clip,p_regenerate);
 RETURN v;
END $$;
CREATE FUNCTION public.lesson_mp3_claim() RETURNS SETOF public.lesson_mp3_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c lesson_mp3_control; j lesson_mp3_jobs;
BEGIN
 SELECT * INTO c FROM lesson_mp3_control WHERE id=1 FOR UPDATE;
 IF c.lease_until>now() OR c.blocked_until>now() OR c.next_request_at>now() THEN RETURN; END IF;
 -- An expired paid request is uncertain: do NOT automatically issue it again.
 UPDATE lesson_mp3_jobs SET state='interrupted',updated_at=now() WHERE state='running' AND lease_until<now();
 UPDATE lesson_mp3_versions v SET status='failed',last_error='Worker interrupted; resume checks stored audio before any new request',updated_at=now()
 FROM lesson_mp3_jobs expired_job WHERE expired_job.version_id=v.id AND expired_job.state='interrupted' AND v.status='generating';
 SELECT * INTO j FROM lesson_mp3_jobs WHERE state='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 UPDATE lesson_mp3_jobs SET state='running',token=gen_random_uuid(),lease_until=now()+interval '10 minutes',attempts=attempts+1,updated_at=now() WHERE id=j.id RETURNING * INTO j;
 UPDATE lesson_mp3_control SET lease_until=j.lease_until WHERE id=1;
 UPDATE lesson_mp3_versions SET status='generating',last_error=NULL,updated_at=now() WHERE id=j.version_id;
 RETURN NEXT j;
END $$;
CREATE FUNCTION public.lesson_mp3_checkpoint(p_job uuid,p_token uuid,p_patch jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE j lesson_mp3_jobs; s text;
BEGIN
 SELECT * INTO j FROM lesson_mp3_jobs WHERE id=p_job AND token=p_token AND state='running' AND lease_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 s=coalesce(p_patch->>'status','generating');
 UPDATE lesson_mp3_versions SET status=s,raw_path=coalesce(p_patch->>'raw_path',raw_path),storage_path=coalesce(p_patch->>'storage_path',storage_path),
 raw_bytes=coalesce((p_patch->>'raw_bytes')::bigint,raw_bytes),bytes=coalesce((p_patch->>'bytes')::bigint,bytes),duration=coalesce((p_patch->>'duration')::double precision,duration),
 provider=coalesce(p_patch->>'provider',provider),model=coalesce(p_patch->>'model',model),last_error=p_patch->>'error',updated_at=now() WHERE id=j.version_id;
 IF s IN ('pending','failed') THEN
 UPDATE lesson_mp3_jobs SET state=CASE WHEN s='pending' THEN 'complete' ELSE 'failed' END,lease_until=NULL,updated_at=now() WHERE id=j.id;
 UPDATE lesson_mp3_control SET lease_until=NULL,blocked_until=coalesce((p_patch->>'blocked_until')::timestamptz,blocked_until) WHERE id=1;
 END IF;
 RETURN true;
END $$;
CREATE FUNCTION public.lesson_mp3_reserve(p_job uuid,p_token uuid,p_provider text,p_model text,p_interval int,p_daily int,p_tokens int,p_tpm int) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c lesson_mp3_control; v uuid; event_id uuid;
BEGIN
 SELECT version_id INTO v FROM lesson_mp3_jobs WHERE id=p_job AND token=p_token AND state='running' AND lease_until>now();
 IF v IS NULL THEN RAISE EXCEPTION 'Worker lease expired'; END IF;
 SELECT * INTO c FROM lesson_mp3_control WHERE id=1 FOR UPDATE;
 IF (SELECT count(*) FROM lesson_mp3_events WHERE kind='tts_attempt' AND (created_at AT TIME ZONE 'Asia/Yangon')::date=public.mm_today())>=p_daily THEN RETURN jsonb_build_object('wait',86400,'reason','configured_daily_budget'); END IF;
 IF coalesce((SELECT sum(input_tokens_estimate) FROM lesson_mp3_events WHERE kind='tts_attempt' AND created_at>now()-interval '1 minute'),0)+p_tokens>p_tpm THEN RETURN jsonb_build_object('wait',60,'reason','configured_token_pacing'); END IF;
 IF (c.provider_next->>p_provider)::timestamptz>now() THEN RETURN jsonb_build_object('wait',ceil(extract(epoch FROM (c.provider_next->>p_provider)::timestamptz-now())),'reason','pacing'); END IF;
 UPDATE lesson_mp3_control SET next_request_at=now()+make_interval(secs=>greatest(20,p_interval)),provider_next=jsonb_set(provider_next,ARRAY[p_provider],to_jsonb(now()+make_interval(secs=>greatest(20,p_interval)))) WHERE id=1;
 INSERT INTO lesson_mp3_events(version_id,kind,provider,model,input_tokens_estimate) VALUES(v,'tts_attempt',p_provider,p_model,p_tokens) RETURNING id INTO event_id;
 RETURN jsonb_build_object('id',event_id,'wait',0);
END $$;
CREATE FUNCTION public.lesson_mp3_review(p_version uuid,p_user uuid,p_action text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v lesson_mp3_versions;
BEGIN
 SELECT * INTO STRICT v FROM lesson_mp3_versions WHERE id=p_version FOR UPDATE;
 PERFORM 1 FROM lesson_mp3_catalog WHERE id=v.clip_id FOR UPDATE;
 IF p_action='approve' THEN
 IF v.status NOT IN ('pending','approved') OR v.storage_path IS NULL OR v.bytes<=0 OR v.duration<=0 THEN RAISE EXCEPTION 'Audio is not ready for approval'; END IF;
 UPDATE lesson_mp3_versions SET status='approved',reviewed_by=p_user,reviewed_at=now(),updated_at=now() WHERE id=v.id;
 UPDATE lesson_mp3_catalog SET approved_version=v.id WHERE id=v.clip_id AND script_hash=v.script_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'Script identity changed; approval refused'; END IF;
 ELSIF p_action='reject' THEN
 IF v.status NOT IN ('pending','approved') THEN RAISE EXCEPTION 'Only reviewed or pending audio can be rejected'; END IF;
 UPDATE lesson_mp3_catalog SET approved_version=NULL WHERE id=v.clip_id AND approved_version=v.id;
 UPDATE lesson_mp3_versions SET status='rejected',reviewed_by=p_user,reviewed_at=now(),updated_at=now() WHERE id=v.id AND status IN ('pending','approved');
 ELSE RAISE EXCEPTION 'Invalid review action'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.lesson_mp3_enqueue(text,uuid,boolean),public.lesson_mp3_claim(),public.lesson_mp3_checkpoint(uuid,uuid,jsonb),public.lesson_mp3_reserve(uuid,uuid,text,text,int,int,int,int),public.lesson_mp3_review(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_mp3_enqueue(text,uuid,boolean),public.lesson_mp3_claim(),public.lesson_mp3_checkpoint(uuid,uuid,jsonb),public.lesson_mp3_reserve(uuid,uuid,text,text,int,int,int,int),public.lesson_mp3_review(uuid,uuid,text) TO service_role;
CREATE FUNCTION public.lesson_mp3_stats() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT jsonb_build_object(
 'ttsSuccess',(SELECT count(*) FROM lesson_mp3_events WHERE kind='tts_attempt' AND http_status BETWEEN 200 AND 299),
 'ttsFailed',(SELECT count(*) FROM lesson_mp3_events WHERE kind='tts_attempt' AND (http_status>=400 OR http_status=0)),
 'gatewayRequests',(SELECT count(*) FROM lesson_mp3_events WHERE kind='tts_attempt' AND provider='lovable_gateway'),
 'directRequests',(SELECT count(*) FROM lesson_mp3_events WHERE kind='tts_attempt' AND provider='direct_gemini'),
 'unconfirmedRequests',(SELECT count(*) FROM lesson_mp3_events WHERE kind='tts_attempt' AND http_status IS NULL),
 'reused',(SELECT count(*) FROM lesson_mp3_events WHERE kind IN ('reused_wav','recovered_mp3')),
 'newAudio',(SELECT count(*) FROM lesson_mp3_events WHERE kind='new_audio'),
 'storageBytes',(SELECT coalesce(sum(bytes+raw_bytes),0) FROM lesson_mp3_versions),
 'mp3Bytes',(SELECT coalesce(sum(bytes),0) FROM lesson_mp3_versions),
 'rawBytes',(SELECT coalesce(sum(raw_bytes),0) FROM lesson_mp3_versions),
 'lastFailure',(SELECT last_error FROM lesson_mp3_versions WHERE last_error IS NOT NULL ORDER BY updated_at DESC LIMIT 1),
 'generatedSeconds',(SELECT coalesce(sum(duration),0) FROM lesson_mp3_versions v WHERE EXISTS(SELECT 1 FROM lesson_mp3_events e WHERE e.version_id=v.id AND e.kind='new_audio')),
 'estimatedCostUsd',NULL
 );
$$;
REVOKE ALL ON FUNCTION public.lesson_mp3_stats() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_mp3_stats() TO service_role;
-- Persist Retry-After per provider even when the other provider successfully completes the job.
CREATE FUNCTION public.lesson_mp3_backoff(p_job uuid,p_token uuid,p_provider text,p_seconds int) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM lesson_mp3_jobs WHERE id=p_job AND token=p_token AND state='running' AND lease_until>now()) THEN RETURN false; END IF;
 UPDATE lesson_mp3_control SET provider_next=jsonb_set(provider_next,ARRAY[p_provider],to_jsonb(greatest(coalesce((provider_next->>p_provider)::timestamptz,now()),now()+make_interval(secs=>greatest(0,p_seconds))))) WHERE id=1;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.lesson_mp3_backoff(uuid,uuid,text,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_mp3_backoff(uuid,uuid,text,int) TO service_role;
