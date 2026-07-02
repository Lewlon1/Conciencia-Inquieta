import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ArticleWithRelations } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

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
        title="Articles"
        action={{ label: "New article", href: "/admin/articles/new" }}
      />

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        {articles && articles.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Reading time
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
                        Published
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        Draft
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
                      `${article.reading_time_min} min`
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
            <p className="text-sm text-[#b8b0a4]">
              No articles yet. Create your first article to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
