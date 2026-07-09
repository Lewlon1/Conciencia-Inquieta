import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/admin/strings";
import type { Subscriber } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import SubscribersTable from "@/components/admin/SubscribersTable";

export default async function AdminSubscribersPage() {
  const supabase = await createClient();

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Subscriber[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.subscribers.title}
        description={t.subscribers.subtitle}
      />
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <SubscribersTable initialSubscribers={subscribers ?? []} />
      </div>
    </div>
  );
}
