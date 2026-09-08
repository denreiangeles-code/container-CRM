-- 055_grant_normalizers_to_service_role.sql
--
-- Let the backend write to companies and contacts again.
--
-- 009 revoked the three normalisation helpers from PUBLIC to keep anon and
-- authenticated from calling them directly, but never granted them back to
-- service_role. Every other function in that file got its GRANT; these three
-- were missed because nothing calls them by name -- they are reached through
-- BEFORE INSERT/UPDATE triggers on companies and contacts.
--
-- Those trigger functions are not SECURITY DEFINER, so they execute as whoever
-- is writing the row. Writes that go through a SECURITY DEFINER function
-- (process_prospect_import_batch and friends) run as its owner and were fine,
-- which is why importing prospects always worked. Any direct write from the
-- backend was not:
--
--   * editing a company name inline on the Prospects / Warm Leads grid
--   * editing a contact's email or phone the same way
--   * POST/PUT /companies and /contacts
--   * sending outreach, which creates nothing itself but sits behind the same
--     path -- this is how the bug surfaced
--
-- all failed with "permission denied for function normalize_identity_text".
--
-- Granting to service_role only, so the original intent stands: anon and
-- authenticated still cannot reach these.

GRANT EXECUTE ON FUNCTION public.normalize_identity_text(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.normalize_email(TEXT)         TO service_role;
GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT)         TO service_role;

NOTIFY pgrst, 'reload schema';
