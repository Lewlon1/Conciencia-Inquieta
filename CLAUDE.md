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
- **Astro** — public site (static, built from Supabase content)
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

## Repo structure — as of Session 3
The admin is a **root-level Next.js app** (App Router) — that's what was actually forked from Astro-Psyche Lab, not an Astro project. The public Astro site lives in **`site/`**, a separate, independently-deployable project against the same Supabase schema.

```
/
├─ app/
│  ├─ layout.tsx        # root layout — minimal, no Gabriela branding/fonts/pixel
│  ├─ globals.css
│  └─ admin/             # the only DB-backed surface in the MVP
│     ├─ layout.tsx, page.tsx, login/
│     └─ articles/       # article CRUD — category/author/tags/subtitle/featured image (Session 2)
├─ components/admin/     # AdminNav, SignOutButton, ArticleEditorForm, ui/* (incl. AdminSelect)
├─ config/flags.ts        # Lewis-only feature flags
├─ lib/supabase/          # client.ts, server.ts, middleware.ts (SSR auth)
├─ middleware.ts
├─ types/index.ts         # Category, Author, Article, ArticleWithRelations
├─ supabase/migrations/   # articles + categories + authors, RLS, staging-first
├─ site/                  # Astro public site (Session 3) — separate Vercel project
│  ├─ astro.config.mjs    # output:"server" + @astrojs/vercel — static pages via
│  │                        prerender=true, dynamic only for /api/* capture routes
│  ├─ src/pages/           # /, /articulos, /articulos/[slug], /categoria/[slug],
│  │                        /sobre-nosotras, /unete, /contacto, /privacidad,
│  │                        /cookies, /terminos, /api/* (Session 4)
│  ├─ src/components/      # Sidebar, Topbar, Footer, ArticleCard, SubscribeForm,
│  │                        SecondaryChannelButton
│  ├─ src/lib/             # supabase.ts, content.ts (build-time queries), types.ts
│  └─ src/styles/global.css  # CI brand tokens, trimmed from the approved prototype
│                              (no shop/cart/login/saved/search — out of MVP)
├─ lessons.md             # rolling log, updated each session
├─ MVP Build plan         # note: literal filename, no .md extension — this is the doc CLAUDE.md calls "BUILD-PLAN.md"
└─ CLAUDE.md
```

**Architecture question resolved (Session 3):** the admin stays at the repo root; the public site is a sibling project in `site/`, not a monorepo workspace and not nested under `admin/`. Two independent Vercel projects — root directory `.` for the admin, `site` for the public site. Rationale: Session 1 had already scaffolded the admin's `package.json`/`next.config.mjs`/`tailwind.config.ts` at repo root with no live deploy recorded yet, so moving it would have been pure churn with no counterbalancing win; adding a sibling directory was the smaller diff. **[Likely]** — push back if a true monorepo (shared `package.json` workspaces) is preferred instead.

**Not ported from Astro-Psyche Lab (Session 1 scope call):** Testimonials, Events, Leads (CRM), Analytics dashboard, Engagement — all astrology-coaching-business-specific, no equivalent in the magazine model. The **service price management** and **content-generation tools** (repurpose, inspiration, transits, video-editor, photoshop — AWS Bedrock-backed) named in the golden rules above are **not in this repo at all yet**; `config/flags.ts` reserves the booleans, but the actual code stays in the source fork until a post-MVP session ports and reveals it one by one. If that reading is wrong, redirect — it was the leanest interpretation of the Session 1 checklist, not a locked-in architecture call.
