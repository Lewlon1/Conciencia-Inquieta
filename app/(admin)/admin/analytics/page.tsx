import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { t } from "@/lib/admin/strings";
import {
  fillDailySeries,
  getAnalyticsSummary,
  normalizeRange,
  summaryIsEmpty,
} from "@/lib/analytics/queries";
import DashboardTabs, { type Tab } from "@/components/admin/analytics/DashboardTabs";
import StatTiles from "@/components/admin/analytics/StatTiles";
import Funnel from "@/components/admin/analytics/Funnel";
import BarList from "@/components/admin/analytics/BarList";
import SourceTable from "@/components/admin/analytics/SourceTable";
import TrendChart from "@/components/admin/analytics/TrendChart";
import ArticleTable from "@/components/admin/analytics/ArticleTable";
import MailerliteCard from "@/components/admin/analytics/MailerliteCard";
import { getMailerliteStats } from "@/lib/analytics/mailerlite";
import { CHART } from "@/components/admin/analytics/palette";

// Dynamic (per-request, auth-gated by middleware). Reads first-party analytics
// via lib/analytics/queries — which returns an empty summary (never throws) when
// migration 0011 isn't applied yet, so this page is safe to deploy before then.
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
      <h2 className="font-heading text-lg text-[#1a1a18] mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const range = normalizeRange(searchParams.range);
  const tab: Tab = searchParams.tab === "contenido" ? "contenido" : "resumen";
  // MailerLite pull only feeds the Resumen tab — skip it on Contenido.
  const [summary, mlStats] = await Promise.all([
    getAnalyticsSummary(range),
    tab === "resumen" ? getMailerliteStats() : Promise.resolve(null),
  ]);
  const empty = summaryIsEmpty(summary);

  // Merge signups-by-channel (by_source) with visitors-by-channel (sources, until
  // now unused) so every channel shows its conversion RATE, not just raw signup
  // volume — including channels that drew visitors but converted none.
  const visitorsByChannel: Record<string, number> = {};
  summary.sources.forEach((s) => {
    visitorsByChannel[s.source] = s.visitors;
  });
  const channelRows: { source: string; visitors: number; signups: number }[] = [];
  const seenChannels = new Set<string>();
  summary.by_source.forEach((s) => {
    seenChannels.add(s.source);
    channelRows.push({ source: s.source, signups: s.signups, visitors: visitorsByChannel[s.source] ?? 0 });
  });
  summary.sources.forEach((s) => {
    if (seenChannels.has(s.source)) return; // already added with its signups
    channelRows.push({ source: s.source, signups: 0, visitors: s.visitors });
  });
  channelRows.sort((a, b) => b.signups - a.signups || b.visitors - a.visitors);
  const topArticles = summary.articles
    .slice(0, 8)
    .map((a) => ({ label: a.slug, value: a.reads }));
  const trend = fillDailySeries(summary.trend, range);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.analytics.title} description={t.analytics.subtitle} />
      <DashboardTabs tab={tab} range={range} />

      {empty ? (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-10 text-center">
          <p className="text-sm text-[#6b6560]">{t.analytics.empty}</p>
        </div>
      ) : tab === "resumen" ? (
        <div className="space-y-6">
          <StatTiles summary={summary} />
          <div className="grid lg:grid-cols-2 gap-6">
            <Funnel funnel={summary.funnel} />
            <Card title={t.analytics.sourcesTitle}>
              <SourceTable rows={channelRows} />
            </Card>
          </div>
          <TrendChart points={trend} />
          <MailerliteCard stats={mlStats} periodSignups={summary.kpis.signups} />
        </div>
      ) : (
        <div className="space-y-6">
          <Card title={t.analytics.topArticlesTitle}>
            <BarList
              items={topArticles}
              color={CHART.primary}
              emptyText={t.analytics.articlesEmpty}
            />
          </Card>
          <Card title={t.analytics.articlesTitle}>
            <ArticleTable articles={summary.articles} />
          </Card>
        </div>
      )}
    </div>
  );
}
