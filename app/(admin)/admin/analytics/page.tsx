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
import TrendChart from "@/components/admin/analytics/TrendChart";
import ArticleTable from "@/components/admin/analytics/ArticleTable";
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
  const summary = await getAnalyticsSummary(range);
  const empty = summaryIsEmpty(summary);

  const sourceItems = summary.by_source.map((s) => ({ label: s.source, value: s.signups }));
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
              <BarList
                items={sourceItems}
                color={CHART.signups}
                emptyText={t.analytics.sourcesEmpty}
              />
            </Card>
          </div>
          <TrendChart points={trend} />
          <div className="bg-white border border-dashed border-[#e0dcd4] rounded-xl p-5">
            <p className="text-sm font-medium text-[#6b6560]">{t.analytics.mailerliteTitle}</p>
            <p className="text-xs text-[#b8b0a4] mt-1">{t.analytics.mailerlitePending}</p>
          </div>
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
