import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthorEditorForm from "@/components/admin/AuthorEditorForm";
import type { Author } from "@/types";

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: author } = await supabase
    .from("authors")
    .select("*")
    .eq("id", id)
    .single<Author>();

  if (!author) notFound();

  return <AuthorEditorForm initialData={author} />;
}
