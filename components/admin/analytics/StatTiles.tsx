import { t } from "@/lib/admin/strings";
import {
  conversionRate,
  delta,
  type AnalyticsSummary,
} from "@/lib/analytics/queries";

// Headline numbers = stat tiles, not a chart (dataviz: a single magnitude is a
// hero number). Deltas carry an arrow as well as colour, so meaning never rides
// on colour alone.
function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-[#b8b0a4]">{t.analytics.noBaseline}</span>;
  }
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-emerald-600" : "text-red-600"}`}>
      <span aria-hidden>{up ? "↑" : "↓"} </span>
      {up ? "+" : "−"}
      {Math.abs(value)}%
      <span className="text-[#b8b0a4] font-normal"> {t.analytics.vsPreviousShort}</span>
    </span>
  );
}

function Tile({
  label,
  value,
  deltaValue,
  accent = false,
}: {
  label: string;
  value: string;
  deltaValue: number | null;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-xl p-5 ${
        accent ? "border-[#f0d3a3]" : "border-[#e8e5df]"
      }`}
    >
      <p className="text-sm text-[#6b6560]">{label}</p>
      <p
        className={`text-2xl font-medium mt-1 ${
          accent ? "text-[#b45309]" : "text-[#1a1a18]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5">
        <Delta value={deltaValue} />
      </p>
    </div>
  );
}

export default function StatTiles({ summary }: { summary: AnalyticsSummary }) {
  const { kpis, prev } = summary;
  const fmt = new Intl.NumberFormat("es-ES");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Tile
        label={t.analytics.kpiVisitors}
        value={fmt.format(kpis.visitors)}
        deltaValue={delta(kpis.visitors, prev.visitors)}
      />
      <Tile
        label={t.analytics.kpiPageviews}
        value={fmt.format(kpis.pageviews)}
        deltaValue={delta(kpis.pageviews, prev.pageviews)}
      />
      <Tile
        label={t.analytics.kpiSignups}
        value={fmt.format(kpis.signups)}
        deltaValue={delta(kpis.signups, prev.signups)}
        accent
      />
      <Tile
        label={t.analytics.kpiConversion}
        value={`${conversionRate(kpis)}%`}
        deltaValue={delta(conversionRate(kpis), conversionRate(prev))}
        accent
      />
    </div>
  );
}
