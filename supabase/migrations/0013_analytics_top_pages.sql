-- ============================================
-- Conciencia Inquieta — analytics: top-pages breakdown
--
-- analytics_summary() (migration 0011) never aggregated the `path` column it
-- already captures on every pageview event — the "Páginas vistas" KPI had no
-- drill-down anywhere in the dashboard. Home, category, service, and static
-- pages were invisible in both tabs; the only existing breakdown (`articles`)
-- counts a different event (article_read) and only covers article slugs.
-- This adds a `pages` dimension: raw pageview volume + unique visitors
-- grouped by path, same shape/limit as `articles`.
--
-- Applied BY HAND in the Supabase SQL editor for project ref lfyerbxqfwjjftcpjzbv
-- (standing MCP blocker). Run after 0011 + 0012.
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
  -- Each visitor's traffic channel = the source of their earliest pageview in the
  -- window (first-touch, same-day since the hash rotates daily).
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
  -- Signups attributed to the signing visitor's traffic channel.
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
  -- Signups by a visitor who also read that article the same day (last-touch-ish).
  article_signups AS (
    SELECT ar.slug, count(DISTINCT ar.visitor_hash) AS signups
    FROM cur ar
    JOIN cur sg ON sg.visitor_hash = ar.visitor_hash AND sg.name = 'signup'
    WHERE ar.name = 'article_read' AND ar.slug IS NOT NULL AND ar.slug <> ''
    GROUP BY ar.slug
  ),
  -- NEW: raw pageview volume per path, independent of `articles` (which counts
  -- the stricter article_read signal and only covers article slugs). Covers
  -- every page on the site, including home/category/service/static routes.
  pages AS (
    SELECT
      path,
      count(*)                     AS views,
      count(DISTINCT visitor_hash) AS visitors
    FROM cur
    WHERE name = 'pageview' AND path IS NOT NULL AND path <> ''
    GROUP BY path
    ORDER BY views DESC
    LIMIT 50
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
    ), '[]'::jsonb),
  'pages', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'path',     p.path,
        'views',    p.views,
        'visitors', p.visitors
      ) ORDER BY p.views DESC)
      FROM pages p
    ), '[]'::jsonb)
);
$$;

-- Functions grant EXECUTE to PUBLIC by default — lock it to the admin only.
REVOKE EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) TO authenticated;

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
