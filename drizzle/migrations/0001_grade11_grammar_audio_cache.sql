CREATE TABLE public.grade11_grammar_audio (
  hash text PRIMARY KEY,
  unit integer NOT NULL,
  status text NOT NULL DEFAULT 'generating',
  storage_path text,
  bytes integer NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'audio/wav',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  lease_until timestamptz,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.grade11_grammar_audio TO service_role;
ALTER TABLE public.grade11_grammar_audio ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.grade11_grammar_audio IS 'Shared cache index for fixed, authored Grade 11 grammar narration audio. Server-only; never student content.';

CREATE TABLE public.grade11_grammar_audio_stats (
  day date PRIMARY KEY DEFAULT public.mm_today(),
  hits integer NOT NULL DEFAULT 0,
  misses integer NOT NULL DEFAULT 0,
  generated integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.grade11_grammar_audio_stats TO service_role;
ALTER TABLE public.grade11_grammar_audio_stats ENABLE ROW LEVEL SECURITY;

-- Claim generation ownership. Returns 'ready' (use stored file), 'owner' (you generate), 'busy' (someone else is), 'gave_up'.
CREATE OR REPLACE FUNCTION public.grade11_audio_claim(p_hash text, p_unit integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.grade11_grammar_audio;
BEGIN
  INSERT INTO public.grade11_grammar_audio(hash, unit, status, attempts, lease_until)
  VALUES (p_hash, p_unit, 'generating', 1, now() + interval '90 seconds')
  ON CONFLICT (hash) DO NOTHING;
  IF FOUND THEN RETURN 'owner'; END IF;
  SELECT * INTO r FROM public.grade11_grammar_audio WHERE hash = p_hash FOR UPDATE;
  IF r.status = 'ready' THEN RETURN 'ready'; END IF;
  IF r.status = 'generating' AND r.lease_until > now() THEN RETURN 'busy'; END IF;
  IF r.attempts >= 5 AND r.updated_at > now() - interval '1 hour' THEN RETURN 'gave_up'; END IF;
  UPDATE public.grade11_grammar_audio SET status = 'generating',
    attempts = CASE WHEN r.updated_at <= now() - interval '1 hour' THEN 1 ELSE attempts + 1 END,
    lease_until = now() + interval '90 seconds', updated_at = now() WHERE hash = p_hash;
  RETURN 'owner';
END $$;

CREATE OR REPLACE FUNCTION public.grade11_audio_stat(p_kind text, p_hash text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.grade11_grammar_audio_stats(day) VALUES (public.mm_today()) ON CONFLICT DO NOTHING;
  UPDATE public.grade11_grammar_audio_stats SET
    hits = hits + (p_kind = 'hit')::int, misses = misses + (p_kind = 'miss')::int,
    generated = generated + (p_kind = 'generated')::int, errors = errors + (p_kind = 'error')::int
  WHERE day = public.mm_today();
  IF p_kind = 'hit' AND p_hash IS NOT NULL THEN
    UPDATE public.grade11_grammar_audio SET hit_count = hit_count + 1 WHERE hash = p_hash;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.grade11_audio_claim(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grade11_audio_stat(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grade11_audio_claim(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.grade11_audio_stat(text, text) TO service_role;