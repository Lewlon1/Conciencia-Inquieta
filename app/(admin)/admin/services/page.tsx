import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Service } from "@/types";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { t } from "@/lib/admin/strings";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminServicesPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Service[]>();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.services.title}
        action={{ label: t.services.newService, href: "/admin/services/new" }}
      />

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        {services && services.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.services.tableImage}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.services.tableTitle}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.services.tablePrice}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.services.tableStatus}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  {t.services.tableUpdated}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede8]">
              {services.map((service) => {
                const cover = service.image_urls?.[0];
                return (
                  <tr
                    key={service.id}
                    className="group hover:bg-[#f5f3ef] transition-colors"
                  >
                    <td className="px-6 py-4">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={service.image_alt ?? ""}
                          className="w-11 h-11 object-cover rounded-md border border-[#e8e5df]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-md bg-[#f5f3ef] flex items-center justify-center text-[#b8b0a4] text-sm">
                          &mdash;
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="text-sm font-medium text-[#1a1a18] hover:underline"
                      >
                        {service.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6560]">
                      {service.price_text ?? (
                        <span className="text-[#b8b0a4]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {service.is_published ? (
                        <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                          {t.common.published}
                        </span>
                      ) : (
                        <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                          {t.common.draft}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6560]">
                      {formatDate(service.updated_at) ?? (
                        <span className="text-[#b8b0a4]">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#b8b0a4]">{t.services.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
