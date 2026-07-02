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

## Repo-specific values — TODO (fill before Session 1)
- Supabase project ref (CI): `TODO`
- Feature-flag config path: `TODO`
- Admin route/path: `TODO`
- MailerLite account + audience/group ID: `TODO`
- Secondary channel: `TODO (WhatsApp Channel | Telegram)`
- Analytics tool: `TODO (Plausible | Umami)`

## Repo structure — TODO (align to the actual fork)
```
/
├─ src/
│  ├─ pages/         # Astro routes: index, articulo/[slug], categoria/[cat], sobre, unete, contacto, legal/*
│  ├─ components/    # ported prototype components
│  ├─ layouts/
│  ├─ lib/           # supabase client, mailerlite, analytics
│  └─ config/        # flags.ts (Lewis-only) + site config
├─ admin/            # forked Astro-Psyche Lab custom admin
├─ lessons.md        # rolling log, updated each session
├─ BUILD-PLAN.md
└─ CLAUDE.md
```
