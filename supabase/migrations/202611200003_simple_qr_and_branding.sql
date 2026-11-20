-- M12 & M13: Simple QR Mode (Article 13(6)) + Workspace Branding & Custom Domain
-- Run after 202611200002_passport_units_serialization.sql

-- 1. Simple QR record_mode & optional DoC PDF path on passports / passport_versions
ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS record_mode text NOT NULL DEFAULT 'full_passport'
  CHECK (record_mode IN ('full_passport', 'simple_qr'));

ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS simple_qr_doc_path text;

ALTER TABLE public.passport_versions
  ADD COLUMN IF NOT EXISTS record_mode text NOT NULL DEFAULT 'full_passport'
  CHECK (record_mode IN ('full_passport', 'simple_qr'));

ALTER TABLE public.passport_versions
  ADD COLUMN IF NOT EXISTS snapshot_sha256 text;

-- 2. Workspace branding & custom domain columns on organizations (M13)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS brand_logo_url text;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS brand_accent_hex text
  CHECK (brand_accent_hex IS NULL OR brand_accent_hex ~ '^#[0-9a-fA-F]{6}$');

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE
  CHECK (custom_domain IS NULL OR custom_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$');

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS custom_domain_verified boolean NOT NULL DEFAULT false;

-- 3. Public-read brand logo bucket (max 2 MB, PNG/JPEG/SVG/WebP) with org-scoped write RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

DROP POLICY IF EXISTS "public can read brand-assets" ON storage.objects;
CREATE POLICY "public can read brand-assets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "org members can upload brand-assets" ON storage.objects;
CREATE POLICY "org members can upload brand-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org members can update brand-assets" ON storage.objects;
CREATE POLICY "org members can update brand-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org members can delete brand-assets" ON storage.objects;
CREATE POLICY "org members can delete brand-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- 4. Update public passport RPCs to include record_mode, simple_qr_doc_path, and public workspace branding
--    while STILL strictly returning snapshot_public_fields ONLY (never restricted tiers).
DROP FUNCTION IF EXISTS public.get_published_passport(text);
CREATE OR REPLACE FUNCTION public.get_published_passport(p_slug text)
RETURNS TABLE (
  slug text,
  battery_category text,
  record_mode text,
  simple_qr_doc_path text,
  version_number integer,
  snapshot_public_fields jsonb,
  declared_at timestamptz,
  published_at timestamptz,
  brand_logo_url text,
  brand_accent_hex text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.slug,
    p.battery_category,
    p.record_mode,
    p.simple_qr_doc_path,
    v.version_number,
    v.snapshot_public_fields,
    v.declared_at,
    v.created_at AS published_at,
    o.brand_logo_url,
    o.brand_accent_hex
  FROM public.passports p
  JOIN public.passport_versions v ON v.id = p.current_version_id
  JOIN public.organizations o ON o.id = p.org_id
  WHERE p.slug = p_slug
    AND p.status = 'published'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_passport(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_passport(text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_published_passport_unit(text, text);
CREATE OR REPLACE FUNCTION public.get_published_passport_unit(
  p_slug text,
  p_serial text
)
RETURNS TABLE (
  slug text,
  battery_category text,
  record_mode text,
  simple_qr_doc_path text,
  version_number integer,
  snapshot_public_fields jsonb,
  declared_at timestamptz,
  published_at timestamptz,
  brand_logo_url text,
  brand_accent_hex text,
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
    p.record_mode,
    p.simple_qr_doc_path,
    v.version_number,
    v.snapshot_public_fields,
    v.declared_at,
    v.created_at AS published_at,
    o.brand_logo_url,
    o.brand_accent_hex,
    u.serial_number,
    u.gtin,
    u.batch_lot,
    u.manufacturing_date,
    u.unit_status
  FROM public.passport_units u
  JOIN public.passports p ON p.id = u.passport_id
  JOIN public.passport_versions v ON v.id = p.current_version_id
  JOIN public.organizations o ON o.id = p.org_id
  WHERE p.slug = p_slug
    AND p.status = 'published'
    AND lower(u.serial_number) = lower(p_serial)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_passport_unit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_passport_unit(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_published_passport_by_gs1(text, text);
CREATE OR REPLACE FUNCTION public.get_published_passport_by_gs1(
  p_gtin text,
  p_serial text
)
RETURNS TABLE (
  slug text,
  battery_category text,
  record_mode text,
  simple_qr_doc_path text,
  version_number integer,
  snapshot_public_fields jsonb,
  declared_at timestamptz,
  published_at timestamptz,
  brand_logo_url text,
  brand_accent_hex text,
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
    p.record_mode,
    p.simple_qr_doc_path,
    v.version_number,
    v.snapshot_public_fields,
    v.declared_at,
    v.created_at AS published_at,
    o.brand_logo_url,
    o.brand_accent_hex,
    u.serial_number,
    u.gtin,
    u.batch_lot,
    u.manufacturing_date,
    u.unit_status
  FROM public.passport_units u
  JOIN public.passports p ON p.id = u.passport_id
  JOIN public.passport_versions v ON v.id = p.current_version_id
  JOIN public.organizations o ON o.id = p.org_id
  WHERE u.gtin = p_gtin
    AND lower(u.serial_number) = lower(p_serial)
    AND p.status = 'published'
  ORDER BY u.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_published_passport_by_gs1(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_passport_by_gs1(text, text) TO anon, authenticated;

-- 5. Verified custom domain lookup RPC for middleware host-header routing
CREATE OR REPLACE FUNCTION public.resolve_verified_custom_domain(p_domain text)
RETURNS TABLE (
  org_id uuid,
  org_slug text,
  brand_logo_url text,
  brand_accent_hex text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.slug, o.brand_logo_url, o.brand_accent_hex
  FROM public.organizations o
  WHERE lower(o.custom_domain) = lower(trim(p_domain))
    AND o.custom_domain_verified = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_verified_custom_domain(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_verified_custom_domain(text) TO anon, authenticated;
