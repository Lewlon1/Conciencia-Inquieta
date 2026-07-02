-- ============================================
-- RLS: public (anon) reads only published posts — needed once the
-- Astro public site (Session 3) fetches content with the anon key.
-- Authenticated (Marie/Lewis via Supabase Auth) gets full access.
-- ============================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: read published posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin: full access"
  ON blog_posts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
