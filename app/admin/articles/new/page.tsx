import { createClient } from "@/lib/supabase/server";
import ArticleEditorForm from "@/components/admin/ArticleEditorForm";
import type { Article, Category, Author } from "@/types";

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const params = await searchParams;
  const prefillTitle = params.title || "";
  const supabase = await createClient();

  const [{ data: categories }, { data: authors }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("authors").select("*").order("name"),
  ]);

  const initialData = prefillTitle
    ? ({ title: prefillTitle } as Article)
    : undefined;

  return (
    <ArticleEditorForm
      initialData={initialData}
      categories={(categories as Category[]) ?? []}
      authors={(authors as Author[]) ?? []}
    />
  );
}
