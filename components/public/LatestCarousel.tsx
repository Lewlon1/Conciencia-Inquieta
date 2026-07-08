"use client";

import { useEffect, useRef, useState } from "react";
import ArticleCard from "./ArticleCard";
import type { ArticleWithRelations } from "@/types";

const GAP = 24;
// Mirrors the .grid responsive breakpoints in public.css (3 → 2 → 1 per view).
const BREAKPOINTS: [number, number][] = [
  [1024, 2],
  [600, 1],
];

function perViewForWidth(width: number): number {
  for (const [max, view] of BREAKPOINTS) {
    if (width <= max) return view;
  }
  return 3;
}

interface Props {
  articles: ArticleWithRelations[];
  intervalMs?: number;
}

export default function LatestCarousel({ articles, intervalMs = 4000 }: Props) {
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => setPerView(perViewForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const count = articles.length;
  const view = Math.max(1, Math.min(count, perView));
  const maxIndex = Math.max(0, count - view);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (paused || reduceMotion || maxIndex === 0) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, Math.max(1500, intervalMs));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, maxIndex, intervalMs]);

  if (count === 0) {
    return (
      <p
        style={{
          color: "var(--muted)",
          fontFamily: "var(--read)",
          fontStyle: "italic",
        }}
      >
        Todavía no hay artículos publicados.
      </p>
    );
  }

  const goTo = (i: number) => {
    let n = i;
    if (n < 0) n = maxIndex;
    if (n > maxIndex) n = 0;
    setIndex(n);
  };

  const trackTransform = `translateX(calc((100% + ${GAP}px) / ${view} * ${-index}))`;
  const cardFlex = `0 0 calc((100% - ${(view - 1) * GAP}px) / ${view})`;
  const showControls = maxIndex > 0;

  return (
    <>
      <div className="shead">
        <h2>
          Lo último<span className="dot">.</span>
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a className="seeall" href="/articulos">
            Ver todos los artículos →
          </a>
          {showControls && (
            <div className="carousel-nav">
              <button
                type="button"
                className="carousel-arrow"
                aria-label="Anterior"
                onClick={() => goTo(index - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-arrow"
                aria-label="Siguiente"
                onClick={() => goTo(index + 1)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className="carousel-wrap"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="carousel-track" style={{ transform: trackTransform }}>
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} style={{ flex: cardFlex }} />
          ))}
        </div>
      </div>
      {showControls && (
        <div className="carousel-dots">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`carousel-dot${i === index ? " active" : ""}`}
              aria-label={`Ir a grupo ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </>
  );
}
