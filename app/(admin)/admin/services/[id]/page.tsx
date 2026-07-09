import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Service } from "@/types";
import ServiceEditorForm from "@/components/admin/ServiceEditorForm";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single<Service>();

  if (!service) notFound();

  return <ServiceEditorForm initialData={service} />;
}
