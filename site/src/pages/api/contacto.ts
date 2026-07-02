import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const name = String(form.get("nombre") || "").trim();
  const email = String(form.get("email") || "").trim();
  const subject = String(form.get("asunto") || "").trim();
  const message = String(form.get("mensaje") || "").trim();

  if (!name || !EMAIL_RE.test(email) || !message) {
    return redirect("/contacto?ok=0", 303);
  }

  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, subject: subject || null, message });

  if (error) {
    console.error("Contact message insert failed", error);
    return redirect("/contacto?ok=0", 303);
  }

  return redirect("/contacto?ok=1", 303);
};
