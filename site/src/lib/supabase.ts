import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY — copy site/.env.example to site/.env and fill in the CI Supabase project's values."
  );
}

// Build-time only: this site is static (astro.config.mjs output: "static").
// Content is fetched once per build with the public anon key, never at request time.
export const supabase = createClient(url, anonKey);
