import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import { getPublishedArticles, getCategories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Artículos — Conciencia Inquieta",
  description:
    "Verdad con contexto, memoria y humanidad. El archivo completo de Conciencia Inquieta.",
  path: "/articulos",
});

export default async function ArticulosPage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
  ]);

  return (
    <>
      <div className="wrap page-intro">
        <div className="kicker">Archivo</div>
        <h1>Artículos</h1>
        <p>
          Verdad con contexto, memoria y humanidad. Filtra por las temáticas que
          nos atraviesan.
        </p>
      </div>
      <div className="wrap section">
        <div className="chips">
          <a className="chip active" href="/articulos">
            Todas
          </a>
          {categories.map((c) => (
            <a key={c.id} className="chip" href={`/categoria/${c.slug}`}>
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
            Todavía no hay artículos publicados.
          </p>
        )}
      </div>
    </>
  );
}
