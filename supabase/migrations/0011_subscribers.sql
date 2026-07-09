-- ============================================
-- Conciencia Inquieta — Newsletter signups collected directly
--
-- Marie has not used MailerLite yet, so for now signups land in Supabase and
-- she views/exports them from /admin/suscriptores. Same "land it in the DB,
-- read from a lightweight admin view" shape as contact_messages (0005) and
-- service_bookings (0009). MailerLite stays dormant behind FLAGS.mailerliteSync
-- (CLAUDE.md golden rules: CI's own audience, never co-mingled).
--
-- Applied BY HAND in the Supabase SQL editor for project ref lfyerbxqfwjjftcpjzbv
-- (same standing MCP blocker as every prior migration). Run once, after 0001-0010.
-- ============================================

CREATE TABLE subscribers (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,   -- lowercased+trimmed before insert => natural dedup
  source     text,                   -- where they signed up: 'unete' | 'home' | 'articulo' | 'sobre-nosotras'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Public (anon, from /api/suscribir) may submit, not read.
CREATE POLICY "Public: submit subscription"
  ON subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin: full access to subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PII: an email list must NOT be anon-readable. 0007's ALTER DEFAULT PRIVILEGES
-- auto-grants anon SELECT on future tables, so REVOKE it here (matches service_bookings).
REVOKE SELECT ON public.subscribers FROM anon;
GRANT INSERT ON public.subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
