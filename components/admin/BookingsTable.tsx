"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/admin/strings";
import type { ServiceBooking } from "@/types";
import AdminToggle from "@/components/admin/ui/AdminToggle";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingsTable({
  initialBookings,
}: {
  initialBookings: ServiceBooking[];
}) {
  const supabase = createClient();
  const [bookings, setBookings] = useState(initialBookings);

  async function toggleRead(id: string, isRead: boolean) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_read: isRead } : b))
    );
    const { error } = await supabase
      .from("service_bookings")
      .update({ is_read: isRead })
      .eq("id", id);
    if (error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_read: !isRead } : b))
      );
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-[#b8b0a4]">{t.bookings.empty}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#f0ede8]">
      {bookings.map((b) => (
        <div
          key={b.id}
          className={`px-6 py-4 space-y-2 ${b.is_read ? "" : "bg-[#fffaf0]"}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <span className="text-sm font-medium text-[#1a1a18]">
                {b.name}
              </span>
              <a
                href={`mailto:${b.email}`}
                className="text-sm text-[#6b6560] hover:underline"
              >
                {b.email}
              </a>
              <a
                href={`tel:${b.phone.replace(/\s+/g, "")}`}
                className="text-sm text-[#6b6560] hover:underline"
              >
                {t.bookings.phone}: {b.phone}
              </a>
              {b.service_title && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6e7f6] text-[#382a44]">
                  {b.service_title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#b8b0a4]">
                {formatDate(b.created_at)}
              </span>
              <AdminToggle
                label={t.common.read}
                size="small"
                checked={b.is_read}
                onChange={(checked) => toggleRead(b.id, checked)}
              />
            </div>
          </div>
          {b.message && (
            <p className="text-sm text-[#1a1a18] whitespace-pre-wrap">
              {b.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
