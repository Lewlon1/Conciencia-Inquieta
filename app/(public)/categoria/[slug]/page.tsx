import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/public/ArticleCard";
import PageHero from "@/components/public/PageHero";
import {
  getPublishedArticles,
  getCategories,
  getArticlesByCategory,
} from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return pageMetadata({
    title: `${category.name} — Conciencia Inquieta`,
    description: `Artículos de Conciencia Inquieta en la categoría ${category.name}.`,
    path: `/categoria/${category.slug}`,
  });
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, allArticles] = await Promise.all([
    getCategories(),
    getPublishedArticles(),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(allArticles, category.slug);

  return (
    <>
      <PageHero
        kicker="Categoría"
        title={category.name}
        lead={`Todo lo publicado en Conciencia Inquieta bajo ${category.name.toLowerCase()}.`}
      />

      <div className="border-b-2 border-ci-ink/10 px-6 py-4 md:px-8">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto">
          <Link
            href="/articulos"
            className="whitespace-nowrap rounded-full bg-ci-ink/5 px-4 py-2 text-sm font-bold text-ci-ink transition-colors hover:bg-ci-ink/10"
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              aria-current={c.slug === category.slug ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                c.slug === category.slug
                  ? "bg-ci-orange text-ci-ink"
                  : "bg-ci-ink/5 text-ci-ink hover:bg-ci-ink/10"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-display text-2xl font-bold text-ci-ink/30">
              Todavía no hay artículos en esta categoría.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
