import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Plain, cookieless anon client for the PUBLIC site: build-time content reads
// (statically generated / ISR pages) and the two capture Route Handlers.
// Created lazily so merely importing this module never throws when env vars are
// absent (e.g. a route handler's module is loaded during build for data
// collection, but its body doesn't run). Deliberately separate from
// lib/supabase/server.ts (the cookie SSR client) — using cookies() in a public
// page would opt it into dynamic rendering and break "public site is static".
export function getPublicSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example."
    );
  }
  client = createClient(url, anonKey);
  return client;
}
