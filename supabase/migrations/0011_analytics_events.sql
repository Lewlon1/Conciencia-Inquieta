-- ============================================
-- Conciencia Inquieta — first-party analytics (events + summary RPC)
--
-- Custom, Supabase-native analytics. NO external provider (Plausible/Umami are
-- dropped as a dependency — see docs/superpowers/plans/2026-07-09-analytics-
-- suite-design-and-plan.md). Every client event already flows through
-- window.ciTrack (components/public/Analytics.tsx); the /api/track route tees
-- those into this table server-side, anonymously.
--
-- PRIVACY: rows are strictly anonymous — NO cookie, NO stored IP, NO stored raw
-- user-agent. `visitor_hash` is a daily-rotating salted hash (sha256 of
-- day+ip+ua+ANALYTICS_SALT) computed in the route and never reversible to a
-- person; it exists only to count uniques/sessions within a day. This keeps the
-- pipeline in the same consent-free bucket as the current cookieless setup. The
-- Meta Pixel stays consent-gated separately.
--
-- Applied BY HAND in the Supabase SQL editor for project ref lfyerbxqfwjjftcpjzbv
-- (standing blocker: the MCP in this env only sees unrelated projects). Run once,
-- after 0001–0010.
-- ============================================

-- ---------- analytics_events (raw) ----------
CREATE TABLE analytics_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- bigint: high row count
  created_at    timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,        -- pageview | signup | cta_click | channel_click | article_read | scroll_depth
  path          text,                 -- URL path, query stripped
  slug          text,                 -- article/service slug when relevant
  referrer_host text,                 -- parsed hostname of document.referrer
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  source        text,                 -- derived traffic channel (Instagram/Búsqueda/Directo/…)
  country       text,                 -- 2-letter (Vercel header), nullable
  device        text,                 -- mobile | desktop | tablet
  visitor_hash  text,                 -- daily-rotating ANONYMOUS hash (uniques + same-day stitching)
  props         jsonb                 -- event-specific overflow (cta id, scroll depth, signup placement…)
);

CREATE INDEX analytics_events_created_at_idx   ON analytics_events (created_at);
CREATE INDEX analytics_events_name_created_idx ON analytics_events (name, created_at);
CREATE INDEX analytics_events_slug_idx         ON analytics_events (slug);
CREATE INDEX analytics_events_visitor_idx      ON analytics_events (visitor_hash, created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public (anon, from the /api/track route) may INSERT events, never read them.
CREATE POLICY "Public: insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Admin (authenticated) reads for the dashboard.
CREATE POLICY "Admin: read analytics events"
  ON analytics_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Grants pair with the RLS above. 0007's ALTER DEFAULT PRIVILEGES auto-grants
-- SELECT to anon on every new public table — REVOKE it here so anon can ONLY
-- insert (same intent as service_bookings/contact_messages: raw events aren't public).
REVOKE SELECT ON public.analytics_events FROM anon;
GRANT  INSERT ON public.analytics_events TO anon;
GRANT  SELECT ON public.analytics_events TO authenticated;

-- ---------- analytics_summary(_from, _to) → jsonb ----------
-- One round-trip powering the whole /admin/analytics dashboard: KPIs (+ previous
-- equal-length period for deltas), the conversion funnel, signups-by-channel,
-- a daily trend, and per-article performance with same-day signup attribution.
-- SQL/STABLE, SECURITY INVOKER (default) so it runs under the caller's RLS —
-- only `authenticated` can read analytics_events, so only the admin gets data.
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

-- Functions grant EXECUTE to PUBLIC by default — lock it to the admin only.
REVOKE EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analytics_summary(timestamptz, timestamptz) TO authenticated;

-- Nudge PostgREST to reload its schema cache (harmless if already current).
NOTIFY pgrst, 'reload schema';
