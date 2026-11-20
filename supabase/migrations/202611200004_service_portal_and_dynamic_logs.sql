-- M13: Dealer / Repairer SoH Portal, Append-Only Dynamic BMS Logs, and Pro REST API Keys
-- Run after 202611200003_simple_qr_and_branding.sql

-- 1. Workspace-issued repairer / recycler PIN access tokens (salted SHA-256 hash only)
CREATE TABLE IF NOT EXISTS public.service_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  pin_hash text NOT NULL CHECK (char_length(pin_hash) = 64),
  role text NOT NULL DEFAULT 'repairer' CHECK (role IN ('repairer', 'recycler')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_access_tokens_workspace
  ON public.service_access_tokens (workspace_id, active);

-- 2. Append-only dynamic BMS / SoH telemetry logs (Points 51-71)
-- Never alters immutable static passport_versions snapshots.
CREATE TABLE IF NOT EXISTS public.dynamic_bms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.passport_units(id) ON DELETE SET NULL,
  recorded_by_label text NOT NULL CHECK (char_length(trim(recorded_by_label)) BETWEEN 1 AND 160),
  state_of_health_pct numeric(5, 2)
    CHECK (state_of_health_pct IS NULL OR (state_of_health_pct >= 0 AND state_of_health_pct <= 100)),
  cycle_count integer CHECK (cycle_count IS NULL OR cycle_count >= 0),
  internal_resistance_mohm numeric(10, 3)
    CHECK (internal_resistance_mohm IS NULL OR internal_resistance_mohm >= 0),
  lifecycle_status text NOT NULL DEFAULT 'original'
    CHECK (lifecycle_status IN ('original', 'repaired', 'repurposed', 'waste')),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dynamic_bms_logs_passport_recorded
  ON public.dynamic_bms_logs (passport_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_dynamic_bms_logs_unit_recorded
  ON public.dynamic_bms_logs (unit_id, recorded_at DESC)
  WHERE unit_id IS NOT NULL;

-- Prevent UPDATE mutations on append-only dynamic BMS telemetry logs
-- (allows parent passport CASCADE DELETE while preserving strict append-only integrity)
DROP TRIGGER IF EXISTS trg_dynamic_bms_logs_no_update ON public.dynamic_bms_logs;
CREATE TRIGGER trg_dynamic_bms_logs_no_update
  BEFORE UPDATE ON public.dynamic_bms_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_mutation();

-- 3. Pro Workspace REST API keys (SHA-256 hashed; raw key shown once on creation)
CREATE TABLE IF NOT EXISTS public.workspace_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  key_prefix text NOT NULL CHECK (char_length(key_prefix) BETWEEN 4 AND 24),
  key_hash text NOT NULL UNIQUE CHECK (char_length(key_hash) = 64),
  active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_api_keys_workspace
  ON public.workspace_api_keys (workspace_id, active);

-- Enable Row Level Security on EVERY new table
ALTER TABLE public.service_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_bms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_api_keys ENABLE ROW LEVEL SECURITY;

-- Workspace ownership policies (zero anon table access; service PIN & API key routes validate server-side)
DROP POLICY IF EXISTS "workspace members can manage service access tokens" ON public.service_access_tokens;
CREATE POLICY "workspace members can manage service access tokens"
  ON public.service_access_tokens FOR ALL TO authenticated
  USING (public.is_org_member(workspace_id))
  WITH CHECK (public.is_org_member(workspace_id));

DROP POLICY IF EXISTS "workspace members can read dynamic bms logs" ON public.dynamic_bms_logs;
CREATE POLICY "workspace members can read dynamic bms logs"
  ON public.dynamic_bms_logs FOR SELECT TO authenticated
  USING (public.is_org_member(workspace_id));

DROP POLICY IF EXISTS "workspace members can insert dynamic bms logs" ON public.dynamic_bms_logs;
CREATE POLICY "workspace members can insert dynamic bms logs"
  ON public.dynamic_bms_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(workspace_id));

DROP POLICY IF EXISTS "workspace members can manage api keys" ON public.workspace_api_keys;
CREATE POLICY "workspace members can manage api keys"
  ON public.workspace_api_keys FOR ALL TO authenticated
  USING (public.is_org_member(workspace_id))
  WITH CHECK (public.is_org_member(workspace_id));
