"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import CategoryCluster from "@/components/public/CategoryCluster";
import type { ArticleWithRelations, Category } from "@/types";

// Filter bar + results for /articulos.
//
// SCOPE NOTE: the text field filters the already-fetched array in the browser.
// It is NOT the "on-site search" excluded from the MVP (CLAUDE.md golden
// rules) — there's no index, no query endpoint and no server round-trip. If
// Lewis wants it gone anyway, delete the <input> block and the `search` state;
// nothing else depends on them.

const ALL = "__all__";

export default function ArticleBrowser({
  articles,
  categories,
}: {
  articles: ArticleWithRelations[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.subtitle ?? "").toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory =
        activeSlug === ALL || a.category?.slug === activeSlug;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, activeSlug]);

  // Category order comes from the categories table's sort_order, not from
  // whatever order the articles happen to arrive in.
  const clusters = useMemo(
    () =>
      categories
        .map((c) => ({
          category: c,
          articles: filtered.filter((a) => a.category?.slug === c.slug),
        }))
        .filter((g) => g.articles.length > 0),
    [categories, filtered]
  );

  const uncategorised = useMemo(
    () => filtered.filter((a) => !a.category),
    [filtered]
  );

  return (
    <>
      <div className="sticky top-16 z-30 border-b-2 border-ci-ink/10 bg-white/95 px-6 py-4 backdrop-blur md:top-0 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal
              className="h-4 w-4 shrink-0 text-ci-ink"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setActiveSlug(ALL)}
              aria-pressed={activeSlug === ALL}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                activeSlug === ALL
                  ? "bg-ci-purple text-ci-ink"
                  : "bg-ci-ink/5 text-ci-ink hover:bg-ci-ink/10"
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveSlug(c.slug)}
                aria-pressed={activeSlug === c.slug}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  activeSlug === c.slug
                    ? "bg-ci-orange text-ci-ink"
                    : "bg-ci-ink/5 text-ci-ink hover:bg-ci-ink/10"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="relative shrink-0 md:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ci-ink/40"
              aria-hidden="true"
            />
            <label htmlFor="article-filter" className="sr-only">
              Filtrar artículos
            </label>
            <input
              id="article-filter"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar artículos…"
              className="w-full rounded-full bg-ci-ink/5 py-2 pl-10 pr-4 text-sm transition-colors focus:bg-ci-purple focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <p className="sr-only" role="status">
          {filtered.length} artículos encontrados
        </p>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-bold text-ci-ink/30">
              No encontramos artículos.
            </p>
            <p className="mt-2 text-ci-ink/50">
              Prueba con otro filtro o cambia de tema.
            </p>
          </div>
        ) : activeSlug === ALL ? (
          <>
            {clusters.map(({ category, articles: arts }) => (
              <CategoryCluster
                key={category.id}
                category={category}
                articles={arts}
              />
            ))}
            {uncategorised.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {uncategorised.map((a, i) => (
                  <ArticleCard key={a.id} article={a} index={i} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
