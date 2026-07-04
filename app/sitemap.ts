import type { MetadataRoute } from "next";
import { getPublishedArticles, getCategories } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

// Replaces @astrojs/sitemap's auto-crawl with explicit enumeration. The static
// list must stay in sync with app/(public)/*/page.tsx — every public route is
// listed here so none silently drops out of the sitemap.
const STATIC_PATHS = [
  "/",
  "/articulos",
  "/sobre-nosotras",
  "/unete",
  "/contacto",
  "/privacidad",
  "/cookies",
  "/terminos",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: new URL(`/articulos/${a.slug}`, SITE_URL).toString(),
    lastModified: a.updated_at || a.published_at || undefined,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: new URL(`/categoria/${c.slug}`, SITE_URL).toString(),
  }));

  return [...staticEntries, ...articleEntries, ...categoryEntries];
}
