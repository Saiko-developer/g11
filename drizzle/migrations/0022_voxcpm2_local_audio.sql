ALTER TABLE public.lesson_mp3_jobs
  ADD COLUMN engine text NOT NULL DEFAULT 'gemini' CHECK (engine IN ('gemini','voxcpm2')),
  ADD COLUMN progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  ADD COLUMN asset_token uuid;

CREATE INDEX lesson_mp3_local_active ON public.lesson_mp3_jobs (state,created_at)
  WHERE engine='voxcpm2' AND state IN ('queued','running');

-- Preserve the cloud worker's global lease and pacing. Local jobs have their own lease.
CREATE FUNCTION public.lesson_mp3_claim_cloud(p_clips text[])
RETURNS SETOF public.lesson_mp3_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c lesson_mp3_control; j lesson_mp3_jobs;
BEGIN
 SELECT * INTO c FROM lesson_mp3_control WHERE id=1 FOR UPDATE;
 IF c.lease_until>now() OR c.blocked_until>now() OR c.next_request_at>now() THEN RETURN; END IF;
 UPDATE lesson_mp3_jobs SET state='interrupted',updated_at=now()
 WHERE engine='gemini' AND state='running' AND lease_until<now();
 UPDATE lesson_mp3_versions v SET status='failed',last_error='Worker interrupted; resume checks stored audio before any new request',updated_at=now()
 FROM lesson_mp3_jobs j2 WHERE j2.version_id=v.id AND j2.engine='gemini' AND j2.state='interrupted' AND v.status='generating';
 SELECT * INTO j FROM lesson_mp3_jobs WHERE engine='gemini' AND state='queued'
   AND (p_clips IS NULL OR clip_id=ANY(p_clips)) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 UPDATE lesson_mp3_jobs SET state='running',token=gen_random_uuid(),lease_until=now()+interval '10 minutes',attempts=attempts+1,updated_at=now() WHERE id=j.id RETURNING * INTO j;
 UPDATE lesson_mp3_control SET lease_until=j.lease_until WHERE id=1;
 UPDATE lesson_mp3_versions SET status='generating',last_error=NULL,updated_at=now() WHERE id=j.version_id;
 RETURN NEXT j;
END $$;

CREATE OR REPLACE FUNCTION public.lesson_mp3_claim()
 RETURNS SETOF public.lesson_mp3_jobs LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$
 SELECT * FROM lesson_mp3_claim_cloud(NULL::text[]);
$$;
CREATE OR REPLACE FUNCTION public.lesson_mp3_claim_selection(p_clips text[])
 RETURNS SETOF public.lesson_mp3_jobs LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$
 SELECT * FROM lesson_mp3_claim_cloud(coalesce(p_clips,'{}'::text[]));
$$;

CREATE FUNCTION public.lesson_mp3_local_enqueue(p_clip text,p_user uuid,p_regenerate boolean,p_script text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c lesson_mp3_catalog; v uuid; existing_engine text;
BEGIN
 SELECT * INTO STRICT c FROM lesson_mp3_catalog WHERE id=p_clip FOR UPDATE;
 IF c.removed_from_lesson THEN RAISE EXCEPTION 'Clip is removed'; END IF;
 IF p_script IS NOT NULL THEN
   v=lesson_mp3_enqueue_draft(p_clip,p_user,p_script);
   UPDATE lesson_mp3_jobs SET engine='voxcpm2' WHERE version_id=v;
 ELSE
   SELECT av.id,j.engine INTO v,existing_engine FROM lesson_mp3_versions av
    LEFT JOIN lesson_mp3_jobs j ON j.version_id=av.id
    WHERE av.clip_id=p_clip AND av.status IN ('queued','generating','pending') LIMIT 1;
   IF v IS NOT NULL THEN
     IF existing_engine IS DISTINCT FROM 'voxcpm2' THEN RAISE EXCEPTION 'Clip already has an active version'; END IF;
     RETURN v;
   END IF;
   IF c.approved_version IS NOT NULL AND NOT p_regenerate THEN RETURN c.approved_version; END IF;
   INSERT INTO lesson_mp3_versions(clip_id,script_hash,script_version,created_by)
   VALUES(p_clip,c.script_hash,c.script_version,p_user) RETURNING id INTO v;
   INSERT INTO lesson_mp3_jobs(version_id,clip_id,regenerate,engine)
   VALUES(v,p_clip,p_regenerate,'voxcpm2');
 END IF;
 UPDATE lesson_mp3_versions SET provider='voxcpm2_local',voice='VoxCPM2 Burmese Teacher',model='VoxCPM2-Q8_0' WHERE id=v;
 RETURN v;
END $$;

CREATE FUNCTION public.lesson_mp3_local_requeue(p_version uuid,p_generate boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE j lesson_mp3_jobs; c lesson_mp3_catalog; target_clip text;
BEGIN
 SELECT clip_id INTO target_clip FROM lesson_mp3_jobs WHERE version_id=p_version AND engine='voxcpm2';
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO c FROM lesson_mp3_catalog WHERE id=target_clip FOR UPDATE;
 IF NOT FOUND OR c.removed_from_lesson THEN RETURN false; END IF;
 SELECT * INTO j FROM lesson_mp3_jobs
 WHERE version_id=p_version AND engine='voxcpm2' AND state IN ('failed','interrupted') FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM lesson_mp3_versions WHERE clip_id=j.clip_id AND id<>p_version AND status IN ('queued','generating','pending')) THEN RETURN false; END IF;
 UPDATE lesson_mp3_versions SET status='queued',last_error=NULL,updated_at=now()
 WHERE id=p_version AND script_hash=c.script_hash AND status='failed';
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE lesson_mp3_jobs SET state='queued',token=NULL,progress=0,allow_generation=p_generate,updated_at=now() WHERE id=j.id;
 RETURN true;
END $$;

CREATE FUNCTION public.lesson_mp3_local_expire()
 RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$
 WITH expired AS (
   UPDATE lesson_mp3_jobs j SET state='interrupted',updated_at=now()
   FROM lesson_mp3_catalog c
   WHERE j.clip_id=c.id AND j.engine='voxcpm2' AND (
     (j.state='running' AND j.lease_until<=now())
     OR (j.state IN ('queued','running') AND c.removed_from_lesson)
   ) RETURNING j.version_id,c.removed_from_lesson
 )
 UPDATE lesson_mp3_versions v SET status='failed',last_error=
   CASE WHEN expired.removed_from_lesson THEN 'Clip removed from the lesson.'
        ELSE 'Mac companion disconnected. Resume stored audio or retry on the Mac.' END,updated_at=now()
 FROM expired WHERE v.id=expired.version_id AND v.status IN ('queued','generating');
$$;

CREATE FUNCTION public.lesson_mp3_local_claim()
RETURNS SETOF public.lesson_mp3_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE j lesson_mp3_jobs;
BEGIN
 PERFORM pg_advisory_xact_lock(740922);
 PERFORM lesson_mp3_local_expire();
 IF EXISTS(SELECT 1 FROM lesson_mp3_jobs WHERE engine='voxcpm2' AND state='running') THEN RETURN; END IF;
 SELECT q.* INTO j FROM lesson_mp3_jobs q JOIN lesson_mp3_catalog c ON c.id=q.clip_id
 WHERE q.engine='voxcpm2' AND q.state='queued' AND NOT c.removed_from_lesson
 ORDER BY c.grade,c.unit,c.lesson_id,c.segment_order,q.created_at FOR UPDATE OF q SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 UPDATE lesson_mp3_jobs SET state='running',token=gen_random_uuid(),lease_until=now()+interval '2 minutes',
   attempts=attempts+1,progress=0,updated_at=now() WHERE id=j.id RETURNING * INTO j;
 UPDATE lesson_mp3_versions SET status='generating',last_error=NULL,updated_at=now() WHERE id=j.version_id;
 RETURN NEXT j;
END $$;

CREATE FUNCTION public.lesson_mp3_local_step(p_job uuid,p_token uuid,p_stage text,p_progress integer DEFAULT 0,p_patch jsonb DEFAULT '{}')
RETURNS SETOF public.lesson_mp3_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE j lesson_mp3_jobs; v lesson_mp3_versions;
BEGIN
 SELECT * INTO j FROM lesson_mp3_jobs WHERE id=p_job AND token=p_token AND engine='voxcpm2' FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF j.state='complete' AND p_stage='attach' THEN RETURN NEXT j; RETURN; END IF;
 IF j.state<>'running' OR j.lease_until<=now() THEN RETURN; END IF;
 IF EXISTS(SELECT 1 FROM lesson_mp3_catalog WHERE id=j.clip_id AND removed_from_lesson) THEN RETURN; END IF;
 IF p_stage IN ('beat','attach') THEN
   UPDATE lesson_mp3_jobs SET lease_until=now()+interval '2 minutes',
     progress=greatest(progress,CASE WHEN p_stage='attach' THEN 95 ELSE least(90,p_progress) END),
     asset_token=CASE WHEN p_stage='attach' THEN p_token ELSE asset_token END,updated_at=now()
   WHERE id=j.id RETURNING * INTO j;
 ELSIF p_stage='pending' THEN
   SELECT * INTO v FROM lesson_mp3_versions WHERE id=j.version_id FOR UPDATE;
   IF v.status<>'generating' OR NOT EXISTS(
     SELECT 1 FROM lesson_mp3_catalog WHERE id=j.clip_id AND script_hash=v.script_hash AND NOT removed_from_lesson
   ) THEN RETURN; END IF;
   UPDATE lesson_mp3_versions SET status='pending',raw_path=p_patch->>'raw_path',storage_path=p_patch->>'storage_path',
      raw_bytes=(p_patch->>'raw_bytes')::bigint,bytes=(p_patch->>'bytes')::bigint,duration=(p_patch->>'duration')::double precision,
      last_error=NULL,updated_at=now() WHERE id=j.version_id;
   INSERT INTO lesson_mp3_events(version_id,kind,provider,model) VALUES(j.version_id,'local_audio','voxcpm2_local','VoxCPM2-Q8_0');
   UPDATE lesson_mp3_jobs SET state='complete',lease_until=NULL,progress=100,updated_at=now() WHERE id=j.id RETURNING * INTO j;
 ELSIF p_stage='failed' THEN
   UPDATE lesson_mp3_versions SET status='failed',last_error=left(p_patch->>'error',250),updated_at=now() WHERE id=j.version_id AND status='generating';
   UPDATE lesson_mp3_jobs SET state='failed',lease_until=NULL,updated_at=now() WHERE id=j.id RETURNING * INTO j;
 ELSE RETURN;
 END IF;
 RETURN NEXT j;
END $$;

REVOKE ALL ON FUNCTION public.lesson_mp3_claim_cloud(text[]),public.lesson_mp3_local_enqueue(text,uuid,boolean,text),
 public.lesson_mp3_local_requeue(uuid,boolean),public.lesson_mp3_local_expire(),public.lesson_mp3_local_claim(),
 public.lesson_mp3_local_step(uuid,uuid,text,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_mp3_claim_cloud(text[]),public.lesson_mp3_local_enqueue(text,uuid,boolean,text),
 public.lesson_mp3_local_requeue(uuid,boolean),public.lesson_mp3_local_expire(),public.lesson_mp3_local_claim(),
 public.lesson_mp3_local_step(uuid,uuid,text,integer,jsonb) TO service_role;
