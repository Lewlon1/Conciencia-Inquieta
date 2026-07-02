-- ============================================
-- Conciencia Inquieta — Session 2: magazine content model (part 1)
-- categories + authors, referenced by articles in 0004.
-- Staging-first: apply to the CI Supabase project, verify, then note in lessons.md.
-- ============================================

CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL
);

CREATE TABLE authors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin: full access to categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public: read authors"
  ON authors FOR SELECT
  USING (true);

CREATE POLICY "Admin: full access to authors"
  ON authors FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- The 9 categories, fixed order per CLAUDE.md. Code-managed like flags —
-- Marie picks from this list in the admin, she doesn't manage the list itself.
INSERT INTO categories (slug, name, sort_order) VALUES
  ('derechos-humanos',       'Derechos humanos',       1),
  ('politica-internacional', 'Política internacional', 2),
  ('latinoamerica',          'Latinoamérica',           3),
  ('feminismo',              'Feminismo',                4),
  ('cultura',                'Cultura',                  5),
  ('medioambiente',          'Medioambiente',           6),
  ('movimientos-sociales',   'Movimientos sociales',   7),
  ('opinion',                'Opinión',                  8),
  ('musica-artes',           'Música y artes',          9);

-- Placeholder author record so the article editor has something to select.
-- Lewis/Marie: update name/bio/avatar_url directly in the table (or via a
-- future authors admin screen — not built in Session 2, out of scope).
INSERT INTO authors (name, bio) VALUES
  ('Marie', 'TODO: real bio — placeholder seeded in Session 2.');
