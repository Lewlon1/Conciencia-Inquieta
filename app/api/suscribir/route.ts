import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CI's own MailerLite account/audience — never co-mingled with another client's
// list (CLAUDE.md golden rules). Double opt-in is controlled by the group's
// MailerLite dashboard setting, not a per-request flag — verify it's on before
// launch. MAILERLITE_* stay UNPREFIXED (server-only, never exposed to client).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const source = String(form.get("source") || "unknown").trim();

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  const back = (ok: "0" | "1") =>
    NextResponse.redirect(
      new URL(`/unete?ok=${ok}&source=${encodeURIComponent(source)}`, request.url),
      303
    );

  if (!EMAIL_RE.test(email)) return back("0");

  if (!apiKey || !groupId) {
    console.error(
      "MAILERLITE_API_KEY / MAILERLITE_GROUP_ID not set — see .env.example"
    );
    return back("0");
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
      const body = await res.text();
      console.error("MailerLite subscribe failed", res.status, body);
      return back("0");
    }

    return back("1");
  } catch (err) {
    console.error("MailerLite subscribe error", err);
    return back("0");
  }
}
