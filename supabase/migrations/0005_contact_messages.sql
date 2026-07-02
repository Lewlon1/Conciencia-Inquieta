-- ============================================
-- Conciencia Inquieta — Session 4: contact-form delivery
-- Decision: messages land in Supabase, read from a lightweight admin view
-- (/admin/messages). No transactional email service is wired up yet, and
-- this needed zero new secrets — reuses the same anon-key + RLS pattern as
-- everything else. Easy to swap for an email-forward later if preferred.
-- ============================================

CREATE TABLE contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public (anon, from the Astro API route) can submit messages, not read them.
CREATE POLICY "Public: submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin: full access to contact messages"
  ON contact_messages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
