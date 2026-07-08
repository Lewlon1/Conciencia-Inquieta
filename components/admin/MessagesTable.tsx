"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/admin/strings";
import type { ContactMessage } from "@/types";
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

export default function MessagesTable({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);

  async function toggleRead(id: string, isRead: boolean) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: isRead } : m))
    );
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: isRead })
      .eq("id", id);
    if (error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: !isRead } : m))
      );
    }
  }

  if (messages.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-[#b8b0a4]">{t.messages.empty}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#f0ede8]">
      {messages.map((m) => (
        <div key={m.id} className="px-6 py-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-sm font-medium text-[#1a1a18]">
                {m.name}
              </span>
              <span className="text-sm text-[#6b6560] ml-2">{m.email}</span>
              {m.subject && (
                <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#6b6560]">
                  {m.subject}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#b8b0a4]">
                {formatDate(m.created_at)}
              </span>
              <AdminToggle
                label={t.common.read}
                size="small"
                checked={m.is_read}
                onChange={(checked) => toggleRead(m.id, checked)}
              />
            </div>
          </div>
          <p className="text-sm text-[#1a1a18] whitespace-pre-wrap">
            {m.message}
          </p>
        </div>
      ))}
    </div>
  );
}
