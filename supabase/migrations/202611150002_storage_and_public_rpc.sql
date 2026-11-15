-- M2: Private spec PDF storage bucket, onboarding RPC, rate limits, and public-tier RPC

-- 1. Private storage bucket for uploaded spec PDFs (max 10 MB, application/pdf only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('spec-pdfs', 'spec-pdfs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "org members can read spec-pdfs" ON storage.objects;
CREATE POLICY "org members can read spec-pdfs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'spec-pdfs'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org members can upload spec-pdfs" ON storage.objects;
CREATE POLICY "org members can upload spec-pdfs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'spec-pdfs'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org members can delete spec-pdfs" ON storage.objects;
CREATE POLICY "org members can delete spec-pdfs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'spec-pdfs'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- 2. Atomic single-personal-org onboarding on first sign-in (prevents race/escalation)
CREATE OR REPLACE FUNCTION public.ensure_personal_org(p_org_name text DEFAULT NULL)
RETURNS TABLE (
  org_id uuid,
  org_name text,
  org_slug text,
  role text,
  billing_status text,
  comp_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_org_id uuid;
  v_clean_name text;
  v_base_slug text;
BEGIN
  v_uid := (SELECT auth.uid());
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Serialize concurrent first-login onboarding per user
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));

  RETURN QUERY
  SELECT o.id, o.name, o.slug, m.role, o.billing_status, o.comp_enabled
  FROM public.members m
  JOIN public.organizations o ON o.id = m.org_id
  WHERE m.user_id = v_uid
  ORDER BY m.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  v_clean_name := NULLIF(left(trim(coalesce(p_org_name, '')), 120), '');
  IF v_clean_name IS NULL THEN
    v_clean_name := 'Battery Brand Workspace';
  END IF;

  v_base_slug := 'org-' || substr(replace(v_uid::text, '-', ''), 1, 12);

  INSERT INTO public.organizations (name, slug, billing_status, comp_enabled)
  VALUES (v_clean_name, v_base_slug, 'free', false)
  RETURNING id INTO v_org_id;

  INSERT INTO public.members (org_id, user_id, role)
  VALUES (v_org_id, v_uid, 'owner');

  INSERT INTO public.audit_log (org_id, actor_user_id, action, target_type, target_id, metadata)
  VALUES (v_org_id, v_uid, 'org.created', 'organization', v_org_id, jsonb_build_object('name', v_clean_name));

  RETURN QUERY
  SELECT o.id, o.name, o.slug, m.role, o.billing_status, o.comp_enabled
  FROM public.members m
  JOIN public.organizations o ON o.id = m.org_id
  WHERE m.org_id = v_org_id AND m.user_id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_personal_org(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_personal_org(text) TO authenticated;

-- 3. Public passport read RPC: published ONLY + public-tier fields ONLY
CREATE OR REPLACE FUNCTION public.get_published_passport(p_slug text)
RETURNS TABLE (
  slug text,
  version_number integer,
  snapshot_public_fields jsonb,
  declared_at timestamptz,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.slug,
    v.version_number,
    v.snapshot_public_fields,
    v.declared_at,
    v.created_at AS published_at
  FROM public.passports p
  JOIN public.passport_versions v ON v.id = p.current_version_id
  WHERE p.slug = p_slug
    AND p.status = 'published'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_passport(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_passport(text) TO anon, authenticated;

-- 4. Distributed sliding-window rate limiter RPC (server-role only)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_hits integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_count integer;
BEGIN
  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
      WHEN public.rate_limits.window_start + make_interval(secs => p_window_seconds) <= v_now THEN 1
      ELSE public.rate_limits.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limits.window_start + make_interval(secs => p_window_seconds) <= v_now THEN v_now
      ELSE public.rate_limits.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_hits;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- 5. Daily per-org extraction usage counter (UTC day boundary)
CREATE OR REPLACE FUNCTION public.get_org_daily_extraction_count(p_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.uploads u
  WHERE u.org_id = p_org_id
    AND u.created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    AND (public.is_org_member(p_org_id) OR current_setting('request.jwt.claim.role', true) = 'service_role');
$$;

REVOKE ALL ON FUNCTION public.get_org_daily_extraction_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_daily_extraction_count(uuid) TO authenticated, service_role;
