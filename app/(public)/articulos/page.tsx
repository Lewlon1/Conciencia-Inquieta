import type { Metadata } from "next";
import PageHero from "@/components/public/PageHero";
import ArticleBrowser from "@/components/public/ArticleBrowser";
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
      <PageHero
        kicker="Archivo editorial"
        title={
          <>
            Artí<span className="text-ci-orange">culos</span>
          </>
        }
        lead="Explora por tema. Cada cluster es una isla flotante de ideas."
      />
      <ArticleBrowser articles={articles} categories={categories} />
    </>
  );
}
