# Analytics suite + admin dashboard — design & build plan

**Date:** 2026-07-09
**Branch:** `claude/analytics-suite-dashboard-ksqqrq`
**Status:** Phases 0 + 1 built (see `lessons.md` Session 8). Migration `0011` awaits manual apply; Phase 2 (MailerLite reconciliation, rollup) deferred.

---

## Decision (from Lewis, before designing)

1. **Data source: first-party table.** Capture events into our own Supabase table. Build the funnel + attribution from data we own.
2. **No external analytics provider.** Fully custom, Supabase-native — the astro-lab precedent. Plausible/Umami are dropped as a dependency (the hooks in `Analytics.tsx` can stay dormant/removed — see Phase 3). We reimplement the load-bearing 10% of a web-analytics tool ourselves; the tradeoffs are accepted below.
3. **Audience: both, tabbed.** One `/admin/analytics` route with a **Resumen** tab (Lewis / conversion funnel) and a **Contenido** tab (Marie / editorial).

## The one-line reframe

The MVP has a single success metric: **do visitors become subscribers, and what drives it.** This suite is a *conversion-funnel + editorial-performance* dashboard, not a general web-analytics clone. Generic charts (top pages, devices, countries) are supporting context, not the point.

---

## What already exists (build on it, don't duplicate)

- `components/public/Analytics.tsx` installs `window.ciTrack(event, props)` — the single choke point every event flows through — and delegates `[data-event]` clicks. Currently forwards to Plausible/Umami + consent-gates the Meta Pixel.
- Events already firing: `signup` (SubscribeForm success), `cta_click` (Topbar, Sidebar — carry `data-cta`), `channel_click` (SecondaryChannelButton), `article_read` (5s dwell, `ArticleTracker`), `scroll_depth` (75%, `ArticleTracker`).
- **No `pageview` event and no server sink exist yet** — both are new here.
- `types/global.d.ts` types `ciTrack`. `docs/utm-cheatsheet.md` defines the UTM vocab that feeds source classification.
- RLS/grant pattern to copy verbatim: `supabase/migrations/0005_contact_messages.sql` (public INSERT, admin-only SELECT). Note `0007`'s `ALTER DEFAULT PRIVILEGES` auto-grants anon SELECT on new tables → sensitive tables must **explicitly `REVOKE SELECT … FROM anon`** (as `service_bookings` does).

---

## Honest tradeoffs of going fully custom

We are reimplementing a web-analytics tool's core. The parts that become *our* responsibility, and how we discharge each:

| Concern | Hosted tool did it for free | Our approach |
|---|---|---|
| Unique visitors without cookies | daily salted hash | `sha256(day + ip + ua + ANALYTICS_SALT)`, computed in the ingest route, **only the hash stored**; rotates daily so it's non-reversible and holds no PII |
| Bot inflation | maintained crawler lists | UA denylist regex at ingestion; drop → 204 |
| Referrer/source naming | maintained dataset | UTM-first, else referrer-host → small dictionary, else "Direct" |
| Geo / device | IP→geo, UA parse | `x-vercel-ip-country` header (no IP stored); light UA → mobile/desktop/tablet |
| Write volume / retention | absorbed by SaaS | raw table now; daily rollup + prune later (Phase 2) |
| Being data controller for raw logs | their problem | keep rows strictly anonymous; short retention |

**Verdict [Likely]:** justified for this project — bootstrapped, launch-stage, single conversion metric, low traffic. The pipeline exists anyway (we chose first-party for the funnel), it's zero external cost, and it matches the astro-lab pattern Lewis pointed at. The cost is more code + ongoing ownership than deferring to Plausible; accepted.

---

## Schema — migration `0011_analytics_events.sql` (manual apply, like every prior migration)

### `analytics_events` (raw)
- `id bigint generated always as identity primary key` — bigint, not uuid (high row count)
- `created_at timestamptz default now()`
- `name text not null` — `pageview | signup | cta_click | channel_click | article_read | scroll_depth`
- `path text` — URL path, query stripped
- `slug text` — article/service slug when relevant
- `referrer_host text`
- `utm_source text`, `utm_medium text`, `utm_campaign text`
- `source text` — derived channel label (Instagram/Search/Direct/…)
- `country text` — 2-letter (Vercel header), nullable
- `device text` — `mobile | desktop | tablet`
- `visitor_hash text` — daily-rotating anonymous hash (uniques + same-day session stitching)
- `props jsonb` — event-specific overflow (cta id, scroll depth, source passed by SubscribeForm)

Indexes: `(created_at)`, `(name, created_at)`, `(slug)`, `(visitor_hash, created_at)`.

**RLS/grants** (mirror `0005` + the `0007`/`service_bookings` REVOKE guard):
- `ENABLE ROW LEVEL SECURITY`
- `Public: insert events` — `FOR INSERT WITH CHECK (true)` (inserts come from our server route via the anon key, same as contact_messages)
- `Admin: read events` — `FOR SELECT USING (auth.role() = 'authenticated')`
- `GRANT INSERT ON analytics_events TO anon;` · `REVOKE SELECT ON analytics_events FROM anon;` (raw events are not public)

### `analytics_daily` (rollup) — **Phase 2, deferred**
`day date`, `dimension text` (`total|source|article|path`), `key text`, `visitors int`, `pageviews int`, `signups int`, funnel counts; PK `(day, dimension, key)`. Populated by a `roll_up_analytics(target_day date)` SQL function run daily (pg_cron preferred; Vercel Cron → secret-protected `/api/cron/rollup` fallback). **Phase 1 queries `analytics_events` directly** — at launch traffic this is fine, simpler, and testable. Add the rollup only when the raw table gets big.

---

## Ingestion path

New `POST /api/track/route.ts` (`runtime = "nodejs"`, `dynamic = "force-dynamic"`):
- Accepts a small JSON beacon `{ name, path, slug?, referrer?, utm?, props? }` sent via `navigator.sendBeacon` / `fetch(..., {keepalive:true})`.
- Server derives: `visitor_hash` (salted daily hash from `x-forwarded-for` + UA + `ANALYTICS_SALT`), `country` (`x-vercel-ip-country`), `device` (UA parse), `source` (UTM→referrer classifier), **bot check** (UA denylist → return 204, no insert).
- Inserts one anonymous row via the anon Supabase client. **Always returns 204 fast; never throws into the page** (analytics must never break the site — same rule `ciTrack` already follows).

Client wiring (extend, don't replace):
- `Analytics.tsx`: `ciTrack` also POSTs to `/api/track` alongside the existing (now-optional) plausible/umami calls. Add a **`pageview`** fire on route change (`usePathname` effect) — the one genuinely new client event.
- Keep the existing `[data-event]` delegation and `ArticleTracker`/`SubscribeForm` calls unchanged — they already flow through `ciTrack`, so they reach the new sink for free.

New env: `ANALYTICS_SALT` (server-only, unprefixed) — the daily-hash secret, the **only** new secret. Optional `NEXT_PUBLIC_ANALYTICS_INGEST=on|off` kill switch.

---

## Dashboard — `app/(admin)/admin/analytics/page.tsx`

Server component, dynamic, reads Supabase via the SSR client (auth-gated by existing `middleware.ts`). Add **"Analíticas"** to `AdminNav` + a `t.nav.analytics` string. Charts follow the **dataviz skill** + CI brand tokens, rendered as lightweight inline SVG/CSS bars (zero new chart deps — matches repo ethos). Date-range selector (7/30/90d) via `?range=`. Real empty states (no data yet).

### Tab 1 — Resumen (Lewis / funnel)
- **KPI row:** Unique visitors · Pageviews · Signups · **Conversion rate** (signups/visitors), each with % vs previous period.
- **Funnel:** Visitors → article_read → cta_click → signup, with drop-off %.
- **Signups by source** (bar): instagram/x/tiktok/direct/search… — the "which channel converts" answer, from UTM/referrer.
- **Trend** (line): visitors + signups per day.
- **MailerLite reconciliation** (Phase 2): server-side pull of confirmed-subscriber count via `MAILERLITE_API_KEY`; show "site signups (N) vs confirmed subscribers (M)" to expose double-opt-in drop-off. The one external pull, and the source-of-truth number.

### Tab 2 — Contenido (Marie / editorial)
- **Article table:** reads (`article_read`), % who hit 75% scroll, signups attributed, sorted by reads.
- **Top by reads** and **top by signup contribution.**
- Scannable — answers "what should I write next."

### Attribution model (state the limit)
Last-touch: the `signup` event already carries its `source`; article→signup is joined via the same `visitor_hash` same-day `article_read` events. **[Likely]** good enough for MVP; note it's last-touch (not multi-touch) and the hash rotates daily, so cross-day journeys aren't stitched — a deliberate privacy tradeoff.

---

## GDPR posture (must ship correct)

No cookie, no localStorage id, no stored IP, no stored raw UA. Stored: daily-rotating non-reversible hash, coarse country, device class, referrer host, UTMs, path/slug. Same "legitimate-interest, consent-free" bucket as today's cookieless setup; Meta Pixel stays consent-gated (separate advertising purpose). Update `/cookies` + `/privacidad` to describe first-party analytics honestly. **[Likely]** — flag for the same lawyer pass the other legal pages already need.

---

## Phasing

- **Phase 0 — ingestion (buildable + fixture-testable now):** `0011` schema, `/api/track`, extend `ciTrack` + add `pageview`, `ANALYTICS_SALT`. No external account needed.
- **Phase 1 — dashboard:** `/admin/analytics` Resumen + Contenido reading raw events; nav + strings; SVG/CSS charts (dataviz skill). Fixture-seed rows to verify.
- **Phase 2 — reconciliation + scale:** MailerLite subscriber pull (needs real key); `analytics_daily` rollup + pruning when volume warrants.
- **Phase 3 — cleanup:** decide whether to remove the dormant Plausible/Umami hooks in `Analytics.tsx` or keep them inert. Recommend keep inert (cheap, harmless) but don't provision.

---

## Blockers (inherited — same as every prior session)

- **Supabase MCP still points at the wrong project** → `0011` is a manual apply by Lewis in the `lfyerbxqfwjjftcpjzbv` SQL editor.
- **No MailerLite key in this env** → Phase 2 reconciliation is unverifiable in-sandbox.
- **Vercel-only headers** (`x-vercel-ip-country`, real client IP) are absent locally → country degrades to null; hashing falls back to whatever IP header is present. Verify on a Vercel preview.
- Sandbox can't reach live Supabase → Phases 0–1 verified with fixture-seeded rows (the established pattern), real end-to-end needs Lewis after migration.

---

## Rough effort

Phases 0+1 ≈ one focused session: 1 migration, 1 API route, ~3 client edits, 1 dashboard route + 2 tabs + ~5 chart/table components, nav + strings. All fixture-testable. Phase 2 is small but gated on live creds.
