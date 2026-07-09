import { getPublicSupabase } from "@/lib/supabase/public";
import type { ArticleWithRelations, Category, Service } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await getPublicSupabase()
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// Paginated so we never silently drop past Supabase's default ~1000-row cap —
// matters for generateStaticParams (a missing slug 404s under our config).
export async function getPublishedArticles(): Promise<ArticleWithRelations[]> {
  const pageSize = 1000;
  const all: ArticleWithRelations[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getPublicSupabase()
      .from("articles")
      .select("*, category:categories(*), author:authors(*)")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(from, from + pageSize - 1)
      .returns<ArticleWithRelations[]>();
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
  }
  return all;
}

export async function getArticleBySlug(
  slug: string
): Promise<ArticleWithRelations | null> {
  const { data, error } = await getPublicSupabase()
    .from("articles")
    .select("*, category:categories(*), author:authors(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<ArticleWithRelations>();
  if (error) throw error;
  return data;
}

export function getArticlesByCategory(
  articles: ArticleWithRelations[],
  categorySlug: string
): ArticleWithRelations[] {
  return articles.filter((a) => a.category?.slug === categorySlug);
}

/** Same category, most recent first, excluding self; pads with the most
 * recent other articles if the category doesn't have enough. Matches the
 * approved CI prototype's related-articles logic. */
export function getRelatedArticles(
  article: ArticleWithRelations,
  all: ArticleWithRelations[],
  limit = 3
): ArticleWithRelations[] {
  const sameCategory = all.filter(
    (a) => a.id !== article.id && a.category_id === article.category_id
  );
  const rest = all.filter(
    (a) => a.id !== article.id && a.category_id !== article.category_id
  );
  return [...sameCategory, ...rest].slice(0, limit);
}

// ---------- Services (public reads, published only) ----------

// The services feature ships its migration (0009) as a manual apply, but Vercel
// auto-deploys on push — so there's a window where this code is live before the
// `services` table exists. Tolerate ONLY that "table not migrated yet" state
// (PostgREST PGRST205 / Postgres 42P01 undefined_table) so a new-but-absent
// table can't fail the whole site build; the pages fall back to their empty
// state until 0009 is applied. Any OTHER error (permissions, network) still
// throws loudly, exactly like the article queries above.
function isMissingTableError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export async function getPublishedServices(): Promise<Service[]> {
  const { data, error } = await getPublicSupabase()
    .from("services")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Service[]>();
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const { data, error } = await getPublicSupabase()
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<Service>();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  return data;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
