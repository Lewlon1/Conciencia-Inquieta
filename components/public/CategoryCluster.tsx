"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import { shapeFor } from "@/lib/categoryStyle";
import type { ArticleWithRelations, Category } from "@/types";

// One collapsible "floating island" of articles per category — the design's
// TopicCluster, generalised from its 6 invented topics to CI's 9 real ones.

export default function CategoryCluster({
  category,
  articles,
}: {
  category: Category;
  articles: ArticleWithRelations[];
}) {
  const [expanded, setExpanded] = useState(true);
  const regionId = `cluster-${category.slug}`;

  return (
    <section className="mb-20">
      <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-ci-ink/10 pb-4">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center bg-ci-purple ${shapeFor(
              category.slug
            )}`}
            aria-hidden="true"
          >
            <span className="font-heading text-xl font-bold text-ci-ink">
              {category.name.charAt(0)}
            </span>
          </span>
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl font-extrabold tracking-tight text-ci-ink md:text-4xl"
            >
              <Link
                href={`/categoria/${category.slug}`}
                className="transition-colors hover:text-ci-orange"
              >
                {category.name}
              </Link>
            </motion.h2>
            <p className="mt-1 text-sm text-ci-ink/50">
              {articles.length}{" "}
              {articles.length === 1 ? "artículo" : "artículos"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={regionId}
          aria-label={
            expanded ? `Contraer ${category.name}` : `Expandir ${category.name}`
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ci-purple text-ci-ink transition-colors hover:bg-ci-purple"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              expanded ? "" : "rotate-180"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Angled decorative rule */}
      <div className="relative mb-8 h-8 overflow-hidden" aria-hidden="true">
        <span className="absolute left-0 top-1/2 h-1 w-32 origin-left -translate-y-1/2 -rotate-[15deg] bg-ci-orange" />
        <span className="absolute left-24 top-1/2 h-1 w-20 origin-left -translate-y-1/2 -rotate-[15deg] bg-ci-purple" />
      </div>

      <div id={regionId} hidden={!expanded}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <ArticleCard key={a.id} article={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
