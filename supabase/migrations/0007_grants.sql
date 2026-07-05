-- ============================================
-- Conciencia Inquieta — table-level privileges for the Supabase API roles
--
-- RLS policies (migrations 0002/0003/0005) are the ROW filter, but Postgres
-- also needs TABLE-level GRANTs or every query fails with 42501
-- "permission denied for table ...". These grants pair with the existing RLS:
--   - anon (public site, cookieless): read published content, submit contact
--   - authenticated (Marie/Lewis in the admin): full CRUD
-- The RLS policies still decide WHICH rows each role can touch; these grants
-- just open the tables at all. Safe to re-run.
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public reads (RLS restricts articles to published; categories/authors are public)
GRANT SELECT ON public.articles   TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.authors    TO anon, authenticated;

-- Admin (authenticated) full CRUD — gated to auth.role()='authenticated' by RLS
GRANT INSERT, UPDATE, DELETE ON public.articles   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.authors    TO authenticated;

-- Contact form: anon may submit; admin may read/manage (RLS enforces the split)
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
