# CLAUDE.md — Conciencia Inquieta

Operational context for Claude Code in this repo. The full session roadmap lives in `BUILD-PLAN.md` — read it when planning a build, not every turn.

## What this is
A self-managed Spanish-language digital magazine. **MVP goal: turn visitors into subscribers** (email list + one broadcast channel) and measure everything. No end-user accounts, payments, or shop in the MVP.

## Golden rules — do not violate
- This repo has its **OWN Supabase project**. NEVER touch the Astro-Psyche Lab / Gabriela project.
- **MailerLite = CI's own account/audience.** NEVER co-mingle with another client's list.
- Do **not** build end-user accounts, payments, shop, membership, Google Ads, or on-site search in the MVP (out of scope — see `BUILD-PLAN.md`).
- Inherited features — **service price management** and **content-generation tools** — stay **FLAGGED OFF**. Do not expose, link, or surface them. Flags are **code-managed booleans, Lewis-only**; Marie never sees a flag UI.
- **Never commit secrets.** All keys/refs in env (`.env`, git-ignored).
- Reference **exact filenames** when proposing changes. **Update `lessons.md`** at the end of every session.

## How to work with Lewis (tone)
- **Advisor, not assistant.** Open by challenging the assumption or naming the gap — never with agreement.
- Tag confidence before claims: **[Certain] / [Likely] / [Guessing]**.
- Cut filler. **Banned phrases:** "Great question", "You're absolutely right", "That makes a lot of sense", "Absolutely", "Definitely".
- **CLI-first.** Prefer commands and file edits over describing them.

## Stack
- **Next.js** (App Router) — ONE app serving both the public site (static/ISR, built from Supabase content) and the `/admin` CMS. (The public site was originally Astro in `site/`; merged into Next.js — see "Repo structure".)
- **Supabase** — backend + content store (this project) + **custom admin** (forked from Astro-Psyche Lab)
- **MailerLite** — email list, double opt-in (CI's own account)
- **Vercel** — hosting (`*.vercel.app` for now; custom domain later)
- **Analytics** — Plausible or Umami (TBD) · **Meta Pixel + CMP**, consent-gated

## Architecture
- Public pages are **static**; content comes from Supabase via the admin.
- The **only** DB-backed surface in the MVP is the **admin/CMS** (Marie logs in to post). No public auth.
- **Feature flags:** a single config of booleans. Off = hidden. Lewis-only. *(TODO: confirm path, e.g. `src/config/flags.ts`.)*

## Content model (magazine)
`article`: title · subtitle/deck · body · featured image · author (byline) · category (one of 9) · tags · reading time · published date · related logic.
**Categories:** Derechos humanos · Política internacional · Latinoamérica · Feminismo · Cultura · Medioambiente · Movimientos sociales · Opinión · Música y artes.
> The forked admin currently does **basic** article upload only. Session 2 extends it to the above.

## Brand tokens (CI's own — do NOT reuse Gabriela's design)
- **Colours:** cream `#fff9f1` · lilac `#e9c6e9` · marigold `#fabb5c` · aubergine `#382a44` · ink `#2b2434`
- **Type:** Fraunces (display/headlines) · Newsreader (article body) · Inter (UI)
- Reference: the approved CI prototype.

## Workflow
- Branch → build → **test on staging** → deploy. Migrations staging-first.
- End every session: update `lessons.md` (what changed, what broke, decisions, next step).

## Repo-specific values
- Supabase project ref (CI): `lfyerbxqfwjjftcpjzbv` (https://lfyerbxqfwjjftcpjzbv.supabase.co)
- Feature-flag config path: `config/flags.ts`
- Admin route/path: `/admin` (Supabase Auth email/password, see `middleware.ts`)
- MailerLite account + audience/group ID: `TODO`
- Secondary channel: `TODO (WhatsApp Channel | Telegram)`
- Analytics tool: `TODO (Plausible | Umami)`

## Repo structure — as of the merge (one Next.js app)
**One Next.js 14 App Router app, one Vercel project** serves both the admin (`/admin/*`) and the public magazine. This replaces the earlier Session-3 arrangement (Astro site in a sibling `site/` directory, two Vercel projects) — the public site was rewritten from Astro into Next.js and `site/` was deleted.

```
/
├─ app/
│  ├─ (public)/            # PUBLIC group — OWN <html>/<body>, indexable, imports public.css
│  │  ├─ layout.tsx        # shell (Sidebar/Topbar/Footer/NavOverlay/Analytics), Google-Fonts <link>, metadataBase, Organization JSON-LD
│  │  ├─ public.css        # CI brand tokens (was site/src/styles/global.css), own reset — NO Tailwind
│  │  ├─ page.tsx          # home (ISR revalidate=60)
│  │  ├─ articulos/{page, [slug]/page}   # [slug]: generateStaticParams + ISR + react-markdown + NewsArticle JSON-LD
│  │  ├─ categoria/[slug]/page.tsx
│  │  ├─ sobre-nosotras, unete, contacto, privacidad, cookies, terminos
│  │  └─ not-found.tsx     # in-group branded 404 (for notFound() on bad slugs)
│  ├─ (admin)/             # ADMIN group — OWN <html>/<body>, noindex, imports admin.css (Tailwind)
│  │  ├─ layout.tsx        # Inter via next/font, robots:{index:false}
│  │  ├─ admin.css         # @tailwind base/components/utilities + .admin-theme (was app/globals.css)
│  │  └─ admin/            # article CRUD, messages, login — unchanged behavior
│  ├─ api/{suscribir,contacto}/route.ts  # capture endpoints (dynamic, 303 redirects)
│  ├─ sitemap.ts, robots.ts              # Next-native SEO (replaces @astrojs/sitemap)
│  └─ (NO app/layout.tsx — two root layouts is what isolates the two CSS systems)
├─ components/
│  ├─ admin/               # AdminNav, ArticleEditorForm, ui/* (incl. AdminSelect)
│  └─ public/              # Sidebar,Topbar,NavOverlay,SubscribeForm,ContactForm,Analytics,ArticleTracker (client); Footer,ArticleCard,SecondaryChannelButton (server)
├─ config/flags.ts         # Lewis-only feature flags
├─ lib/
│  ├─ supabase/{client,server,middleware}.ts  # admin SSR/cookie auth — /admin only
│  ├─ supabase/public.ts   # lazy cookieless anon client — public build-time reads + capture routes
│  ├─ content.ts, categoryStyle.ts, seo.ts     # build-time queries + pageMetadata() canonical/OG helper
├─ middleware.ts           # matcher ["/admin/:path*"] — never runs on public routes
├─ types/index.ts, types/global.d.ts
├─ supabase/migrations/    # articles + categories + authors + contact_messages, RLS, staging-first
├─ docs/utm-cheatsheet.md
├─ lessons.md · MVP Build plan · CLAUDE.md
```

**Why two root layouts (no shared `app/layout.tsx`):** the admin uses Tailwind (whose `@tailwind base` Preflight is a global reset) and the public site has its own hand-written reset. Route groups `(public)`/`(admin)`, each owning its `<html>/<body>` and importing only its own CSS, make Next code-split the CSS so Preflight never loads on public routes (verified: public HTML links only the public-token chunk, Tailwind lives in a separate chunk). It also forces a full page reload on any public↔admin navigation, sidestecking React's "stylesheets not removed on soft-nav" bug — safe here anyway since nothing `<Link>`s across the boundary. Tradeoff accepted: no custom global `app/not-found.tsx` (needs a root layout under this structure), so genuinely-unmatched URLs get Next's default 404; bad article/category slugs still get the branded in-group 404. **Publish→live: ISR** (`revalidate=60`) — new/edited articles appear within ~1 min with no rebuild.

**Not ported from Astro-Psyche Lab (Session 1 scope call):** Testimonials, Events, Leads (CRM), Analytics dashboard, Engagement — all astrology-coaching-business-specific, no equivalent in the magazine model. The **service price management** and **content-generation tools** (repurpose, inspiration, transits, video-editor, photoshop — AWS Bedrock-backed) named in the golden rules above are **not in this repo at all yet**; `config/flags.ts` reserves the booleans, but the actual code stays in the source fork until a post-MVP session ports and reveals it one by one. If that reading is wrong, redirect — it was the leanest interpretation of the Session 1 checklist, not a locked-in architecture call.

**Not ported from Astro-Psyche Lab (Session 1 scope call):** Testimonials, Events, Leads (CRM), Analytics dashboard, Engagement — all astrology-coaching-business-specific, no equivalent in the magazine model. The **service price management** and **content-generation tools** (repurpose, inspiration, transits, video-editor, photoshop — AWS Bedrock-backed) named in the golden rules above are **not in this repo at all yet**; `config/flags.ts` reserves the booleans, but the actual code stays in the source fork until a post-MVP session ports and reveals it one by one. If that reading is wrong, redirect — it was the leanest interpretation of the Session 1 checklist, not a locked-in architecture call.
