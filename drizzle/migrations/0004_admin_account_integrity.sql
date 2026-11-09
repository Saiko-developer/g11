-- Preserve balances and active-user workflows; never reset data.
CREATE OR REPLACE FUNCTION public.is_active_ai_account() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND (p.status = 'active' OR (p.status = 'suspended' AND p.suspended_until <= now()))
  );
$$;
REVOKE ALL ON FUNCTION public.is_active_ai_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_ai_account() TO authenticated, service_role;

-- Suspended role holders retain their role assignment, but cannot exercise admin privileges.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (public.has_role(_user_id, 'admin') OR public.is_main_admin(_user_id))
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id
      AND (p.status = 'active' OR (p.status = 'suspended' AND p.suspended_until <= now())));
$$;

CREATE OR REPLACE FUNCTION public.consume_tutor_message() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); q jsonb;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'signin'); END IF;
  IF NOT public.is_active_ai_account() THEN RETURN jsonb_build_object('ok', false, 'reason', 'suspended'); END IF;
  q := public.tutor_quota();
  IF (q->>'unlimited')::boolean THEN RETURN jsonb_build_object('ok', true); END IF;
  IF (q->>'daily_left')::int > 0 THEN
    INSERT INTO public.tutor_usage (user_id, day, used) VALUES (uid, public.mm_today(), 1)
    ON CONFLICT (user_id, day) DO UPDATE SET used = public.tutor_usage.used + 1;
    RETURN jsonb_build_object('ok', true);
  ELSIF (q->>'bonus_left')::int > 0 THEN
    UPDATE public.tutor_wallets SET bonus_left = bonus_left - 1, updated_at = now() WHERE user_id = uid;
    RETURN jsonb_build_object('ok', true);
  END IF;
  RETURN jsonb_build_object('ok', false, 'reason', 'limit');
END $$;

CREATE OR REPLACE FUNCTION public.start_speaking_session(p_unit integer) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); st json; sid uuid;
BEGIN
  IF uid IS NULL THEN RETURN json_build_object('ok', false, 'reason', 'signin'); END IF;
  IF NOT public.is_active_ai_account() THEN RETURN json_build_object('ok', false, 'reason', 'suspended'); END IF;
  st := public.speaking_unit_status(p_unit);
  IF NOT (st->>'unlimited')::boolean AND (st->>'used')::int >= (st->>'limit')::int THEN
    RETURN json_build_object('ok', false, 'reason', 'unit_limit');
  END IF;
  INSERT INTO public.speaking_sessions(user_id, unit) VALUES (uid, p_unit) RETURNING id INTO sid;
  RETURN json_build_object('ok', true, 'session', sid);
END $$;

CREATE OR REPLACE FUNCTION public.speaking_turn(p_session uuid) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.speaking_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RETURN json_build_object('ok', false, 'reason', 'signin'); END IF;
  IF NOT public.is_active_ai_account() THEN RETURN json_build_object('ok', false, 'reason', 'suspended'); END IF;
  SELECT * INTO s FROM public.speaking_sessions WHERE id = p_session AND user_id = auth.uid() FOR UPDATE;
  IF s.id IS NULL THEN RETURN json_build_object('ok', false, 'reason', 'no_session'); END IF;
  IF s.expires_at < now() THEN RETURN json_build_object('ok', false, 'reason', 'expired'); END IF;
  IF s.turns >= 20 THEN RETURN json_build_object('ok', false, 'reason', 'limit'); END IF;
  UPDATE public.speaking_sessions SET turns = turns + 1 WHERE id = s.id;
  RETURN json_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_tutor_update(_user uuid, _add_bonus integer, _scholarship text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) OR NOT public.is_active_ai_account() THEN RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501'; END IF;
  IF COALESCE(_add_bonus, 0) < 0 OR COALESCE(_add_bonus, 0) > 100000 THEN RAISE EXCEPTION 'Invalid credit amount' USING ERRCODE = '22023'; END IF;
  IF NULLIF(btrim(_scholarship), '') IS NOT NULL AND _scholarship NOT IN ('none','approved','rejected') THEN RAISE EXCEPTION 'Invalid scholarship status' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.tutor_wallets (user_id) VALUES (_user) ON CONFLICT DO NOTHING;
  UPDATE public.tutor_wallets SET bonus_left = greatest(bonus_left + COALESCE(_add_bonus, 0), 0),
    scholarship = COALESCE(NULLIF(btrim(_scholarship), ''), scholarship), updated_at = now() WHERE user_id = _user;
END $$;

CREATE OR REPLACE FUNCTION public.admin_exam_credit(_user uuid, _add integer) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) OR NOT public.is_active_ai_account() THEN RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501'; END IF;
  IF _add IS NULL OR _add < 0 OR _add > 100000 THEN RAISE EXCEPTION 'Invalid credit amount' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.tutor_wallets (user_id) VALUES (_user) ON CONFLICT DO NOTHING;
  UPDATE public.tutor_wallets SET exam_bonus_left = greatest(exam_bonus_left + _add, 0), updated_at = now() WHERE user_id = _user;
END $$;

-- Server-owned snapshot: no hard-coded emails, guessed bonuses or separate query row limits.
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
  ), accounts AS (
    SELECT p.id, p.email, p.full_name, p.avatar_url, p.status, p.suspended_until, p.created_at, p.last_seen_at,
      COALESCE(w.bonus_left, 0) AS tutor_bonus, COALESCE(w.exam_bonus_left, 0) AS exam_bonus,
      COALESCE(u.used, 0) AS tutor_used_today, COALESCE(e.used, 0) AS exam_used_today,
      COALESCE(NULLIF(w.scholarship, ''), 'none') AS scholarship, w.scholarship_note,
      (public.has_role(p.id, 'admin') OR public.is_main_admin(p.id)) AS is_admin, public.has_role(p.id, 'teacher') AS is_teacher,
      public.is_main_admin(p.id) AS is_main_admin
    FROM public.profiles p
    LEFT JOIN public.tutor_wallets w ON w.user_id = p.id
    LEFT JOIN public.tutor_usage u ON u.user_id = p.id AND u.day = public.mm_today()
    LEFT JOIN exams e ON e.user_id = p.id
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.last_seen_at DESC, a.id), '[]'::jsonb)
  INTO result FROM accounts a;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.consume_tutor_message(), public.admin_account_summaries(),
  public.admin_tutor_update(uuid,integer,text), public.admin_exam_credit(uuid,integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_tutor_message(), public.admin_account_summaries(),
  public.admin_tutor_update(uuid,integer,text), public.admin_exam_credit(uuid,integer)
  TO authenticated, service_role;

-- Enforce main-admin profile protection even for direct authenticated PATCH requests.
DROP POLICY IF EXISTS "admin update profile" ON public.profiles;
CREATE POLICY "admin update profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) AND NOT public.is_main_admin(id))
  WITH CHECK (public.is_admin(auth.uid()) AND NOT public.is_main_admin(id));
