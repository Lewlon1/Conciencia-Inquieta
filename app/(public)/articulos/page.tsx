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
        // Deliberately NOT split into two colours like the other hero titles:
        // marigold on "culos" reads as its own word. Marie's call. The other
        // split headlines keep their accent.
        title="Artículos"
        lead="Explora por tema. Cada cluster es una isla flotante de ideas."
      />
      <ArticleBrowser articles={articles} categories={categories} />
    </>
  );
}
