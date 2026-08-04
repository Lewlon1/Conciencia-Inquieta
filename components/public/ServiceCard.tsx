"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import FocalImage from "@/components/public/FocalImage";
import type { Service } from "@/types";

// Services render as the design's big alternating purple/orange blocks. The
// content is real (Supabase `services`), not the four hardcoded marketing
// cards the source design shipped — and each still links to its own detail
// page with the booking form.

export default function ServiceCard({
  service,
  index = 0,
}: {
  service: Service;
  index?: number;
}) {
  const cover = service.image_urls?.[0];
  const isPurple = index % 2 === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (index % 2) * 0.1 }}
      className={`group relative overflow-hidden rounded-3xl ${
        isPurple ? "bg-ci-purple" : "bg-ci-orange"
      }`}
    >
      <Link href={`/servicios/${service.slug}`} className="block">
        <span
          aria-hidden="true"
          className={`absolute -right-8 -top-8 h-32 w-32 rounded-full transition-transform duration-700 group-hover:scale-150 ${
            isPurple ? "bg-ci-orange/20" : "bg-ci-ink/10"
          }`}
        />

        {cover && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
              <FocalImage
                src={cover}
                alt={service.image_alt || service.title}
                focalX={service.focal_x}
                focalY={service.focal_y}
                focalZoom={service.focal_zoom}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="relative z-10 p-8 md:p-10">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="font-display text-2xl font-bold text-ci-ink md:text-3xl">
              {service.title}
            </h3>
            <ArrowUpRight
              className="h-6 w-6 shrink-0 text-ci-ink transition-transform group-hover:rotate-45"
              aria-hidden="true"
            />
          </div>

          {service.summary && (
            <p className="mb-6 leading-relaxed text-ci-ink/75">
              {service.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {service.price_text && (
              <span className="rounded-full bg-ci-ink px-4 py-1.5 text-sm font-bold text-white">
                {service.price_text}
              </span>
            )}
            <span className="font-display text-sm font-bold uppercase tracking-wide text-ci-ink">
              Reservar
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
