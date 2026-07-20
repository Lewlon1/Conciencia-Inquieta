"use client";

import { useEffect } from "react";

// Fires article_read once ~5s after load (honest proxy for "opened and stayed"
// vs a bounce) and scroll_depth once at 75%. Both events from MVP Build plan
// Session 5's list. Zero-DOM client island — replaces the Astro inline script.
export default function ArticleTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let scrollFired = false;

    const readTimer = setTimeout(() => {
      window.ciTrack?.("article_read", { slug });
    }, 5000);

    const onScroll = () => {
      if (scrollFired) return;
      const doc = document.documentElement;
      const scrolled = (doc.scrollTop + doc.clientHeight) / doc.scrollHeight;
      if (scrolled >= 0.75) {
        scrollFired = true;
        window.ciTrack?.("scroll_depth", { slug, depth: "75" });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Short articles that fit the viewport never emit a scroll event, so 75%
    // would never register and a fully-read short piece would look unread. Check
    // once on the next frame (after layout) so an already-satisfied threshold fires.
    const raf = requestAnimationFrame(onScroll);
    return () => {
      clearTimeout(readTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [slug]);

  return null;
}
