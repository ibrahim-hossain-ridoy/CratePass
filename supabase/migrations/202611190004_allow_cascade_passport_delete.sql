-- Allow clean parent-initiated deletion of passports (and cascading passport_versions)
-- while keeping UPDATE on passport_versions strictly forbidden (append-only snapshots).

DROP TRIGGER IF EXISTS trg_passport_versions_immutable ON public.passport_versions;
CREATE TRIGGER trg_passport_versions_immutable
  BEFORE UPDATE ON public.passport_versions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_row_mutation();

-- Allow authenticated org members to delete their own org's uploads & versions when deleting a passport
DROP POLICY IF EXISTS "members can delete org uploads" ON public.uploads;
CREATE POLICY "members can delete org uploads"
  ON public.uploads FOR DELETE TO authenticated
  USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "members can delete org passport versions" ON public.passport_versions;
CREATE POLICY "members can delete org passport versions"
  ON public.passport_versions FOR DELETE TO authenticated
  USING (public.is_org_member(org_id));
