import { type NextRequest, NextResponse } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";
import {
  classifySource,
  cleanPath,
  clampStr,
  hostOf,
  isBot,
  isKnownEvent,
  parseDevice,
  sanitizeProps,
  visitorHash,
} from "@/lib/analytics/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// First-party, cookieless analytics sink. window.ciTrack (Analytics.tsx) beacons
// events here; we derive an anonymous row and insert it. GOLDEN RULE: this must
// never break or slow the page — EVERY path returns 204 fast, errors swallowed.
const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent");
    if (isBot(ua)) return noContent();

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return noContent();
    }

    const name = String(body?.name || "").trim();
    if (!isKnownEvent(name)) return noContent();

    // Anonymous daily visitor id. Client IP + UA are used ONLY to compute the
    // salted hash here and are never stored. No salt (or no IP) → no visitor id
    // rather than a guessable one; the event is still recorded.
    const salt = process.env.ANALYTICS_SALT;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    const hash = salt && ip ? visitorHash(ip, ua || "", salt) : null;

    const utm = (body?.utm ?? {}) as { source?: string; medium?: string; campaign?: string };
    const referrerHost = hostOf(body?.referrer as string | undefined);
    const selfHost = hostOf(request.headers.get("origin")) || request.nextUrl.hostname;

    const supabase = getPublicSupabase();
    await supabase.from("analytics_events").insert({
      name,
      path: cleanPath(body?.path as string | undefined),
      slug: clampStr(body?.slug, 256),
      referrer_host: referrerHost,
      utm_source: clampStr(utm.source),
      utm_medium: clampStr(utm.medium),
      utm_campaign: clampStr(utm.campaign, 256),
      source: classifySource(utm.source, referrerHost, selfHost),
      // Vercel edge geo header — absent locally, so country degrades to null.
      country: request.headers.get("x-vercel-ip-country") || null,
      device: parseDevice(ua),
      visitor_hash: hash,
      props: sanitizeProps(body?.props),
    });

    return noContent();
  } catch {
    // Analytics failures are silent by design — the visitor's request succeeds.
    return noContent();
  }
}
