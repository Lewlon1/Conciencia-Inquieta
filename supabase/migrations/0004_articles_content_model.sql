-- ============================================
-- Conciencia Inquieta — Session 2: magazine content model (part 2)
-- blog_posts -> articles, dropping the astrology "pillar" taxonomy in
-- favour of category/tags/author. Nothing is live yet (0001/0002 were never
-- confirmed applied — see lessons.md Session 1 blockers), so this is a plain
-- ALTER sequence rather than a backfill migration.
-- ============================================

ALTER TABLE blog_posts RENAME TO articles;

ALTER TABLE articles RENAME COLUMN excerpt TO subtitle;

ALTER TABLE articles
  ADD COLUMN category_id uuid REFERENCES categories(id),
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN author_id uuid REFERENCES authors(id);

ALTER TABLE articles DROP COLUMN pillar;

CREATE INDEX articles_category_id_idx ON articles(category_id);
CREATE INDEX articles_author_id_idx ON articles(author_id);
CREATE INDEX articles_published_at_idx ON articles(published_at DESC);
