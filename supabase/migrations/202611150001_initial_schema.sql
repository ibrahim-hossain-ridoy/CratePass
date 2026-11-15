-- M2: Initial multi-tenant Digital Battery Passport schema & strict Row Level Security

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Core tenant table (billing & comp status cannot be directly updated by end-users)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  billing_provider text,
  billing_customer_id text,
  billing_subscription_id text,
  billing_status text NOT NULL DEFAULT 'free'
    CHECK (billing_status IN ('free', 'active', 'past_due', 'canceled')),
  comp_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Organization membership
CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- 3. Battery products owned by an organization
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160),
  model_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Working battery passports (draft | published)
CREATE TABLE IF NOT EXISTS public.passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  working_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Immutable published passport snapshots
CREATE TABLE IF NOT EXISTS public.passport_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  snapshot_all_fields jsonb NOT NULL,
  snapshot_public_fields jsonb NOT NULL,
  declared_accurate_by uuid NOT NULL REFERENCES auth.users(id),
  declared_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (passport_id, version_number)
);

ALTER TABLE public.passports
  DROP CONSTRAINT IF EXISTS passports_current_version_fk;
ALTER TABLE public.passports
  ADD CONSTRAINT passports_current_version_fk
  FOREIGN KEY (current_version_id)
  REFERENCES public.passport_versions(id)
  ON DELETE SET NULL;

-- 6. Spec sheet PDF uploads (private storage references + extraction metadata)
CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  passport_id uuid REFERENCES public.passports(id) ON DELETE SET NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  original_filename text NOT NULL,
  storage_path text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  sha256 text NOT NULL,
  extraction_status text NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'completed', 'failed')),
  extraction_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Append-only audit log (publication declarations, token usage, unpublish, webhooks)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Server-managed rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1
);

-- Indexes for foreign keys & hot paths
CREATE INDEX IF NOT EXISTS idx_members_user_org ON public.members (user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products (org_id);
CREATE INDEX IF NOT EXISTS idx_passports_org_status ON public.passports (org_id, status);
CREATE INDEX IF NOT EXISTS idx_passports_product_id ON public.passports (product_id);
CREATE INDEX IF NOT EXISTS idx_passport_versions_passport ON public.passport_versions (passport_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_org_created ON public.uploads (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON public.audit_log (org_id, created_at DESC);

-- Triggers: updated_at + append-only immutability
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_passports_updated_at ON public.passports;
CREATE TRIGGER trg_passports_updated_at
  BEFORE UPDATE ON public.passports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_row_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Rows in %.% are immutable and cannot be modified or deleted',
    TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS trg_passport_versions_immutable ON public.passport_versions;
CREATE TRIGGER trg_passport_versions_immutable
  BEFORE UPDATE OR DELETE ON public.passport_versions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_mutation();

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON public.audit_log;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_mutation();

-- RLS Helper
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE m.org_id = target_org_id
      AND m.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;

-- Enable Row Level Security on EVERY table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies: strict organization scoping; no anon table reads; no direct billing/member escalation

CREATE POLICY "members can view own organization"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY "members can view org memberships"
  ON public.members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_org_member(org_id));

CREATE POLICY "members can manage org products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "members can manage org passports"
  ON public.passports FOR ALL TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "members can read org passport versions"
  ON public.passport_versions FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY "members can insert org passport versions"
  ON public.passport_versions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND declared_accurate_by = (SELECT auth.uid())
  );

CREATE POLICY "members can read org uploads"
  ON public.uploads FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY "members can insert org uploads"
  ON public.uploads FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND uploaded_by = (SELECT auth.uid())
  );

CREATE POLICY "members can update own org uploads"
  ON public.uploads FOR UPDATE TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "members can read org audit logs"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY "members can insert org audit logs"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND (actor_user_id IS NULL OR actor_user_id = (SELECT auth.uid()))
  );
