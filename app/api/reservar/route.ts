import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Service booking requests land in Supabase (service_bookings), read from
// /admin/reservas. Field names stay nombre/email/telefono/mensaje/servicio/
// servicio_titulo → columns name/email/phone/message/service_id/service_title.
// service_title is a denormalized snapshot so the request stays legible even if
// the offering is later renamed or deleted.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const name = String(form.get("nombre") || "").trim();
  const email = String(form.get("email") || "").trim();
  const phone = String(form.get("telefono") || "").trim();
  const message = String(form.get("mensaje") || "").trim();
  const serviceId = String(form.get("servicio") || "").trim();
  const serviceTitle = String(form.get("servicio_titulo") || "").trim();

  // Redirect back to the offering the visitor came from (falls back to the list).
  const slug = String(form.get("slug") || "").trim();
  const path = slug ? `/servicios/${slug}` : "/servicios";
  const back = (ok: "0" | "1") =>
    NextResponse.redirect(new URL(`${path}?ok=${ok}`, request.url), 303);

  if (!name || !EMAIL_RE.test(email) || !phone) return back("0");

  const { error } = await getPublicSupabase()
    .from("service_bookings")
    .insert({
      service_id: serviceId || null,
      service_title: serviceTitle || null,
      name,
      email,
      phone,
      message: message || null,
    });

  if (error) {
    console.error("Service booking insert failed", error);
    return back("0");
  }

  return back("1");
}
