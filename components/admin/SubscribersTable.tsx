"use client";

import { t } from "@/lib/admin/strings";
import { toCsv } from "@/lib/csv";
import type { Subscriber } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubscribersTable({
  initialSubscribers,
}: {
  initialSubscribers: Subscriber[];
}) {
  const subscribers = initialSubscribers;

  function exportCsv() {
    const csv = toCsv(
      subscribers.map((s) => ({
        email: s.email,
        source: s.source ?? "",
        created_at: s.created_at,
      })),
      ["email", "source", "created_at"]
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suscriptores-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (subscribers.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-[#b8b0a4]">{t.subscribers.empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#f0ede8]">
        <span className="text-sm text-[#6b6560]">
          {subscribers.length} {t.subscribers.count}
        </span>
        <button
          onClick={exportCsv}
          className="text-sm px-3 py-1.5 rounded-lg bg-[#1a1a18] text-white hover:bg-[#333] transition-colors"
        >
          {t.subscribers.exportCsv}
        </button>
      </div>
      <div className="divide-y divide-[#f0ede8]">
        {subscribers.map((s) => (
          <div
            key={s.id}
            className="px-6 py-3 flex items-center justify-between flex-wrap gap-2"
          >
            <div>
              <span className="text-sm font-medium text-[#1a1a18]">
                {s.email}
              </span>
              {s.source && (
                <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#6b6560]">
                  {s.source}
                </span>
              )}
            </div>
            <span className="text-xs text-[#b8b0a4]">
              {formatDate(s.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
