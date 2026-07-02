-- ============================================
-- Conciencia Inquieta — Session 5: accessibility baseline
-- Featured images are content, not decoration — they need real alt text,
-- not an empty alt. Small, additive column.
-- ============================================

ALTER TABLE articles ADD COLUMN featured_image_alt text;
