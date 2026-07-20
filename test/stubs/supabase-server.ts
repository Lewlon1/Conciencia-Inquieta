// Test stub for @/lib/supabase/server. The pure query helpers exercised by the
// unit tests never call createClient(); it exists only so importing
// lib/analytics/queries.ts doesn't drag next/headers into the test runtime.
export async function createClient(): Promise<never> {
  throw new Error("supabase server client is stubbed in unit tests");
}
