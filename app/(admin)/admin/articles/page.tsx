import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ArticleWithRelations } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { t } from "@/lib/admin/strings";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminArticlesPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("*, category:categories(*), author:authors(*)")
    .order("created_at", { ascending: false })
    .returns<ArticleWithRelations[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.articles.title}
        action={{ label: t.articles.newArticle, href: "/admin/articles/new" }}
      />

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        {articles && articles.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tableImage}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tableTitle}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tableCategory}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tableAuthor}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tableStatus}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tablePublished}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.articles.tableReadingTime}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="group hover:bg-[#f5f3ef] transition-colors"
                >
                  <td className="px-6 py-4">
                    {article.featured_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.featured_image_url}
                        alt={article.featured_image_alt ?? ""}
                        className="w-11 h-11 object-cover rounded-md border border-[#e8e5df]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-md bg-[#f5f3ef] flex items-center justify-center text-[#b8b0a4] text-sm">
                        &mdash;
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="text-sm font-medium text-[#1a1a18] hover:underline"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {article.category ? (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f6e7f6] text-[#382a44]">
                        {article.category.name}
                      </span>
                    ) : (
                      <span className="text-sm text-[#b8b0a4]">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {article.author?.name ?? (
                      <span className="text-[#b8b0a4]">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {article.is_published ? (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                        {t.common.published}
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        {t.common.draft}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {formatDate(article.published_at) ?? (
                      <span className="text-[#b8b0a4]">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6b6560]">
                    {article.reading_time_min ? (
                      `${article.reading_time_min} ${t.common.min}`
                    ) : (
                      <span className="text-[#b8b0a4]">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#b8b0a4]">{t.articles.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
