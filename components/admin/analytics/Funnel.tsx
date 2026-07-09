import { t } from "@/lib/admin/strings";
import type { FunnelData } from "@/lib/analytics/queries";
import { CHART } from "./palette";

// Conversion funnel = four magnitude bars sharing one baseline (visitors), so
// drop-off is read as shrinking width. Single hue for the top stages; the goal
// stage (signups) gets the amber accent. 4px rounded data-ends, 2px surface gap.
export default function Funnel({ funnel }: { funnel: FunnelData }) {
  const max = Math.max(funnel.visitors, 1);
  const fmt = new Intl.NumberFormat("es-ES");

  const stages = [
    { label: t.analytics.funnelVisitors, value: funnel.visitors, color: CHART.primary },
    { label: t.analytics.funnelReaders, value: funnel.readers, color: CHART.primary },
    { label: t.analytics.funnelCta, value: funnel.cta, color: CHART.primary },
    { label: t.analytics.funnelSignups, value: funnel.signups, color: CHART.signups },
  ];

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
      <h2 className="font-heading text-lg text-[#1a1a18] mb-5">
        {t.analytics.funnelTitle}
      </h2>
      <div className="space-y-4">
        {stages.map((s) => {
          const pct = Math.round((s.value / max) * 100);
          return (
            <div key={s.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-[#1a1a18]">{s.label}</span>
                <span className="text-sm text-[#6b6560]">
                  <span className="font-medium text-[#1a1a18]">{fmt.format(s.value)}</span>{" "}
                  <span className="text-[#b8b0a4]">
                    · {pct}% {t.analytics.ofVisitors}
                  </span>
                </span>
              </div>
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: CHART.track }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(pct, 1)}%`, background: s.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
