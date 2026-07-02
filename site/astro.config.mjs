import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// Public site is static-first (see CLAUDE.md — "the only DB-backed surface
// is the admin"). Every content page sets `export const prerender = true`
// and is built once from Supabase at build time. output:"server" exists
// only so the Session 4 capture endpoints (/api/suscribir, /api/contacto)
// can run as Vercel serverless functions without a second project.
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL || "https://conciencia-inquieta.vercel.app",
});
