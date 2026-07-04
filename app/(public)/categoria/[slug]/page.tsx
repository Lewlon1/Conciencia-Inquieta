import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/public/ArticleCard";
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
      <div className="wrap page-intro">
        <div className="kicker">Categoría</div>
        <h1>{category.name}</h1>
        <p>
          Todo lo publicado en Conciencia Inquieta bajo{" "}
          {category.name.toLowerCase()}.
        </p>
      </div>
      <div className="wrap section">
        <div className="chips">
          <a className="chip" href="/articulos">
            Todas
          </a>
          {categories.map((c) => (
            <a
              key={c.id}
              className={`chip ${c.slug === category.slug ? "active" : ""}`}
              href={`/categoria/${c.slug}`}
            >
              {c.name}
            </a>
          ))}
        </div>
        {articles.length > 0 ? (
          <div className="grid">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--muted)",
              fontFamily: "var(--read)",
              fontStyle: "italic",
            }}
          >
            Todavía no hay artículos en esta categoría.
          </p>
        )}
      </div>
    </>
  );
}
