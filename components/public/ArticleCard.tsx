"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight } from "lucide-react";
import FocalImage from "@/components/public/FocalImage";
import { shapeFor, gradFor, glyphFor, isDarkCategory } from "@/lib/categoryStyle";
import type { ArticleWithRelations } from "@/types";

// Card frame geometry varies per category (see lib/categoryStyle.ts) — the
// "restless" shape language. Unlike the source design, every card links to its
// own article, not to the index.

interface Props {
  article: ArticleWithRelations;
  index?: number;
}

export default function ArticleCard({ article, index = 0 }: Props) {
  const catName = article.category?.name ?? "";
  const catSlug = article.category?.slug ?? null;
  const authorName = article.author?.name ?? "Redacción";
  const shape = shapeFor(catSlug);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="group"
    >
      <Link href={`/articulos/${article.slug}`} className="block">
        <div
          className={`overflow-hidden border-2 border-transparent bg-white transition-colors duration-300 group-hover:border-ci-purple group-focus-within:border-ci-purple ${shape}`}
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {article.featured_image_url ? (
              // The zoom-on-hover lives on this wrapper, not the <img>:
              // FocalImage always writes an inline `transform` for the stored
              // focal zoom, which would beat a group-hover:scale-110 class.
              <div className="h-full w-full transition-transform duration-500 group-hover:scale-110">
                <FocalImage
                  src={article.featured_image_url}
                  alt={article.featured_image_alt || ""}
                  focalX={article.focal_x}
                  focalY={article.focal_y}
                  focalZoom={article.focal_zoom}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex h-full w-full items-end justify-end overflow-hidden"
                style={{ background: gradFor(catSlug) }}
              >
                <span
                  aria-hidden="true"
                  className={`-mr-3 -mt-10 select-none font-heading text-[7rem] font-bold leading-none ${
                    isDarkCategory(catSlug) ? "text-white/20" : "text-white/40"
                  }`}
                >
                  {glyphFor(catName)}
                </span>
              </div>
            )}

            {/* Ink bleed: the deck, revealed on hover/focus over the image. */}
            {article.subtitle && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ci-ink p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-95 group-focus-within:opacity-95">
                <p className="line-clamp-5 text-center text-sm leading-relaxed text-ci-purple">
                  {article.subtitle}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              {catName && (
                <span className="inline-block rounded-full bg-ci-orange/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ci-ink">
                  {catName}
                </span>
              )}
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-ci-ink transition-transform group-hover:rotate-45"
                aria-hidden="true"
              />
            </div>
            <h3 className="mb-2 line-clamp-2 font-display text-lg font-bold leading-tight text-ci-ink">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-ci-ink/50">
              <span className="font-medium">{authorName}</span>
              {article.reading_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {article.reading_time_min} min
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
