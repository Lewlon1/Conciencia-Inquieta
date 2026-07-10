import { createClient } from "@/lib/supabase/server";

// Read side of the first-party analytics. Everything the /admin/analytics
// dashboard needs comes from ONE Postgres function (analytics_summary, migration
// 0011) — one round-trip, all aggregation in SQL (cap-safe, no row hauling).
// This module is the single data-access boundary, so tests/fixtures mock it here.

export type Kpis = { visitors: number; pageviews: number; signups: number };
export type FunnelData = { visitors: number; readers: number; cta: number; signups: number };
export type SourceRow = { source: string; signups: number; visitors: number };
export type VisitorSource = { source: string; visitors: number };
export type TrendPoint = { day: string; visitors: number; pageviews: number; signups: number };
export type ArticleRow = {
  slug: string;
  reads: number;
  readers: number;
  scroll75: number;
  signups: number;
};

export interface AnalyticsSummary {
  kpis: Kpis;
  prev: Kpis;
  funnel: FunnelData;
  by_source: SourceRow[];
  sources: VisitorSource[];
  trend: TrendPoint[];
  articles: ArticleRow[];
}

export const EMPTY_SUMMARY: AnalyticsSummary = {
  kpis: { visitors: 0, pageviews: 0, signups: 0 },
  prev: { visitors: 0, pageviews: 0, signups: 0 },
  funnel: { visitors: 0, readers: 0, cta: 0, signups: 0 },
  by_source: [],
  sources: [],
  trend: [],
  articles: [],
};

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function normalizeRange(v: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calls analytics_summary for the trailing `rangeDays` window. Returns
 * EMPTY_SUMMARY (never throws) when the table/function isn't migrated yet or on
 * any error — so the dashboard renders an empty state pre-migration instead of
 * crashing, mirroring the services PGRST205 guard.
 */
export async function getAnalyticsSummary(rangeDays: RangeDays): Promise<AnalyticsSummary> {
  const to = new Date();
  const from = new Date(to.getTime() - rangeDays * DAY_MS);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("analytics_summary", {
      _from: from.toISOString(),
      _to: to.toISOString(),
    });
    if (error || !data) return EMPTY_SUMMARY;
    return { ...EMPTY_SUMMARY, ...(data as Partial<AnalyticsSummary>) };
  } catch {
    return EMPTY_SUMMARY;
  }
}

/** Pad the sparse per-day trend with zero-days so the chart spans the whole range. */
export function fillDailySeries(trend: TrendPoint[], rangeDays: RangeDays): TrendPoint[] {
  const byDay = new Map(trend.map((t) => [t.day, t]));
  const out: TrendPoint[] = [];
  const today = new Date();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = new Date(today.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? { day: key, visitors: 0, pageviews: 0, signups: 0 });
  }
  return out;
}

/** Percentage change vs the previous equal-length period. null when prev is 0 (no baseline). */
export function delta(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Conversion rate signups/visitors as a percentage (1 decimal). */
export function conversionRate(k: Kpis): number {
  if (!k.visitors) return 0;
  return Math.round((k.signups / k.visitors) * 1000) / 10;
}

export function summaryIsEmpty(s: AnalyticsSummary): boolean {
  return s.kpis.visitors === 0 && s.kpis.pageviews === 0 && s.kpis.signups === 0;
}
