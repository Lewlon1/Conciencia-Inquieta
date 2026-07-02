import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Article, Category, Author } from "@/types";
import ArticleEditorForm from "@/components/admin/ArticleEditorForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: article }, { data: categories }, { data: authors }] =
    await Promise.all([
      supabase.from("articles").select("*").eq("id", id).single<Article>(),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("authors").select("*").order("name"),
    ]);

  if (!article) notFound();

  return (
    <ArticleEditorForm
      initialData={article}
      categories={(categories as Category[]) ?? []}
      authors={(authors as Author[]) ?? []}
    />
  );
}
