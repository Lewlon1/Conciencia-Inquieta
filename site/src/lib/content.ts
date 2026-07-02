import { supabase } from "./supabase";
import type { ArticleWithRelations, Category } from "./types";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getPublishedArticles(): Promise<ArticleWithRelations[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(*), author:authors(*)")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<ArticleWithRelations[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getArticleBySlug(
  slug: string
): Promise<ArticleWithRelations | null> {
  const { data, error } = await supabase
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

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
