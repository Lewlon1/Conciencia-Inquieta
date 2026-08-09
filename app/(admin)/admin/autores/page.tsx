import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { isAuthorPublic } from "@/lib/authorVisibility";
import { t } from "@/lib/admin/strings";
import type { Author } from "@/types";

// PostgREST returns an embedded aggregate as a one-element array: [{ count: n }].
type AuthorRow = Author & { articles: { count: number }[] };

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminAuthorsPage() {
  const supabase = await createClient();

  const { data: authors } = await supabase
    .from("authors")
    .select("*, articles(count)")
    .order("name")
    .returns<AuthorRow[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.authors.title}
        description={t.authors.subtitle}
        action={{ label: t.authors.newAuthor, href: "/admin/autores/new" }}
      />

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        {authors && authors.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left">
                {[
                  t.authors.tableAvatar,
                  t.authors.tableName,
                  t.authors.tableBio,
                  t.authors.tableArticles,
                  t.authors.tableVisibility,
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {authors.map((author) => {
                const articleCount = author.articles?.[0]?.count ?? 0;
                const isPublic = isAuthorPublic(author);
                return (
                  <tr
                    key={author.id}
                    className="group hover:bg-[#f5f3ef] transition-colors"
                  >
                    <td className="px-6 py-4">
                      {author.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={author.avatar_url}
                          alt=""
                          className="w-11 h-11 object-cover rounded-full border border-[#e8e5df]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#f5f3ef] flex items-center justify-center text-xs font-medium text-[#6b6560]">
                          {initials(author.name)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/autores/${author.id}`}
                        className="text-sm font-medium text-[#1a1a18] hover:underline"
                      >
                        {author.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {author.bio ? (
                        <p className="text-sm text-[#6b6560] line-clamp-2">
                          {author.bio}
                        </p>
                      ) : (
                        <span className="text-[#b8b0a4]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6560]">
                      {articleCount}
                    </td>
                    <td className="px-6 py-4">
                      {/* The public grid hides placeholder bios (lib/authorVisibility.ts).
                          Surfacing that here stops it looking like a bug. */}
                      {isPublic ? (
                        <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                          {t.authors.visibleBadge}
                        </span>
                      ) : (
                        <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                          {t.authors.hiddenBadge}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#b8b0a4]">{t.authors.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
