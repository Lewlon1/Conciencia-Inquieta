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

## Repo structure — as of Session 1
The admin is a **root-level Next.js app** (App Router) — that's what was actually forked from Astro-Psyche Lab, not an Astro project. The "Stack" section above describing an Astro public site is the **Session 3 target**, not what exists today.

```
/
├─ app/
│  ├─ layout.tsx        # root layout — minimal, no Gabriela branding/fonts/pixel
│  ├─ globals.css
│  └─ admin/             # the only DB-backed surface in the MVP
│     ├─ layout.tsx, page.tsx, login/
│     └─ blog/           # basic article CRUD (Session 2 extends the content model)
├─ components/admin/     # AdminNav, SignOutButton, BlogEditorForm, ui/*
├─ config/flags.ts        # Lewis-only feature flags
├─ lib/supabase/          # client.ts, server.ts, middleware.ts (SSR auth)
├─ middleware.ts
├─ types/index.ts
├─ supabase/migrations/   # blog_posts + RLS only, staging-first
├─ lessons.md             # rolling log, updated each session
├─ MVP Build plan         # note: literal filename, no .md extension — this is the doc CLAUDE.md calls "BUILD-PLAN.md"
└─ CLAUDE.md
```

**Open architecture question for Session 3:** how does the Astro public site coexist with this Next.js admin — same repo as a monorepo/two Vercel projects, or does the admin move under an `admin/` subpath? Not resolved yet; don't assume either way.

**Not ported from Astro-Psyche Lab (Session 1 scope call):** Testimonials, Events, Leads (CRM), Analytics dashboard, Engagement — all astrology-coaching-business-specific, no equivalent in the magazine model. The **service price management** and **content-generation tools** (repurpose, inspiration, transits, video-editor, photoshop — AWS Bedrock-backed) named in the golden rules above are **not in this repo at all yet**; `config/flags.ts` reserves the booleans, but the actual code stays in the source fork until a post-MVP session ports and reveals it one by one. If that reading is wrong, redirect — it was the leanest interpretation of the Session 1 checklist, not a locked-in architecture call.
