-- ============================================
-- Conciencia Inquieta — blog_posts (Session 1: basic article upload)
-- Session 2 extends this to the full magazine content model
-- (categories, tags, author/byline, subtitle, featured image, related).
-- ============================================

CREATE TABLE blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  pillar text CHECK (pillar IN ('Decode', 'Reframe', 'Navigate', 'Align')),
  featured_image_url text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  reading_time_min int,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
