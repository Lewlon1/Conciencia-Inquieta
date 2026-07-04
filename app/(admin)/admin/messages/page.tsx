import { createClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import MessagesTable from "@/components/admin/MessagesTable";

export default async function AdminMessagesPage() {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ContactMessage[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Messages"
        description="Submissions from the public site's contact form"
      />
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <MessagesTable initialMessages={messages ?? []} />
      </div>
    </div>
  );
}
