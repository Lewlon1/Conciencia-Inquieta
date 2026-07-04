import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public site indexable; /admin disallowed at the crawl level (its own
// noindex metadata is the belt-and-braces layer).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL,
  };
}
