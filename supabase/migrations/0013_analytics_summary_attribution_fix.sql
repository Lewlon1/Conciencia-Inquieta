-- ============================================
-- Conciencia Inquieta — analytics_summary attribution fix
--
-- Fixes per-article signup OVER-ATTRIBUTION in analytics_summary (migration
-- 0011). The original article_signups CTE joined each article_read to ANY signup
-- by the same visitor in the window and grouped by slug: a visitor who read 3
-- articles then subscribed once contributed 1 signup to EACH of the 3 slugs, so
-- the "Suscrip." column in the editorial table summed to far more than the real
-- signup total and the piece that actually triggered the subscribe was
-- indistinguishable from articles merely browsed on the way.
--
-- This version credits each signing visitor to a SINGLE article: the LAST one
-- they read (in-window) at or before their signup event (last-touch). Per-article
-- signups now sum to at most the real signup total, pointing at the piece
-- adjacent to conversion — the answer the "which article drives subscriptions"
-- column exists to give.
--
-- Function-only migration: CREATE OR REPLACE, so it is idempotent and applies
-- whether or not 0011 has already been run (0011 must exist first — it creates
-- the table). Everything else in analytics_summary is unchanged from 0011.
--
-- Applied BY HAND in the Supabase SQL editor for project ref lfyerbxqfwjjftcpjzbv
-- (standing MCP-points-at-wrong-project blocker). Run after 0011.
-- ============================================

CREATE OR REPLACE FUNCTION public.analytics_summary(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH
  span AS (SELECT (_to - _from) AS len),
  cur AS (
    SELECT * FROM public.analytics_events
    WHERE created_at >= _from AND created_at < _to
  ),
  prv AS (
    SELECT * FROM public.analytics_events
    WHERE created_at >= (_from - (SELECT len FROM span)) AND created_at < _from
  ),
  vsrc AS (
    SELECT DISTINCT ON (visitor_hash)
      visitor_hash,
      COALESCE(NULLIF(source, ''), 'Directo') AS source
    FROM cur
    WHERE name = 'pageview' AND visitor_hash IS NOT NULL
    ORDER BY visitor_hash, created_at ASC
  ),
  kpis AS (
    SELECT
      count(DISTINCT visitor_hash)                             AS visitors,
      count(*) FILTER (WHERE name = 'pageview')                AS pageviews,
      count(*) FILTER (WHERE name = 'signup')                  AS signups
    FROM cur
  ),
  kpis_prev AS (
    SELECT
      count(DISTINCT visitor_hash)                             AS visitors,
      count(*) FILTER (WHERE name = 'pageview')                AS pageviews,
      count(*) FILTER (WHERE name = 'signup')                  AS signups
    FROM prv
  ),
  funnel AS (
    SELECT
      count(DISTINCT visitor_hash)                                 AS visitors,
      count(DISTINCT visitor_hash) FILTER (WHERE name = 'article_read') AS readers,
      count(DISTINCT visitor_hash) FILTER (WHERE name = 'cta_click')    AS cta,
      count(DISTINCT visitor_hash) FILTER (WHERE name = 'signup')       AS signups
    FROM cur
  ),
  by_source AS (
    SELECT COALESCE(vs.source, 'Directo') AS source, count(*) AS signups
    FROM cur s
    LEFT JOIN vsrc vs ON vs.visitor_hash = s.visitor_hash
    WHERE s.name = 'signup'
    GROUP BY 1
  ),
  visitors_by_source AS (
    SELECT source, count(*) AS visitors FROM vsrc GROUP BY source
  ),
  trend AS (
    SELECT
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD')     AS day,
      count(DISTINCT visitor_hash)                             AS visitors,
      count(*) FILTER (WHERE name = 'pageview')                AS pageviews,
      count(*) FILTER (WHERE name = 'signup')                  AS signups
    FROM cur
    GROUP BY 1
  ),
  articles AS (
    SELECT
      slug,
      count(*)                     FILTER (WHERE name = 'article_read') AS reads,
      count(DISTINCT visitor_hash) FILTER (WHERE name = 'article_read') AS readers,
      count(*)                     FILTER (WHERE name = 'scroll_depth') AS scroll75
    FROM cur
    WHERE slug IS NOT NULL AND slug <> ''
    GROUP BY slug
    HAVING count(*) FILTER (WHERE name = 'article_read') > 0
    ORDER BY reads DESC
    LIMIT 50
  ),
  -- LAST-TOUCH: each signing visitor is credited to exactly one slug — the last
  -- article they read at or before their signup, in-window. DISTINCT ON (sg.id)
  -- picks one read per signup event; slugless/NULL-hash rows are excluded.
  article_signups AS (
    SELECT last_read.slug, count(*) AS signups
    FROM (
      SELECT DISTINCT ON (sg.id) ar.slug
      FROM cur sg
      JOIN cur ar
        ON ar.visitor_hash = sg.visitor_hash
       AND ar.name = 'article_read'
       AND ar.slug IS NOT NULL AND ar.slug <> ''
       AND ar.created_at <= sg.created_at
      WHERE sg.name = 'signup' AND sg.visitor_hash IS NOT NULL
      ORDER BY sg.id, ar.created_at DESC
    ) last_read
    GROUP BY last_read.slug
  )
SELECT jsonb_build_object(
  'kpis',   (SELECT to_jsonb(kpis)      FROM kpis),
  'prev',   (SELECT to_jsonb(kpis_prev) FROM kpis_prev),
  'funnel', (SELECT to_jsonb(funnel)    FROM funnel),
  'by_source', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'source',   bs.source,
        'signups',  bs.signups,
        'visitors', COALESCE(vbs.visitors, 0)
      ) ORDER BY bs.signups DESC)
      FROM by_source bs
      LEFT JOIN visitors_by_source vbs ON vbs.source = bs.source
    ), '[]'::jsonb),
  'sources', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('source', source, 'visitors', visitors) ORDER BY visitors DESC)
      FROM visitors_by_source
    ), '[]'::jsonb),
  'trend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', day, 'visitors', visitors, 'pageviews', pageviews, 'signups', signups
      ) ORDER BY day)
      FROM trend
    ), '[]'::jsonb),
  'articles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slug',     a.slug,
        'reads',    a.reads,
        'readers',  a.readers,
        'scroll75', a.scroll75,
        'signups',  COALESCE(asg.signups, 0)
      ) ORDER BY a.reads DESC)
      FROM articles a
      LEFT JOIN article_signups asg ON asg.slug = a.slug
    ), '[]'::jsonb)
);
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';
