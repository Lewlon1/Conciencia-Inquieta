import Link from "next/link";
import { t } from "@/lib/admin/strings";
import { RANGES, type RangeDays } from "@/lib/analytics/queries";

export type Tab = "resumen" | "contenido";

const href = (tab: Tab, range: RangeDays) => `/admin/analytics?tab=${tab}&range=${range}`;

const rangeLabel: Record<RangeDays, string> = {
  7: t.analytics.range7,
  30: t.analytics.range30,
  90: t.analytics.range90,
};

// Tabs + range as plain links (no client JS): each preserves the other axis, so
// switching tab keeps the range and vice-versa. This is the dataviz "filters in
// one row above the charts" rule, server-rendered.
export default function DashboardTabs({ tab, range }: { tab: Tab; range: RangeDays }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "resumen", label: t.analytics.tabOverview },
    { key: "contenido", label: t.analytics.tabContent },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex items-center gap-1 bg-[#f0ede8] rounded-lg p-1">
        {tabs.map((tb) => (
          <Link
            key={tb.key}
            href={href(tb.key, range)}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              tab === tb.key
                ? "bg-white text-[#1a1a18] shadow-sm font-medium"
                : "text-[#6b6560] hover:text-[#1a1a18]"
            }`}
          >
            {tb.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={href(tab, r)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              range === r
                ? "border-[#382a44] bg-[#382a44] text-white"
                : "border-[#e8e5df] text-[#6b6560] hover:bg-[#f5f3ef]"
            }`}
          >
            {rangeLabel[r]}
          </Link>
        ))}
      </div>
    </div>
  );
}
