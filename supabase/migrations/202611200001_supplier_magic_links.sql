-- M10: Bilingual Chinese <-> English No-Login Supplier Magic Links
-- Run after 202611190004_allow_cascade_passport_delete.sql

CREATE TABLE IF NOT EXISTS public.supplier_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (char_length(token_hash) = 64),
  supplier_name text NOT NULL DEFAULT '' CHECK (char_length(supplier_name) <= 160),
  supplier_email text NOT NULL DEFAULT '' CHECK (char_length(supplier_email) <= 254),
  requested_field_keys text[] NOT NULL DEFAULT '{}'::text[],
  default_locale text NOT NULL DEFAULT 'zh' CHECK (default_locale IN ('en', 'zh')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'merged', 'revoked')),
  submitted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_doc_path text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_supplier_requests_workspace_passport
  ON public.supplier_requests (workspace_id, passport_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_requests_passport_status
  ON public.supplier_requests (passport_id, status);

CREATE INDEX IF NOT EXISTS idx_supplier_requests_token_hash
  ON public.supplier_requests (token_hash);

ALTER TABLE public.supplier_requests ENABLE ROW LEVEL SECURITY;

-- Workspace members can CRUD their own workspace supplier requests.
-- Anonymous public submissions NEVER query this table directly; they go strictly through
-- hardened Next.js API route /api/supplier/[token] validating token_hash, expiry, and status = 'open'.
DROP POLICY IF EXISTS "workspace members can manage supplier requests" ON public.supplier_requests;
CREATE POLICY "workspace members can manage supplier requests"
  ON public.supplier_requests FOR ALL TO authenticated
  USING (public.is_org_member(workspace_id))
  WITH CHECK (public.is_org_member(workspace_id));
