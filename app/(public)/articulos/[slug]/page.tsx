import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, MessageCircle, Mail } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import FocalImage from "@/components/public/FocalImage";
import SubscribeForm from "@/components/public/SubscribeForm";
import ArticleTracker from "@/components/public/ArticleTracker";
import {
  getPublishedArticles,
  getArticleBySlug,
  getRelatedArticles,
  formatDate,
} from "@/lib/content";
import { gradFor, glyphFor } from "@/lib/categoryStyle";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";

// ISR + on-demand: known slugs are built now and regenerated ~1 min after an
// edit; a slug published after the last build renders on first request
// (dynamicParams defaults to true); junk slugs hit notFound() → 404.
export const revalidate = 60;

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return pageMetadata({
    title: article.meta_title || `${article.title} — Conciencia Inquieta`,
    description: article.meta_description || article.subtitle || "",
    path: `/articulos/${article.slug}`,
    type: "article",
    images: article.featured_image_url ? [article.featured_image_url] : undefined,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  // generateStaticParams returns only slugs, so re-fetch the full list here to
  // recompute related.
  const all = await getPublishedArticles();
  const related = getRelatedArticles(article, all);

  const catName = article.category?.name ?? "";
  const catSlug = article.category?.slug ?? null;
  const authorName = article.author?.name ?? "Redacción";
  const authorInitials = authorName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const canonical = new URL(`/articulos/${article.slug}`, SITE_URL).toString();
  const shareText = encodeURIComponent(article.title);
  const shareUrl = encodeURIComponent(canonical);

  // lucide-react v1 no longer ships brand marks, and inventing approximate
  // brand paths from memory is worse than not using them — so X and Facebook
  // get plain typographic marks and the rest use generic icons. Every button
  // carries an sr-only label naming the destination.
  const shareLinks = [
    {
      label: "Compartir en X",
      href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      glyph: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 5 19 19M19 5 5 19" />
        </svg>
      ),
    },
    {
      label: "Compartir en Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      glyph: (
        <span aria-hidden="true" className="font-heading text-lg font-bold leading-none">
          f
        </span>
      ),
    },
    {
      label: "Compartir en WhatsApp",
      href: `https://wa.me/?text=${shareText}%20${shareUrl}`,
      glyph: <MessageCircle className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: "Compartir por email",
      href: `mailto:?subject=${shareText}&body=${shareUrl}`,
      glyph: <Mail className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.subtitle || article.meta_description || undefined,
    image: article.featured_image_url || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: new URL("/conciencia-logo.png", SITE_URL).toString(),
      },
    },
    mainEntityOfPage: canonical,
    keywords: article.tags.join(", ") || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ArticleTracker slug={article.slug} />

      <article>
        {/* Black masthead */}
        <header className="on-dark relative overflow-hidden bg-black px-6 pb-16 pt-14 md:px-8 md:pb-20 md:pt-16">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-24 block h-1 w-72 -rotate-[25deg] bg-ci-orange"
          />
          <div className="relative z-10 mx-auto max-w-[var(--maxread)]">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {catName && (
                <Link
                  href={`/categoria/${catSlug}`}
                  className="rounded-full bg-ci-purple px-3 py-1 text-xs font-bold uppercase tracking-wider text-ci-ink transition-colors hover:bg-ci-orange"
                >
                  {catName}
                </Link>
              )}
              <span className="text-xs text-white/50">
                {formatDate(article.published_at)}
              </span>
              {article.reading_time_min && (
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {article.reading_time_min} min de lectura
                </span>
              )}
            </div>

            <h1 className="font-heading text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="mt-6 text-xl leading-relaxed text-white/70">
                {article.subtitle}
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ci-purple font-heading font-bold text-ci-ink">
                {authorInitials}
              </span>
              <span className="text-sm">
                <span className="block font-bold text-white">{authorName}</span>
                <span className="text-white/50">
                  Redacción · Conciencia Inquieta
                </span>
              </span>
              <div className="ml-auto flex gap-2">
                {shareLinks.map(({ glyph, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-ci-orange hover:text-ci-ink"
                  >
                    {glyph}
                    <span className="sr-only">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Featured image band */}
        <div className="bg-black">
          <div className="mx-auto aspect-[16/9] max-w-5xl overflow-hidden md:aspect-[2/1]">
            {article.featured_image_url ? (
              <FocalImage
                src={article.featured_image_url}
                alt={article.featured_image_alt || ""}
                focalX={article.focal_x}
                focalY={article.focal_y}
                focalZoom={article.focal_zoom}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: gradFor(catSlug) }}
              >
                <span
                  aria-hidden="true"
                  className="select-none font-heading text-[20vw] font-black leading-none text-white/30"
                >
                  {glyphFor(catName)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-[var(--maxread)] px-6 py-16 md:px-8">
          <div className="prose prose-article">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content || ""}
            </ReactMarkdown>
          </div>

          {article.tags.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-ci-purple/40 px-4 py-1.5 text-sm text-ci-ink"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>

      {/* End-of-article subscribe */}
      <section className="bg-ci-purple px-6 py-20 md:px-8">
        <div className="mx-auto max-w-[var(--maxread)] text-center">
          <h2 className="mb-4 font-heading text-3xl font-black leading-tight tracking-tight text-ci-ink md:text-4xl">
            ¿Te ha hecho <span className="text-ci-orange">pensar</span>?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-ci-ink/70">
            Recibe lo nuevo directamente en tu correo, sin depender de ningún
            algoritmo.
          </p>
          <div className="mx-auto max-w-lg text-left">
            <Suspense fallback={null}>
              <SubscribeForm source="end-of-article" variant="purple" />
            </Suspense>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <h2 className="mb-10 border-b-2 border-ci-ink/10 pb-4 font-display text-3xl font-extrabold tracking-tight text-ci-ink md:text-4xl">
            Seguir leyendo
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
