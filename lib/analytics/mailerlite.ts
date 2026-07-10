// Server-only pull of the CI MailerLite group's current subscriber counts, for
// the analytics reconciliation card. Uses the same MAILERLITE_* secrets as
// /api/suscribir (CI's own account/audience — golden rule; never co-mingled).
// Null-safe: returns null when unconfigured or on any failure, so the dashboard
// degrades to a "connect it" state and never breaks.

export interface MailerliteStats {
  /** Confirmed subscribers (double opt-in complete). */
  active: number;
  /** Signed up but not yet confirmed — the double-opt-in drop-off. */
  unconfirmed: number;
}

export async function getMailerliteStats(): Promise<MailerliteStats | null> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!apiKey || !groupId) return null;

  try {
    const res = await fetch(`https://connect.mailerlite.com/api/groups/${groupId}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // MailerLite counts move slowly; cache briefly so the dashboard doesn't
      // hit their API on every load (the page itself is dynamic).
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: Record<string, unknown> };
    const d = json?.data ?? {};
    const active = Number(d.active_count);
    if (!Number.isFinite(active)) return null;
    const unconfirmed = Number(d.unconfirmed_count);
    return { active, unconfirmed: Number.isFinite(unconfirmed) ? unconfirmed : 0 };
  } catch {
    return null;
  }
}
