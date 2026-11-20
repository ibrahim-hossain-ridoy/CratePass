-- Extend Supplier Magic Link default_locale to support 5 manufacturing languages:
-- English (en), Simplified Chinese (zh), Korean (ko), Japanese (ja), Vietnamese (vi)
-- Run after 202611200004_service_portal_and_dynamic_logs.sql

ALTER TABLE public.supplier_requests
  DROP CONSTRAINT IF EXISTS supplier_requests_default_locale_check;

ALTER TABLE public.supplier_requests
  ADD CONSTRAINT supplier_requests_default_locale_check
  CHECK (default_locale IN ('en', 'zh', 'ko', 'ja', 'vi'));
