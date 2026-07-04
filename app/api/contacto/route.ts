import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Contact messages land in Supabase (contact_messages), read from /admin/messages.
// Field names stay nombre/email/asunto/mensaje → columns name/email/subject/message.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const name = String(form.get("nombre") || "").trim();
  const email = String(form.get("email") || "").trim();
  const subject = String(form.get("asunto") || "").trim();
  const message = String(form.get("mensaje") || "").trim();

  const back = (ok: "0" | "1") =>
    NextResponse.redirect(new URL(`/contacto?ok=${ok}`, request.url), 303);

  if (!name || !EMAIL_RE.test(email) || !message) return back("0");

  const { error } = await getPublicSupabase()
    .from("contact_messages")
    .insert({ name, email, subject: subject || null, message });

  if (error) {
    console.error("Contact message insert failed", error);
    return back("0");
  }

  return back("1");
}
