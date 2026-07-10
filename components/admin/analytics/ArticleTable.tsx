import { t } from "@/lib/admin/strings";
import type { ArticleRow } from "@/lib/analytics/queries";

// Per-article performance for Marie: reads, unique readers, how many got 75%
// down the page, and how many of those visitors also subscribed. A table is the
// right form for multi-metric per-row comparison (dataviz: not everything is a
// chart). Rows arrive already sorted by reads from the RPC.
export default function ArticleTable({ articles }: { articles: ArticleRow[] }) {
  const fmt = new Intl.NumberFormat("es-ES");

  if (articles.length === 0) {
    return <p className="text-sm text-[#b8b0a4]">{t.analytics.articlesEmpty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#6b6560] border-b border-[#e8e5df]">
            <th className="font-medium py-2.5 pr-4">{t.analytics.colArticle}</th>
            <th className="font-medium py-2.5 px-3 text-right">{t.analytics.colReads}</th>
            <th className="font-medium py-2.5 px-3 text-right">{t.analytics.colReaders}</th>
            <th className="font-medium py-2.5 px-3 text-right">{t.analytics.colScroll}</th>
            <th className="font-medium py-2.5 pl-3 text-right">{t.analytics.colSignups}</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => {
            const scrollPct = a.reads > 0 ? Math.min(100, Math.round((a.scroll75 / a.reads) * 100)) : 0;
            return (
              <tr key={a.slug} className="border-b border-[#f0ede8] last:border-0">
                <td className="py-2.5 pr-4">
                  <a
                    href={`/articulos/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1a1a18] hover:underline"
                    title={a.slug}
                  >
                    {a.slug}
                  </a>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-medium text-[#1a1a18]">
                  {fmt.format(a.reads)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-[#6b6560]">
                  {fmt.format(a.readers)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-[#6b6560]">
                  {scrollPct}%
                </td>
                <td className="py-2.5 pl-3 text-right tabular-nums font-medium text-[#b45309]">
                  {fmt.format(a.signups)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
