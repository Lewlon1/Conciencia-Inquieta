-- ============================================
-- Conciencia Inquieta — table-level privileges for the Supabase API roles
--
-- RLS policies (migrations 0002/0003/0005) are the ROW filter, but Postgres
-- also needs TABLE-level GRANTs or every query fails with 42501
-- "permission denied for table ...". These grants pair with the existing RLS:
--   - anon (public site, cookieless): read published content, submit contact
--   - authenticated (Marie/Lewis in the admin): full CRUD
-- The RLS policies still decide WHICH rows each role can touch; these grants
-- just open the tables at all. Idempotent — safe to re-run.
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public reads (RLS restricts articles to published; categories/authors are public).
-- contact_messages is intentionally NOT anon-readable (PII) — anon only INSERTs.
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

-- Belt-and-braces: make FUTURE tables in public inherit these grants, so a new
-- table added by a later migration doesn't reintroduce the 42501 error.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
