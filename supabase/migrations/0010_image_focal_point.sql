-- ============================================
-- Conciencia Inquieta — Focal point + zoom for the article featured image
-- and the service cover image.
--
-- Lets Marie pan/zoom where the image is anchored within its display frames
-- (article feature tile / grid card / hero; service grid card / detail hero)
-- without cropping or replacing the uploaded file. NULL on any of the three
-- columns means "center, no zoom" — i.e. today's exact object-fit:cover
-- behavior — so every existing row renders unchanged until repositioned.
--
-- Applied BY HAND in the Supabase SQL editor for project ref
-- lfyerbxqfwjjftcpjzbv (same standing process as 0008/0009 — the MCP in
-- this environment has no access to that project). Re-runnable.
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS focal_x numeric,     -- 0–100, % from left. NULL = 50 (center)
  ADD COLUMN IF NOT EXISTS focal_y numeric,     -- 0–100, % from top.  NULL = 50 (center)
  ADD COLUMN IF NOT EXISTS focal_zoom numeric;  -- 1.0–3.0. NULL = 1.0 (no zoom)

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS focal_x numeric,
  ADD COLUMN IF NOT EXISTS focal_y numeric,
  ADD COLUMN IF NOT EXISTS focal_zoom numeric;

NOTIFY pgrst, 'reload schema';
