import { t } from "@/lib/admin/strings";
import { CHART } from "./palette";

// "Which channel actually converts." Raw signup counts rank channels by VOLUME,
// which is actively misleading: a 5,000-visitor channel with 50 signups (1%)
// outranks a 200-visitor channel with 20 signups (10%) even though the second
// converts 10x better. So we show signups, visitors AND the conversion rate side
// by side — the rate is the column that informs where to invest. Data is already
// in the summary (by_source.signups + sources.visitors), no new SQL.
export interface ChannelRow {
  source: string;
  visitors: number;
  signups: number;
}

export default function SourceTable({ rows }: { rows: ChannelRow[] }) {
  const fmt = new Intl.NumberFormat("es-ES");

  if (rows.length === 0) {
    return <p className="text-sm text-[#b8b0a4]">{t.analytics.sourcesEmpty}</p>;
  }
  const maxSignups = Math.max(...rows.map((r) => r.signups), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#6b6560] border-b border-[#e8e5df]">
            <th className="font-medium py-2.5 pr-4">{t.analytics.colChannel}</th>
            <th className="font-medium py-2.5 px-3 text-right">{t.analytics.colSignups}</th>
            <th className="font-medium py-2.5 px-3 text-right">{t.analytics.colVisitors}</th>
            <th className="font-medium py-2.5 pl-3 text-right">{t.analytics.colConversion}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rate = r.visitors > 0 ? (r.signups / r.visitors) * 100 : null;
            return (
              <tr key={r.source} className="border-b border-[#f0ede8] last:border-0">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#1a1a18] truncate max-w-[9rem]" title={r.source}>
                      {r.source}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                    style={{ background: CHART.track }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max((r.signups / maxSignups) * 100, 2)}%`, background: CHART.signups }}
                    />
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right align-top tabular-nums font-medium text-[#b45309]">
                  {fmt.format(r.signups)}
                </td>
                <td className="py-2.5 px-3 text-right align-top tabular-nums text-[#6b6560]">
                  {fmt.format(r.visitors)}
                </td>
                <td className="py-2.5 pl-3 text-right align-top tabular-nums font-medium text-[#1a1a18]">
                  {rate === null ? "—" : `${Math.round(rate * 10) / 10}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
