// Minimal module-resolution hook so `node --test --experimental-strip-types`
// can resolve the project's `@/*` path alias (tsconfig `paths`) without pulling
// in a bundler. Also stubs the Supabase server client — it imports `next/headers`
// at module load, which only exists inside the Next runtime; the pure helpers
// under test (delta/conversionRate/normalizeRange/…) never call it.
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const STUB_SUPABASE = "@/lib/supabase/server";
const stubUrl = pathToFileURL(pathResolve(ROOT, "test/stubs/supabase-server.ts")).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === STUB_SUPABASE) {
    return { url: stubUrl, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const url = pathToFileURL(pathResolve(ROOT, `${rel}.ts`)).href;
    return { url, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
