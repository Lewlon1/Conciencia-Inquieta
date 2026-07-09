-- ============================================
-- Conciencia Inquieta — analytics retention (pruning)
--
-- Keeps analytics_events (migration 0011) bounded and privacy-friendly: raw,
-- per-hit rows don't need to live forever. This adds an opt-in retention job;
-- until it's scheduled, nothing is deleted.
--
-- DELIBERATELY NOT INCLUDED — the analytics_daily aggregation rollup. At launch
-- traffic the dashboard's analytics_summary() reads raw events directly and is
-- plenty fast; a rollup is premature optimisation (a second code path + drift
-- risk for no benefit yet). Add it only once the raw table is genuinely large,
-- and switch the dashboard reads over at the same time. Retention below is the
-- half that IS worth having early (bounded table + shorter data-controller
-- exposure window).
--
-- Applied BY HAND in the Supabase SQL editor for project ref lfyerbxqfwjjftcpjzbv
-- (standing MCP blocker). Run after 0011.
-- ============================================

-- Deletes raw events older than `retention_days` (default 180). SECURITY DEFINER
-- so it can DELETE regardless of the anon/authenticated table grants; search_path
-- is pinned as the standard hardening for definer functions. Returns the row
-- count deleted (handy when running it by hand).
CREATE OR REPLACE FUNCTION public.prune_analytics_events(retention_days int DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < now() - make_interval(days => retention_days);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

-- Definer functions grant EXECUTE to PUBLIC by default — lock it down. Admin may
-- run it manually; anon may not touch it at all.
REVOKE EXECUTE ON FUNCTION public.prune_analytics_events(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.prune_analytics_events(int) TO authenticated;

-- ---------- Optional automatic retention (pg_cron) ----------
-- Requires the pg_cron extension. Enable it once in Supabase:
--   Dashboard → Database → Extensions → search "pg_cron" → Enable.
-- Then uncomment to run daily at 03:15 UTC, keeping 180 days of raw events:
--
--   SELECT cron.schedule(
--     'prune-analytics-events',
--     '15 3 * * *',
--     $$ SELECT public.prune_analytics_events(180); $$
--   );
--
-- Change retention by editing the argument; stop it with:
--   SELECT cron.unschedule('prune-analytics-events');
--
-- No pg_cron? Run `SELECT public.prune_analytics_events(180);` by hand
-- occasionally, or call it from an external scheduler.

NOTIFY pgrst, 'reload schema';
