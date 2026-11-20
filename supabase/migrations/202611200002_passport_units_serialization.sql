-- M11: Model-to-Unit Bulk CSV Serialization & GS1 Digital Link Item-Level Public Routes
-- Run after 202611200001_supplier_magic_links.sql

CREATE TABLE IF NOT EXISTS public.passport_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  serial_number text NOT NULL CHECK (char_length(trim(serial_number)) BETWEEN 1 AND 120),
  gtin text CHECK (gtin IS NULL OR gtin ~ '^[0-9]{14}$'),
  batch_lot text CHECK (batch_lot IS NULL OR char_length(batch_lot) <= 120),
  manufacturing_date date,
  unit_status text NOT NULL DEFAULT 'active'
    CHECK (unit_status IN ('active', 'repaired', 'repurposed', 'waste')),
  dynamic_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (passport_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_passport_units_workspace
  ON public.passport_units (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_passport_units_passport_serial
  ON public.passport_units (passport_id, serial_number);

CREATE INDEX IF NOT EXISTS idx_passport_units_gtin_serial
  ON public.passport_units (gtin, serial_number)
  WHERE gtin IS NOT NULL;

ALTER TABLE public.passport_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace members can manage passport units" ON public.passport_units;
CREATE POLICY "workspace members can manage passport units"
  ON public.passport_units FOR ALL TO authenticated
  USING (public.is_org_member(workspace_id))
  WITH CHECK (public.is_org_member(workspace_id));

-- Public item-level projection RPC (/p/[slug]/u/[serial]):
-- Returns published parent public fields + unit identity ONLY (never restricted tiers or private dynamic_overrides).
DROP FUNCTION IF EXISTS public.get_published_passport_unit(text, text);
CREATE OR REPLACE FUNCTION public.get_published_passport_unit(
  p_slug text,
  p_serial text
)
RETURNS TABLE (
  slug text,
  battery_category text,
  version_number integer,
  snapshot_public_fields jsonb,
  declared_at timestamptz,
  published_at timestamptz,
  serial_number text,
  gtin text,
  batch_lot text,
  manufacturing_date date,
  unit_status text
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
    v.created_at AS published_at,
    u.serial_number,
    u.gtin,
    u.batch_lot,
    u.manufacturing_date,
    u.unit_status
  FROM public.passport_units u
  JOIN public.passports p ON p.id = u.passport_id
  JOIN public.passport_versions v ON v.id = p.current_version_id
  WHERE p.slug = p_slug
    AND p.status = 'published'
    AND lower(u.serial_number) = lower(p_serial)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_passport_unit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_passport_unit(text, text) TO anon, authenticated;

-- Public GS1 Digital Link projection RPC (/01/[gtin]/21/[serial]):
-- Resolves GTIN + serial strictly for published passports and public-tier fields ONLY.
DROP FUNCTION IF EXISTS public.get_published_passport_by_gs1(text, text);
CREATE OR REPLACE FUNCTION public.get_published_passport_by_gs1(
  p_gtin text,
  p_serial text
)
RETURNS TABLE (
  slug text,
  battery_category text,
  version_number integer,
  snapshot_public_fields jsonb,
  declared_at timestamptz,
  published_at timestamptz,
  serial_number text,
  gtin text,
  batch_lot text,
  manufacturing_date date,
  unit_status text
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
    v.created_at AS published_at,
    u.serial_number,
    u.gtin,
    u.batch_lot,
    u.manufacturing_date,
    u.unit_status
  FROM public.passport_units u
  JOIN public.passports p ON p.id = u.passport_id
  JOIN public.passport_versions v ON v.id = p.current_version_id
  WHERE u.gtin = p_gtin
    AND lower(u.serial_number) = lower(p_serial)
    AND p.status = 'published'
  ORDER BY u.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_passport_by_gs1(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_passport_by_gs1(text, text) TO anon, authenticated;
