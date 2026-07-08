-- ============================================
-- Conciencia Inquieta — Supabase Storage for admin article image uploads
--
-- Creates the `article-images` bucket that the admin (Marie/Lewis) uploads
-- featured/inline images into, plus the RLS policies on storage.objects that
-- gate write access to the `authenticated` role and expose public reads.
--
-- This is the STORAGE analogue of migration 0007: the public.* table grants
-- and their RLS already exist for the app roles (anon = read published /
-- submit contact; authenticated = full CRUD). Storage lives in its own schema
-- (storage.objects / storage.buckets), so it needs its own bucket + policies —
-- none of the public.* grants reach it.
--
-- The bucket is PUBLIC (objects are readable over the CDN without a signed URL,
-- which is what the static public site needs for <img> tags). The explicit
-- anon/authenticated SELECT policy below is belt-and-braces for completeness.
--
-- Applied BY HAND in the Supabase Dashboard SQL editor for project ref
-- lfyerbxqfwjjftcpjzbv (storage schema DDL isn't run through the normal
-- migration CLI here). Idempotent — safe to re-run.
-- ============================================

-- Bucket: 10 MB per-file cap, restricted to the web-friendly image types the
-- admin editor accepts. on conflict keeps re-runs harmless.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects is already enabled by Supabase; we only add policies.
-- Postgres has no CREATE POLICY ... IF NOT EXISTS, so each policy is dropped
-- first to keep this migration re-runnable.

-- Admin (authenticated) may upload new objects into the bucket.
DROP POLICY IF EXISTS "Admin: upload article images" ON storage.objects;
CREATE POLICY "Admin: upload article images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'article-images');

-- Admin (authenticated) may replace/rename existing objects (e.g. overwrite).
DROP POLICY IF EXISTS "Admin: update article images" ON storage.objects;
CREATE POLICY "Admin: update article images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'article-images')
  WITH CHECK (bucket_id = 'article-images');

-- Admin (authenticated) may delete objects (removing an image from an article).
DROP POLICY IF EXISTS "Admin: delete article images" ON storage.objects;
CREATE POLICY "Admin: delete article images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'article-images');

-- Public read: the bucket is public over the CDN, but expose SELECT explicitly
-- for anyone querying storage.objects directly (belt-and-braces).
DROP POLICY IF EXISTS "Public: read article images" ON storage.objects;
CREATE POLICY "Public: read article images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'article-images');

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
