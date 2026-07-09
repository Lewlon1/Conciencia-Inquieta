import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";
import { FLAGS } from "@/config/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Newsletter signups land in Supabase (subscribers), read/exported from
// /admin/suscriptores. MailerLite is DORMANT: kept here behind FLAGS.mailerliteSync
// so re-enabling later is flag + env, not code archaeology (CLAUDE.md golden rules:
// CI's own audience, never co-mingled). MAILERLITE_* stay server-only (unprefixed).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const source = String(form.get("source") || "unknown").trim();

  const back = (ok: "0" | "1") =>
    NextResponse.redirect(
      new URL(`/unete?ok=${ok}&source=${encodeURIComponent(source)}`, request.url),
      303
    );

  if (!EMAIL_RE.test(email)) return back("0");

  const { error } = await getPublicSupabase()
    .from("subscribers")
    .insert({ email, source });

  // 23505 = unique_violation: already subscribed. Idempotent success, don't leak it.
  if (error && error.code !== "23505") {
    console.error("Subscriber insert failed", error);
    return back("0");
  }

  // Dormant MailerLite forward — only runs once Marie moves to MailerLite.
  if (FLAGS.mailerliteSync) {
    await forwardToMailerLite(email);
  }

  return back("1");
}

// Kept but inert until FLAGS.mailerliteSync is on and MAILERLITE_* are set.
// Best-effort: a failure here must never fail the signup (the DB write already succeeded).
async function forwardToMailerLite(email: string) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!apiKey || !groupId) {
    console.error("mailerliteSync ON but MAILERLITE_API_KEY / MAILERLITE_GROUP_ID not set");
    return;
  }
  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, groups: [groupId] }),
    });
    if (!res.ok) {
      console.error("MailerLite forward failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("MailerLite forward error", err);
  }
}
