"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";
import FocalImage from "@/components/public/FocalImage";
import { gradFor, glyphFor } from "@/lib/categoryStyle";
import type { ArticleWithRelations } from "@/types";

// Full-bleed hero carousel. Each slide's headline box lands in a different
// place — the deliberate "restless" off-grid composition. Every CTA links to
// the article's own page (the source design pointed them all at the index).
//
// NO AnimatePresence, for the same reason as MobileNav: exits were observed
// not to unmount, which here would stack every past slide as an invisible
// `absolute inset-0` layer over the live one and eat its CTA clicks. Only the
// incoming slide animates (keyed on the article id, so the enter re-runs on
// every change) — a cut-in rather than a cross-fade, and always clickable.

const SLIDE_POSITIONS = [
  "left-0 bottom-0",
  "right-0 top-1/2 -translate-y-1/2",
  "left-4 top-4 md:left-16 md:top-10",
  "right-4 bottom-8 md:right-8",
  "left-4 bottom-8 md:left-8",
];

export default function HeroSlideshow({
  articles,
}: {
  articles: ArticleWithRelations[];
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = articles.length;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    // Autoplay is a motion effect — honour the OS preference and stay put.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [paused, next, count]);

  if (count === 0) return null;

  const article = articles[current];
  const catName = article.category?.name ?? "";
  const catSlug = article.category?.slug ?? null;
  const position = SLIDE_POSITIONS[current % SLIDE_POSITIONS.length];

  return (
    <section
      className="on-dark relative h-[80vh] min-h-[560px] w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Artículos destacados"
    >
      <motion.div
        key={`img-${article.id}`}
        initial={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
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
                className="select-none font-heading text-[28vw] font-bold leading-none text-white/25"
              >
                {glyphFor(catName)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
      </motion.div>

      <motion.div
        key={`box-${article.id}`}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute z-20 max-w-xl ${position}`}
        aria-live="polite"
      >
          <div className="bg-ci-purple p-7 shadow-2xl md:p-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {catName && (
                <Link
                  href={`/categoria/${article.category?.slug}`}
                  className="rounded-full bg-ci-ink px-3 py-1 text-xs font-bold uppercase tracking-wider text-ci-purple transition-colors hover:bg-ci-ink/80"
                >
                  {catName}
                </Link>
              )}
              {article.reading_time_min && (
                <span className="flex items-center gap-1 rounded-full bg-ci-orange px-3 py-1 text-xs font-bold uppercase tracking-wider text-ci-ink">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {article.reading_time_min} min
                </span>
              )}
            </div>
            <h2 className="mb-4 font-heading text-3xl font-bold leading-[1.05] tracking-tight text-ci-ink md:text-5xl">
              {article.title}
            </h2>
            {article.subtitle && (
              <p className="mb-6 line-clamp-2 text-base leading-relaxed text-ci-ink/70 md:text-lg">
                {article.subtitle}
              </p>
            )}
            <Link
              href={`/articulos/${article.slug}`}
              data-event="cta_click"
              data-cta="hero_slide"
              className="inline-flex items-center gap-2 bg-ci-orange px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-colors hover:bg-white"
            >
              Leer historia completa
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
      </motion.div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Artículo anterior"
            className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Artículo siguiente"
            className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
            {articles.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Ir al artículo ${i + 1} de ${count}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-8 bg-ci-orange" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>

          <p className="absolute right-6 top-6 z-30 font-heading text-2xl font-bold">
            <span className="text-ci-orange">
              {String(current + 1).padStart(2, "0")}
            </span>
            <span className="text-white/40">
              {" "}
              / {String(count).padStart(2, "0")}
            </span>
          </p>
        </>
      )}
    </section>
  );
}
