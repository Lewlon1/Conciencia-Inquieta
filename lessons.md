# Lessons — rolling session log

## Session 1 — 2026-07-02 — Fork & flag the backend

### What changed
- Filled in the `CLAUDE.md` repo-specific TODOs (Supabase ref, flag config path, admin route) and corrected the "Repo structure" section — it described an Astro `src/` layout, but what's actually on disk is a root-level Next.js App Router app (that's genuinely what got forked from Astro-Psyche Lab). The "Astro public site" is a Session 3 target, not built yet.
- Ported the auth + blog-CRUD slice of the Astro-Psyche Lab admin into this repo: `middleware.ts`, `lib/supabase/{client,server,middleware}.ts`, `app/admin/{layout,page,login}`, `app/admin/blog/{page,new,[id]}`, `components/admin/{AdminNav,SignOutButton,BlogEditorForm,ui/*}`, `types/index.ts` (trimmed to `BlogPost`).
- Added `config/flags.ts` — Lewis-only booleans, both `false`: `servicePriceManagement`, `contentGenerationTools`.
- Wrote lean migrations: `supabase/migrations/0001_create_blog_posts.sql`, `0002_blog_posts_rls.sql` (public reads published, authenticated has full access). **Not yet applied to the live project** — see blockers below.
- Fixed `package.json`: renamed from `astropsyche-lab` → `conciencia-inquieta`, added the missing `autoprefixer` devDependency (`postcss.config.mjs` referenced it but it wasn't installed — would've broken `next build` the moment PostCSS actually ran the plugin chain), dropped unused deps (`@aws-sdk/client-bedrock-runtime`, `@calcom/embed-react`, `@vercel/analytics` — all tied to features not ported, see below).
- `app/layout.tsx` / `app/globals.css` rebuilt from scratch, minimal — no Gabriela fonts, Meta Pixel, or ManyChat script. Those belong to the public site build (Session 3) and consent work (Session 5), not the admin shell.
- Verified: `npm install`, `npm run build` (clean), and a dev-server smoke test — `/admin/login` renders 200, `/admin` correctly 307-redirects to login when unauthenticated (middleware auth gate works). Could not verify the actual login → save-draft flow end-to-end — no live DB connection in this session (see blockers).

### Decisions made (flag if wrong — these were judgment calls, not requirements)
- **[Certain]** Admin stays a root-level Next.js app, not moved under an `admin/` subfolder. That's what was already scaffolded (package.json, next.config.mjs etc. at repo root); moving it would mean setting up a monorepo with no clear win yet. The Astro-vs-Next.js coexistence question is now flagged in `CLAUDE.md` for Session 3, not solved here.
- **[Likely]** Only blog CRUD got ported. Testimonials, Events, Leads (CRM), the Analytics dashboard, and Engagement — all present in the Astro-Psyche Lab admin — were **not** ported. They're astrology-coaching-business-specific with no equivalent in a magazine. If any of these turn out to be wanted (e.g. Leads as a manual capture fallback), say so and I'll port the pattern.
- **[Likely]** "Flagged off" for service price management and content-generation tools was read literally: that code is **not in this repo at all**, not present-but-hidden. `config/flags.ts` reserves the two booleans; the actual astrolab code for those features (Bedrock-backed repurpose/inspiration/transits/video-editor/photoshop, plus the services admin) stays in the source fork until a post-MVP session explicitly ports and reveals it. This kept Session 1 from dragging in AWS Bedrock credentials and a pile of unrelated AI-tooling code for features that stay off anyway.
- **[Guessing]** Left the admin's internal visual style (grays/blues, "deep" accent) untouched aside from text rebranding ("ASTRO LAB" → "Conciencia Inquieta"). Read the golden rule "do NOT reuse Gabriela's design" as protecting the *public-facing* site, not this internal Lewis/Marie tool. Push back if that's the wrong read — full CI brand-token reskin of the admin is a small follow-up either way.

### Blockers — need Lewis
- **Supabase MCP in this environment is connected to the wrong account.** `list_projects` only returns two unrelated projects ("CFO Production"/"CFO Staging"); `get_project` on `lfyerbxqfwjjftcpjzbv` returns a permission error. Reconnecting mid-session didn't fix it. So I could not apply the migrations or verify the schema myself.
- **You need to run the migrations by hand**: open the Supabase SQL editor for `lfyerbxqfwjjftcpjzbv` and run `supabase/migrations/0001_create_blog_posts.sql` then `0002_blog_posts_rls.sql`, in that order.
- **You need to create the first admin login**: Supabase Dashboard → Authentication → Users → Add user (email + password). There's no self-serve signup by design — Marie's account should be provisioned this way too, later.
- I do have the anon key now (`.env.local`, gitignored, not committed) — that part's wired up.

### Next step
1. Lewis: run the two migrations, create an admin user, confirm `.env.local` values match the dashboard.
2. Verify end-to-end: log in at `/admin/login`, save a draft at `/admin/blog/new`, confirm it lists at `/admin/blog`.
3. If the Supabase MCP access gets fixed, re-run this from Claude Code and it can do the migration + verification itself.
4. Session 2: extend `blog_posts` to the 9-category magazine content model (categories, tags, author/byline, subtitle, featured image, reading time, related-articles) and update `BlogEditorForm` accordingly — the `pillar` field (Decode/Reframe/Navigate/Align) is Astro-Psyche-Lab's taxonomy, kept as-is for now, gets replaced.

---

## Sessions 2–5 — 2026-07-02 — content model → public site → capture → launch prep

Lewis handed over a full CI prototype (single-file HTML/CSS/JS mockup) and asked to run the remaining build-plan sessions in one pass. Ran all four back to back; logging them separately below since they're still conceptually distinct sessions, just done in one sitting instead of four.

**Standing blocker across all four**: the Supabase MCP in this environment is still connected to unrelated projects ("CFO Production"/"CFO Staging"), not `lfyerbxqfwjjftcpjzbv` — identical to the Session 1 blocker, not fixed in between. Every migration below is written and committed but **not applied**, and nothing here has been verified against live data. Same for MailerLite/Meta Pixel — no real API keys exist in this environment, so those integrations are code-complete but functionally unexercised.

### Gap named up front (before building)
The pasted prototype is a full demo SPA: shop + cart, paid membership modal (€5/mes, €48/año), login/account modal, saved-articles (heart icons), on-site search, a Services section with checkout CTAs, and reserved ad slots. All of these are explicitly **OUT of MVP** per `MVP Build plan` (accounts, payments, shop, Google Ads, on-site search, Services all listed under "Explicitly OUT of MVP"). Used the prototype for what CLAUDE.md's brand-tokens section actually asks for — colours, type, and "the reading experience as prototyped" — and cut the rest. "Hazte miembro/a" became a free MailerLite signup CTA ("Únete"), not a paywall.

### Session 2 — Magazine content model
- New migrations `0003_categories_and_authors.sql`, `0004_articles_content_model.sql`: `categories` (9, seeded, code-managed) and `authors` tables; `blog_posts` renamed to `articles`, `excerpt`→`subtitle`, added `category_id`/`tags`/`author_id`, dropped `pillar`. Additive to 0001/0002 (ALTER, not rewrite) since those may or may not have been applied yet.
- Renamed admin surface to match: `/admin/blog` → `/admin/articles`, `BlogEditorForm` → `ArticleEditorForm` (category/author selects via new `AdminSelect`, tags input, and a featured-image-URL field the Session 1 form never actually exposed). `types/index.ts`: `BlogPost` → `Category`/`Author`/`Article`/`ArticleWithRelations`.
- Seeded one placeholder author (`name: "Marie"`, bio marked TODO) — **[Guessing]** didn't invent a surname or bio; Lewis/Marie should edit that row directly in Supabase (no author-management UI was built, out of scope for the content-model session).
- `npm run build` clean.

### Session 3 — Astro public site (`site/`)
- **Architecture decision** (was an open question in CLAUDE.md): public site lives in new `site/`, a sibling Astro project, not nested under the admin and not a monorepo workspace. Two independent Vercel projects. **[Likely]** — reasoning: the admin's config was already at repo root with no live deploy recorded, so adding a sibling directory was the smaller diff than moving it. CLAUDE.md's repo-structure section is updated to match.
- Pages: `/`, `/articulos`, `/articulos/[slug]`, `/categoria/[slug]`, `/sobre-nosotras`, `/unete`, `/contacto`, `/privacidad`, `/cookies`, `/terminos`, `/404`. Content fetched from Supabase at build time via the anon key.
- `astro.config.mjs` uses `output:"server"` + `@astrojs/vercel`, but every content page sets `export const prerender = true` — it's static in practice, server mode exists only so Session 4's two capture endpoints can be Vercel functions without a second project.
- CSS is the prototype's design system, ported and trimmed — dropped every class tied to shop/cart/login/saved/search/services/ads (see gap above), kept the article reading experience close to 1:1 (byline, hero image, pullquotes, tags, related, share).
- `astro check`: 0 errors.

### Session 4 — Capture system + contact
- `POST /api/suscribir`: calls MailerLite's Connect API (`connect.mailerlite.com/api/subscribers`) with `MAILERLITE_API_KEY`/`MAILERLITE_GROUP_ID`. **Important nuance for Lewis**: the Connect API has no per-request opt-in flag — double opt-in is whatever the target group is configured to do in the MailerLite dashboard. **Verify that's turned on before launch**, since the build plan requires double opt-in and I can't check a live account from here.
- All signup placements (home, about, footer, end-of-article, Únete) redirect to `/unete?ok=1&source=...` after submit — a single confirmation experience rather than per-page inline state.
- **Lead-magnet delivery**: the "plumbing" is the MailerLite group assignment above — actual asset delivery is a MailerLite automation configured in their dashboard (no code needed on our side), and the asset itself (the PDF) is still on Marie's homework list per the build plan. Didn't build anything further than tagging the subscriber into the right group.
- **Contact-form delivery — decided where it lands**: Supabase (`contact_messages`, migration `0005`), read from new `/admin/messages`. **[Likely]** call — no transactional email service/API key exists yet, and this reuses the exact same anon-key + RLS pattern as everything else, so it needed zero new secrets. Trivial to swap for an email-forward later if Lewis prefers that instead.
- Found and fixed mid-session: root `tsconfig.json`'s `**/*.ts` include was pulling `site/`'s Astro files into the Next.js typecheck and failing the admin build (`import.meta.env` isn't valid Next.js syntax). Excluded `site/`.

### Session 5 — Measurement, consent, legal, launch prep
- Analytics: cookieless (Plausible default, `PUBLIC_ANALYTICS_PROVIDER=umami` to swap), loads unconditionally since it needs no consent. `window.ciTrack()` wraps both providers. Wired the events the plan asked for: `cta_click`, `channel_click`, `signup`, `article_read` (5s dwell), `scroll_depth` (75%).
- Meta Pixel is consent-gated behind a bottom banner (Aceptar/Rechazar) — `fbq()` genuinely cannot fire before the visitor accepts, and the whole thing no-ops if `PUBLIC_META_PIXEL_ID` is unset. **[Likely]** interpretation of "wired to consent mode" — this is generic consent-gating, not Google's formal Consent Mode v2 API, since nothing here uses Google tags. Flag if that's the wrong read.
- Legal pages (`/privacidad`, `/cookies`, `/terminos`) have real GDPR/LSSI-oriented drafts now, not stubs — each carries a visible "plantilla, no asesoría legal, revisar antes de publicar" banner. The `/privacidad` page has a `TODO` for the actual data-controller identity (legal name, NIF/CIF, address) that has to be filled before launch.
- SEO: `@astrojs/sitemap`, `/robots.txt`, `Organization` + per-article `NewsArticle` JSON-LD.
- Accessibility: migration `0006` adds `articles.featured_image_alt` (admin form updated to collect it); skip-to-content link; `<main>` landmark.
- `docs/utm-cheatsheet.md` — the UTM convention for Marie's social links (fixed `utm_source`/`utm_medium` vocab, free-text `utm_campaign`).

### Real bugs found — via an actual browser test, not just typecheck
`astro check` was clean the whole way through, which is exactly why this mattered: mocked `site/src/lib/content.ts` with fixture articles (this sandbox's network egress blocks the real Supabase host — same restriction the Supabase MCP hits), ran `astro dev`, and screenshotted with Playwright (globally installed at `/opt/node22`, not a project dependency). Found:
1. **`/unete` and `/contacto` read `?ok=1` server-side from `Astro.url`, but both pages are prerendered (static).** Query strings never reach prerendered HTML at request time — every real visitor would have hit "submit" and seen the plain empty form again, no confirmation, ever. Moved to client-side query-param reading in `SubscribeForm.astro` and `contacto.astro`.
2. **The consent banner rendered open on every single page load**, defeating its own `hidden` attribute — `.consent-banner`/`.subscribe-form`/`.note` all declare `display:flex`, which has the same specificity as the browser default `[hidden]{display:none}` and, being an author-stylesheet rule, wins the cascade regardless of order. This would have shipped the Pixel-consent banner permanently stuck open. Fixed with a single global `[hidden]{display:none !important}` rule rather than patching every affected class.
3. The article drop-cap CSS (`.prose > p:first-of-type:first-letter`) was generic enough to also style the legal pages' first paragraph with a giant editorial drop cap. Scoped to `.article .prose`.

Screenshots (home, article, category, únete, contact, legal, mobile) all confirmed the CI brand tokens rendering correctly (Fraunces/Newsreader/Inter, cream/lilac/marigold/aubergine) and category filtering/responsive layout working. Reverted the fixture mock afterward — `git diff` on `content.ts`/`supabase.ts` is clean.

### Blockers — need Lewis
- **Supabase MCP still misconfigured** (see top of this entry) — every migration since Session 1 (`0001`–`0006`) needs to be run by hand, in order, against `lfyerbxqfwjjftcpjzbv`.
- **MailerLite**: need a real `MAILERLITE_API_KEY` + `MAILERLITE_GROUP_ID`, and confirmation that double opt-in is enabled on that group.
- **Secondary channel**: still undecided (WhatsApp Channel vs Telegram) — built channel-agnostic per the plan, `PUBLIC_SECONDARY_CHANNEL_TYPE`/`_URL` unset means the button just doesn't render anywhere. No code change needed once decided, just set the env vars.
- **Analytics tool**: defaulted to Plausible, still technically open — needs a `PUBLIC_ANALYTICS_DOMAIN` (Plausible site ID or Umami website ID) either way.
- **Meta Pixel ID**: none set, Pixel code is fully inert until `PUBLIC_META_PIXEL_ID` exists.
- **Legal identity**: `/privacidad` has a literal `TODO` for the responsible party's name/NIF/address — and the whole legal section needs an actual lawyer's pass before this goes live, it's a template.
- **Vercel deploy**: not done — no Vercel account access from this environment. Two projects to create (root dir `.` for the admin, root dir `site` for the public site), env vars from both `.env.example` files to fill in, then `vercel --prod` (or connect via GitHub for auto-deploy on this branch).

### Next step
1. Lewis: apply migrations 0001–0006, fix the Supabase MCP connection if possible, provision MailerLite (key + group + double-opt-in setting), pick the secondary channel and analytics tool, get a Meta Pixel ID if running Meta campaigns at launch.
2. Set up the two Vercel projects and their env vars, deploy both.
3. Get a lawyer's eyes on `/privacidad` `/cookies` `/terminos` before the "Ship the MVP live" step — those pages are honest but explicitly unreviewed.
4. Marie's homework (real articles, author bios, photos, the lead-magnet PDF) still gates a meaningful launch regardless of code state — see "Running in parallel" in the build plan.
5. Once live: the validation gate is real — do Marie's social posts (tagged with the new UTM convention) actually drive visits, and do those visitors convert via `/unete`? That's what decides whether v2 gets built.
