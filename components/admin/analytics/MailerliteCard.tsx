import { t } from "@/lib/admin/strings";
import type { MailerliteStats } from "@/lib/analytics/mailerlite";

// Reconciles what the SITE measured (signup events this period) against the
// SOURCE OF TRUTH (MailerLite's confirmed list). The gap between the two is the
// double-opt-in drop-off — the thing neither web analytics nor MailerLite shows
// on its own. MailerLite counts are current list totals, not period-scoped —
// said plainly in the note so the numbers aren't misread.
export default function MailerliteCard({
  stats,
  periodSignups,
}: {
  stats: MailerliteStats | null;
  periodSignups: number;
}) {
  const fmt = new Intl.NumberFormat("es-ES");

  if (!stats) {
    return (
      <div className="bg-white border border-dashed border-[#e0dcd4] rounded-xl p-5">
        <p className="text-sm font-medium text-[#6b6560]">{t.analytics.mailerliteTitle}</p>
        <p className="text-xs text-[#b8b0a4] mt-1">{t.analytics.mlUnset}</p>
      </div>
    );
  }

  const total = stats.active + stats.unconfirmed;
  const confirmRate = total > 0 ? Math.round((stats.active / total) * 100) : 0;

  const figures = [
    { label: t.analytics.mlConfirmed, value: fmt.format(stats.active), accent: true },
    { label: t.analytics.mlUnconfirmed, value: fmt.format(stats.unconfirmed) },
    { label: t.analytics.mlConfirmRate, value: `${confirmRate}%` },
    { label: t.analytics.mlPeriodSignups, value: fmt.format(periodSignups) },
  ];

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
      <h2 className="font-heading text-lg text-[#1a1a18] mb-1">{t.analytics.mailerliteTitle}</h2>
      <p className="text-xs text-[#b8b0a4] mb-4">{t.analytics.mlNote}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {figures.map((f) => (
          <div key={f.label}>
            <p className="text-xs text-[#6b6560]">{f.label}</p>
            <p
              className={`text-xl font-medium mt-0.5 ${
                f.accent ? "text-[#b45309]" : "text-[#1a1a18]"
              }`}
            >
              {f.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
