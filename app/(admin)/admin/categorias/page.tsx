import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import CategoryListEditor from "@/components/admin/CategoryListEditor";
import { t } from "@/lib/admin/strings";
import type { Category } from "@/types";

// PostgREST returns an embedded aggregate as a one-element array: [{ count: n }].
type CategoryRow = Category & { articles: { count: number }[] };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("*, articles(count)")
    .order("sort_order")
    .returns<CategoryRow[]>();

  const categories = (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    sort_order: c.sort_order,
    articleCount: c.articles?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.categories.title}
        description={t.categories.subtitle}
      />
      <CategoryListEditor initialCategories={categories} />
    </div>
  );
}
