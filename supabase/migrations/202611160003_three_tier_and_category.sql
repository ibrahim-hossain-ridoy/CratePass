-- Change 1: 3-tier Annex XIII access snapshots (public, legitimate_interest, authorities_only) & battery_category

ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS battery_category text NOT NULL DEFAULT 'LMT'
  CHECK (battery_category IN ('LMT', 'EV', 'industrial'));

ALTER TABLE public.passport_versions
  ADD COLUMN IF NOT EXISTS battery_category text NOT NULL DEFAULT 'LMT'
  CHECK (battery_category IN ('LMT', 'EV', 'industrial'));

ALTER TABLE public.passport_versions
  ADD COLUMN IF NOT EXISTS snapshot_legitimate_interest_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.passport_versions
  ADD COLUMN IF NOT EXISTS snapshot_authorities_only_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Public passport RPC remains strictly restricted to published status + snapshot_public_fields ONLY.
-- Never returns snapshot_all_fields, snapshot_legitimate_interest_fields, or snapshot_authorities_only_fields.
DROP FUNCTION IF EXISTS public.get_published_passport(text);

CREATE OR REPLACE FUNCTION public.get_published_passport(p_slug text)
RETURNS TABLE (
  slug text,
  battery_category text,
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
    p.battery_category,
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
