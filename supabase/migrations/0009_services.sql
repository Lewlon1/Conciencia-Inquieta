-- ============================================
-- Conciencia Inquieta — Services showcase + booking lead-capture
--
-- NOT the inherited Astro-Psyche Lab "service price management" admin (that
-- Bedrock-backed tool stays out of this repo, `servicePriceManagement` flag OFF
-- — see CLAUDE.md golden rules). This is a fresh, magazine-appropriate feature
-- Lewis asked for: Marie publishes service offerings (images + optional price)
-- and visitors request a booking by leaving name/email/phone so Marie can
-- contact them. No on-site payments/checkout — this is lead capture, the same
-- shape as contact_messages (0005), not a shop.
--
-- Two tables + one Storage bucket:
--   services          — Marie's offerings (public reads published, admin CRUD)
--   service_bookings  — visitor booking requests (public INSERT, admin reads; PII)
--   service-images    — Storage bucket for offering images (mirrors 0008)
--
-- Applied BY HAND in the Supabase SQL editor for project ref
-- lfyerbxqfwjjftcpjzbv (same standing blocker as every prior migration — the
-- MCP in this env only sees unrelated projects). Idempotent-ish: run once, in
-- order, after 0001–0008. Storage DDL at the bottom is re-runnable.
-- ============================================

-- ---------- services ----------
CREATE TABLE services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,                              -- short deck shown on cards
  description text,                          -- long body (light Markdown)
  price_text text,                           -- OPTIONAL, free-form ("Desde 50€", "Consultar")
  image_urls text[] NOT NULL DEFAULT '{}',   -- gallery; first entry is the cover
  image_alt text,                            -- alt text for the cover image
  is_published boolean DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,          -- Marie orders the offerings
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX services_published_idx ON services(is_published);
CREATE INDEX services_sort_order_idx ON services(sort_order);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: read published services"
  ON services FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin: full access to services"
  ON services FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- service_bookings ----------
-- service_id is SET NULL on delete, but service_title is a denormalized snapshot
-- so Marie still sees what was requested even after an offering is renamed/removed.
CREATE TABLE service_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_title text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX service_bookings_service_id_idx ON service_bookings(service_id);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Public (anon, from the /api/reservar route) may submit a request, not read them.
CREATE POLICY "Public: submit booking requests"
  ON service_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin: full access to booking requests"
  ON service_bookings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- table-level grants (pair with the RLS above) ----------
-- services: public may read (RLS restricts to published), admin full CRUD.
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

-- service_bookings holds PII (name/email/phone). 0007's ALTER DEFAULT PRIVILEGES
-- auto-grants SELECT to anon on every future public table, so REVOKE it here —
-- anon must ONLY be able to INSERT (RLS also blocks reads, this is belt-and-braces,
-- matching the contact_messages "not anon-readable" intent).
REVOKE SELECT ON public.service_bookings FROM anon;
GRANT INSERT ON public.service_bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_bookings TO authenticated;

-- ---------- Storage: service-images bucket (mirrors 0008) ----------
-- Public bucket (CDN-readable <img> for the static public site), 10 MB cap,
-- web image types only. Separate from article-images to keep offering media tidy.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Postgres has no CREATE POLICY ... IF NOT EXISTS; drop-then-create keeps this re-runnable.
DROP POLICY IF EXISTS "Admin: upload service images" ON storage.objects;
CREATE POLICY "Admin: upload service images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Admin: update service images" ON storage.objects;
CREATE POLICY "Admin: update service images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images')
  WITH CHECK (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Admin: delete service images" ON storage.objects;
CREATE POLICY "Admin: delete service images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Public: read service images" ON storage.objects;
CREATE POLICY "Public: read service images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'service-images');

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
