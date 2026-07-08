import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/admin/strings";
import type { ServiceBooking } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import BookingsTable from "@/components/admin/BookingsTable";

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("service_bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ServiceBooking[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.bookings.title}
        description={t.bookings.subtitle}
      />
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <BookingsTable initialBookings={bookings ?? []} />
      </div>
    </div>
  );
}
