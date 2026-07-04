import type { Metadata } from "next";

// Preserve the fallback that astro.config.mjs had (site: PUBLIC_SITE_URL ||
// hardcoded vercel URL) so a missing env var can never poison every canonical
// with localhost:3000.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://conciencia-inquieta.vercel.app";

export const SITE_NAME = "Conciencia Inquieta";

/**
 * Per-page metadata. Next does NOT emit <link rel="canonical"> from
 * metadataBase alone, and setting `openGraph` on a page REPLACES the layout's
 * openGraph wholesale (shallow merge) — so every public page must supply its
 * own canonical + full OG. This helper guarantees both, on every page.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  images?: string[];
}): Metadata {
  const { title, description, path, type = "website", images } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: "es_ES",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}
