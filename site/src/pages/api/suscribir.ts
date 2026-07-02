import type { APIRoute } from "astro";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CI's own MailerLite account/audience — never co-mingled with another
// client's list (see CLAUDE.md golden rules). Double opt-in must be enabled
// on the MAILERLITE_GROUP_ID group in the MailerLite dashboard — the
// Connect API does not take a per-request opt-in flag, it follows whatever
// the group/account is configured to do. Lewis: verify this is on before
// launch.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const source = String(form.get("source") || "unknown").trim();

  const apiKey = import.meta.env.MAILERLITE_API_KEY;
  const groupId = import.meta.env.MAILERLITE_GROUP_ID;

  const fail = () => redirect(`/unete?ok=0&source=${encodeURIComponent(source)}`, 303);
  const succeed = () => redirect(`/unete?ok=1&source=${encodeURIComponent(source)}`, 303);

  if (!EMAIL_RE.test(email)) {
    return fail();
  }

  if (!apiKey || !groupId) {
    console.error(
      "MAILERLITE_API_KEY / MAILERLITE_GROUP_ID not set — see site/.env.example"
    );
    return fail();
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
      return fail();
    }

    return succeed();
  } catch (err) {
    console.error("MailerLite subscribe error", err);
    return fail();
  }
};
