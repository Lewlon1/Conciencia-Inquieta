// Server-only helpers for the /api/track ingestion route. Everything here turns
// a raw beacon + request headers into ONE strictly-anonymous analytics_events
// row: no cookie, no stored IP, no stored raw user-agent — only a daily-rotating
// salted hash and coarse derived fields. See migration 0011 + the design plan.

import { createHash } from "node:crypto";

export type TrackEvent = {
  name: string;
  path?: string;
  slug?: string;
  referrer?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  props?: Record<string, string>;
};

// Only events our own client fires are accepted — anything else is dropped, so a
// stray/abusive POST can't invent event names that pollute the dashboard.
const KNOWN_EVENTS = new Set([
  "pageview",
  "signup",
  "cta_click",
  "channel_click",
  "article_read",
  "scroll_depth",
]);

export function isKnownEvent(name: string): boolean {
  return KNOWN_EVENTS.has(name);
}

// Crawlers, link-preview fetchers, headless/testing agents, scripting clients.
// A missing UA is treated as a bot too (real browsers always send one).
const BOT_RE =
  /bot|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|embedly|quora|outbrain|pinterest|preview|monitor|lighthouse|headless|phantom|puppeteer|playwright|selenium|python-requests|curl\/|wget|axios|node-fetch|go-http|okhttp|java\//i;

export function isBot(ua: string | null): boolean {
  if (!ua) return true;
  return BOT_RE.test(ua);
}

export function parseDevice(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/ipad|tablet|playbook|silk|kindle|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini|windows phone/i.test(ua))
    return "mobile";
  return "desktop";
}

// Daily-rotating anonymous visitor id. The UTC date is part of the input so it
// changes on its own every midnight; the salt makes it non-recomputable without
// the server secret. Truncated to 32 hex chars — plenty to avoid collisions at
// our scale, and never reversible to a person.
export function visitorHash(ip: string, ua: string, salt: string): string {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return createHash("sha256").update(`${day}|${ip}|${ua}|${salt}`).digest("hex").slice(0, 32);
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // Bare hostnames (from the Origin header) parse fine once given a scheme.
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function cleanPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== "string") return null;
  const p = path.split("?")[0].split("#")[0];
  return p ? p.slice(0, 512) : null;
}

// UTM source vocab (docs/utm-cheatsheet.md) → display label.
const UTM_MAP: Record<string, string> = {
  instagram: "Instagram",
  x: "X",
  twitter: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  newsletter: "Newsletter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

// Referrer hostname → channel, when there's no UTM to trust.
const HOST_MAP: { test: RegExp; label: string }[] = [
  { test: /(^|\.)(google|bing|duckduckgo|ecosia|yahoo|yandex|baidu|qwant|startpage)\./i, label: "Búsqueda" },
  { test: /(^|\.)instagram\.com$/i, label: "Instagram" },
  { test: /(^|\.)(t\.co|twitter\.com|x\.com)$/i, label: "X" },
  { test: /(^|\.)tiktok\.com$/i, label: "TikTok" },
  { test: /(^|\.)(youtube\.com|youtu\.be)$/i, label: "YouTube" },
  { test: /(^|\.)(facebook\.com|m\.facebook\.com|lm\.facebook\.com|fb\.me)$/i, label: "Facebook" },
  { test: /(^|\.)(t\.me|telegram\.org|telegram\.me)$/i, label: "Telegram" },
  { test: /(^|\.)(whatsapp\.com|wa\.me)$/i, label: "WhatsApp" },
  { test: /(^|\.)linkedin\.com$/i, label: "LinkedIn" },
  { test: /(^|\.)reddit\.com$/i, label: "Reddit" },
];

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Traffic channel for an event: UTM first (matches Marie's link convention),
// else the referrer host mapped to a friendly label, else "Directo". An internal
// referrer (our own host) counts as Directo, never a fake self-referral.
export function classifySource(
  utmSource: string | null | undefined,
  referrerHost: string | null,
  selfHost: string | null
): string {
  const utm = (utmSource || "").trim().toLowerCase();
  if (utm) return UTM_MAP[utm] || titleCase(utm);
  if (referrerHost) {
    const h = referrerHost.toLowerCase();
    if (selfHost && (h === selfHost || h.endsWith(`.${selfHost}`))) return "Directo";
    for (const { test, label } of HOST_MAP) if (test.test(h)) return label;
    return h;
  }
  return "Directo";
}

// Shallow string→string map, bounded in key count and length, so a hostile
// beacon can't stuff arbitrary/huge JSON into props.
export function sanitizeProps(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, string> = {};
  let i = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (i++ >= 12) break;
    if (v == null) continue;
    out[String(k).slice(0, 40)] = String(v).slice(0, 200);
  }
  return Object.keys(out).length ? out : null;
}

export function clampStr(v: unknown, n = 128): string | null {
  return typeof v === "string" && v ? v.slice(0, n) : null;
}
