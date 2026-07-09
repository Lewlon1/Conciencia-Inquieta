import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  // recompute related (Astro passed article+related as props).
  const all = await getPublishedArticles();
  const related = getRelatedArticles(article, all);

  const catName = article.category?.name ?? "";
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
        url: new URL("/favicon.svg", SITE_URL).toString(),
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

      <div className="wrap">
        <article className="article">
          <div className="eyebrow">
            {catName && <span className="cat">{catName}</span>}
            <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>
              {formatDate(article.published_at)} · {article.reading_time_min} min
              de lectura
            </span>
          </div>
          <h1>{article.title}</h1>
          {article.subtitle && <p className="deck">{article.subtitle}</p>}

          <div className="byline">
            <div className="byavatar">{authorInitials}</div>
            <div className="bm">
              <b>{authorName}</b>
              <br />
              <span>Redacción · Conciencia Inquieta</span>
            </div>
            <div className="share">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en X"
              >
                ✕
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en Facebook"
              >
                f
              </a>
              <a
                href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en WhatsApp"
              >
                ✆
              </a>
              <a
                href={`mailto:?subject=${shareText}&body=${shareUrl}`}
                title="Compartir por email"
              >
                ✉
              </a>
            </div>
          </div>

          <div
            className="ph hero-img"
            data-cat={catName}
            style={{ background: gradFor(catName) }}
          >
            {article.featured_image_url ? (
              <FocalImage
                src={article.featured_image_url}
                alt={article.featured_image_alt || ""}
                focalX={article.focal_x}
                focalY={article.focal_y}
                focalZoom={article.focal_zoom}
              />
            ) : (
              <span className="glyph">{glyphFor(catName)}</span>
            )}
          </div>

          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content || ""}
            </ReactMarkdown>
          </div>

          {article.tags.length > 0 && (
            <div className="tags">
              {article.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>

      <div className="wrap">
        <div className="article" style={{ maxWidth: "var(--maxread)" }}>
          <div className="subscribe" style={{ padding: 34 }}>
            <div>
              <h2 style={{ fontSize: "1.5rem" }}>¿Te ha hecho pensar?</h2>
              <p>
                Recibe lo nuevo directamente en tu correo, sin depender de ningún
                algoritmo.
              </p>
            </div>
            <Suspense fallback={null}>
              <SubscribeForm source="end-of-article" dark />
            </Suspense>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="wrap">
          <div className="related">
            <div className="shead">
              <h2>
                Seguir leyendo<span className="dot">.</span>
              </h2>
            </div>
            <div className="grid">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
