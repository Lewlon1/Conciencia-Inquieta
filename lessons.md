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

---

## Post-MVP — 2026-07-04 — Merge Astro public site into the Next.js admin (one app, one Vercel project)

Lewis asked to consolidate: instead of a Next.js admin + a separate Astro `site/` (two Vercel projects), have **one Next.js app** serve both. Planned it first (workflow: Next-14-docs-cited research on the load-bearing unknowns → design → adversarial review), got sign-off, then executed on `claude/conciencia-inquieta-design-tf6ukq`.

### What changed
- **Two root layouts, no shared `app/layout.tsx`.** Route groups `app/(public)/` and `app/(admin)/`, each owning its own `<html>/<body>` and importing only its own CSS. This is the crux: it confines Tailwind's `@tailwind base` Preflight to the admin CSS chunk (verified — public HTML links only the public-token chunk `f1a4b0c…`, Tailwind is a separate chunk `89c452c…`) and forces a full page reload on any public↔admin nav so React's "stylesheets not removed on soft-nav" bug can't fire.
- **Admin moved verbatim** under `(admin)/admin/` (URLs unchanged), `app/globals.css` → `(admin)/admin.css`, new `(admin)/layout.tsx` carries the `noindex` (the ONLY place it lives).
- **Public site rewritten Astro → Next**: all `.astro` pages → RSC `page.tsx`; `getStaticPaths` → `generateStaticParams`; `marked` → `react-markdown` (already a dep); `set:html` → `dangerouslySetInnerHTML`; Astro components → `components/public/*.tsx` (client only where needed: Sidebar/Topbar/NavOverlay/SubscribeForm/ContactForm/Analytics/ArticleTracker). `@astrojs/sitemap`/`robots.txt.ts` → Next-native `app/sitemap.ts`/`app/robots.ts`.
- **`site/` deleted entirely**; Astro deps gone with it. Types consolidated onto `types/index.ts`; `lib/supabase/public.ts` is a lazy cookieless anon client kept strictly separate from the admin's cookie SSR client.
- **Publish→live = ISR** (`export const revalidate = 60`) per Lewis's choice (option A): new/edited articles appear within ~1 min, no rebuild. `dynamicParams` left default (true) so a brand-new slug renders on first request; junk slugs `notFound()` → 404.
- **Middleware scoped to `["/admin/:path*"]`** — verified `curl /` returns no `Set-Cookie`, so public pages stay CDN-cacheable.
- **Env: `PUBLIC_*` → `NEXT_PUBLIC_*`**, Supabase URL/key now shared with the admin (deduped). `MAILERLITE_*` stay unprefixed (server-only).

### Adversarial-review fixes folded in (things a naive port breaks)
- Next does NOT emit `<link rel=canonical>` from `metadataBase` alone, and a page's `openGraph` REPLACES the layout's — so a `pageMetadata()` helper (`lib/seo.ts`) sets canonical + full OG on EVERY public page, not just the dynamic ones. Verified every public route emits a canonical + og:url.
- Preserved the Astro `PUBLIC_SITE_URL || hardcoded-vercel-URL` fallback in `lib/seo.ts` so a missing env var can't poison every canonical with `localhost:3000`.
- Kept Spanish form field names (`nombre/asunto/mensaje`, `email/source`) so the `contact_messages` insert doesn't write blank rows; 303 (not 307) redirects in both route handlers; paginated `getPublishedArticles` past Supabase's ~1000-row cap; `[slug]` re-fetches the full list to recompute related.

### Verified (build + prod server + Playwright, with fixture data since the sandbox can't reach Supabase)
- Route table: **all public routes `○`/`●` (static/SSG), only `/admin/*` and `/api/*` are `ƒ` (dynamic)** — the Suspense-wrapped `useSearchParams` forms did NOT force dynamic.
- `tsc --noEmit` clean on the real Supabase-backed code (reverted the fixture mock after).
- Screenshots: home, article (drop-cap + pullquote + markdown headings correct), category filter, legal page (no drop-cap bleed — `.article .prose` scoping holds), mobile — all brand-correct.
- `/admin/login` 200 with `noindex`, `/admin` → login redirect works, robots/sitemap correct.

### Decisions / tradeoffs (flag if wrong)
- **[Likely] No custom global `app/not-found.tsx`.** Under two root layouts a custom global 404 needs a root layout, which this structure lacks; Next errored on it. So genuinely-unmatched URLs (`/random-xyz`) get Next's plain default 404 (still a correct 404 status). Bad article/category slugs still get the branded in-group 404 via `(public)/not-found.tsx`. Adding a branded global 404 later would mean reintroducing a shared root layout — not worth it for MVP.
- **[Likely] Fonts via Google-Fonts `<link>`** (as Astro did), not `next/font` — `next/font` failed to compute fallback metrics for `Newsreader` (variable+italic+opsz). The `<link>` is what shipped before; minor perf tradeoff (cross-origin, no size-adjust).

### Blockers unchanged from before
Supabase MCP still points at unrelated projects → migrations `0001`–`0006` still need manual apply; MailerLite/Pixel/analytics/secondary-channel still need real values; legal pages still need a lawyer.

### Vercel impact (now simpler)
**One** project, root directory `.`, one env-var set. Delete the old `site/` Vercel project if it was created. Env vars: the `NEXT_PUBLIC_*` set from `.env.example` (Supabase pair now shared).

### Next step
1. Deploy the single merged app to Vercel; delete any separate `site` project.
2. Everything else on the pre-merge punch list still stands (migrations, MailerLite, channel/analytics/pixel decisions, legal review, Marie's homework).

---

## Post-MVP — 2026-07-08 — Admin UX overhaul (image upload + Spanish + editor polish)

Lewis asked to make `/admin` friendlier for Marie, starting from "how do we make image upload more user-friendly." Named the real gap first: there was **no upload** — the "Featured image URL" field was a plain text box, so Marie had to host a file elsewhere and paste a URL (and hand-type `![](url)` for in-body images). Planned the full set (plan mode), got sign-off, then built it. Fanned the independent pieces out to parallel sub-agents (7 in Phase 0, 3 for Phase 2 localization) and did the shared-file integration (`ArticleEditorForm.tsx`) single-threaded to avoid conflicts.

### Decisions (from Lewis, before building)
- **Scheduling: relabel, don't build it.** The "Publish date" field implied scheduling that never worked (`getPublishedArticles()` filters only `is_published`, ignores `published_at`). Renamed to "Fecha de publicación" (display/SEO date). Real scheduling stays out of scope — noted below.
- **Localization: Spanish-only replace** via one central dict `lib/admin/strings.ts` (no i18n lib — admin is single-language). Lewis accepted losing the English admin UI.

### What changed
- **Image upload → Supabase Storage.** New migration `0008_article_images_storage.sql` (public `article-images` bucket, 10 MB cap, image mime allowlist; RLS: `authenticated` write, public read). New `lib/admin/uploadImage.ts` (`validateImageFile` + `uploadArticleImage` — **Canvas** downscale to 1600px + WebP re-encode at q0.82, dependency-free; animated-GIF/`toBlob`-null fall back to the original) and `components/admin/ui/ImageUploader.tsx` (drag-drop + click + paste, thumbnail preview, "Subiendo…" state, auto-alt from filename, remove/replace, manual-URL fallback). Writes the public URL into `featured_image_url` — **nothing downstream changed**.
- **In-body images + formatting** via `components/admin/ui/MarkdownToolbar.tsx` (bold/italic/H2/H3/link/quote/list + an image button that uploads through the same helper and inserts `![alt](url)` at the caret). Zero new deps.
- **Editor reliability**: unsaved-changes `beforeunload` guard + debounced `localStorage` draft autosave keyed by article id/`new`, with a "restore draft" banner; required-field validation (title + category) with inline Spanish errors.
- **Preview now tells the truth.** It rendered `prose prose-invert` on dark navy; swapped to a scoped `.article-preview` block in `admin.css` that **replicates** the public `public.css` `.prose` (Newsreader/Fraunces, cream `#fff9f1`), with Fraunces+Newsreader added to the admin `<head>`. Note: these values are *copied*, not imported (importing `public.css` would break the deliberate Preflight isolation) — **keep them in sync if the public `.prose` changes.**
- **Smaller wins**: tags are removable chips (`TagInput.tsx`), SEO meta fields have live char counters (`CharCounter.tsx`, 60/160) + a Google-snippet preview (`SeoPreview.tsx`), and the article list has a featured-image thumbnail column.
- **Spanish everywhere**: all admin strings moved to `lib/admin/strings.ts` and swapped across dashboard, articles list, messages, login, nav, sign-out, confirm modal, and the editor. (Raw Supabase auth/error messages still surface in English — an error-code→Spanish map is the remaining gap, left out of scope.)

### Verified
- `npx tsc --noEmit` clean; `next build` **compiles + passes lint/type validity** for the whole integrated change. Build only fails at the credential-gated static-generation of **public** pages (`lib/supabase/public.ts` guard, no `.env` here) — the same standing blocker as every prior session, in files this change never touched. The admin runtime image-upload flow can't be exercised here (needs live creds + the bucket).

### Blockers — need Lewis
- **Apply `0008` by hand.** Supabase MCP in this env *still* only sees the unrelated "CFO Production/Staging" projects (checked again this session), not `lfyerbxqfwjjftcpjzbv` — so I can't apply it and won't touch the CFO projects (golden rule). Run `supabase/migrations/0008_article_images_storage.sql` in the CI project's SQL editor. **Until the bucket exists, uploads will fail at runtime** even though the UI is wired.
- After applying, smoke-test end-to-end: log in → new article → drag an image (expect preview + populated URL) → insert an in-body image → save → confirm the image renders on the public article.

### Out of scope (noted, not built)
- Real scheduled publishing (relabelled only) — wiring `published_at <= now()` into `getPublishedArticles()` is the future fix.
- Spanish mapping for raw Supabase auth error strings.
- Full WYSIWYG (kept Markdown + toolbar as the lean choice).
## Session 6 — 2026-07-08 — Burger-only nav + centered logo (El Salto layout)

### What changed
- Reworked the public nav to match an El Salto-style masthead (per Lewis's reference image): **burger top-left → slide-out left drawer at EVERY width**, centered wordmark logo, `Suscríbete` right. The persistent 264px desktop sidebar is gone — the burger is now the only menu on all breakpoints.
- Added the brand logo asset. Source `Conciencia logo.jpeg` (1080²) had huge whitespace; cropped to a tight wordmark with `sips -c 430 1010` → `public/conciencia-logo.jpeg` (1010×430). No ImageMagick on the box, so `sips` centered-crop, not a content-trim — bounds were eyeballed, then verified in preview.
- `components/public/Topbar.tsx`: burger (`#hamb`, unchanged id/wiring) + new centered `.top-brand` logo link + CTA. Centering is `position:absolute;left:50%;translateX(-50%)` so it's page-centered regardless of the side widths.
- `components/public/Sidebar.tsx`: replaced the `C`-mark + `Conciencia/Inquieta` text brand with the logo `<img>`; **removed the desktop collapse/rail button** (`#collapseBtn`) — a rail toggle is meaningless with no persistent sidebar.
- `components/public/NavOverlay.tsx`: dropped the `collapseBtn`/`toggleRail` wiring; kept `#hamb` open, `#overlay`/`#mobileCloseBtn` close, Escape close.
- `app/(public)/public.css`: `.sidebar` is now off-canvas (`translateX(-100%)`) at base with `body.nav-open .sidebar{transform:none}`; `.hamb` shows at all widths; `.main` margin-left is always 0 (full-width content); deleted the dead `body.rail` block, the `--rail-w` var, and the now-redundant `@media(max-width:1024px)` sidebar/hamb/main rules. Added `.top-brand`/`.top-logo`/`.brand-logo` + a `≤600px` logo shrink to 30px.

### Decisions / tradeoffs (flag if wrong)
- **[Certain] Removed the permanent desktop sidebar.** Lewis explicitly chose "slide-out left panel, burger is the only menu at all sizes" (matches El Salto, which has no rail). This is a deliberate structural change, not just a mobile tweak.
- **[Likely] Logo blended with `mix-blend-mode:multiply`.** The JPEG ships on a near-white (~#f4f3f1) ground, cooler than the cream canvas (#fff9f1), so it'd show a rectangle. Multiply drops the near-white into the cream while keeping the lilac/amber letters. Works well in the topbar; a **very faint** ghost box remains in the opaque-cream drawer header (multiply can't fully cancel an off-white that's darker than the backdrop). **To make it pixel-clean, supply a transparent PNG or SVG logo** — then the blend hack can be dropped.
- **[Likely] Raster JPEG logo, not SVG.** Only a JPEG was in local files. Fine at these sizes but not ideal for retina/scaling; an SVG/transparent PNG is the real fix.

### Verified (dev server + preview, desktop 1280 / mobile 375)
- Burger left, logo centered, `Suscríbete` right — no overlap at 375px. Drawer slides in from the left with logo header, `×` close, SECCIONES toggle, nav (Portada active), Únete, legal + socials, dimmed backdrop. Close via `×` clears `body.nav-open`. No console/server errors; `/` compiles and serves 200.

### Follow-up (same session) — transparent logo + larger mark
- Lewis dropped a **transparent-background PNG** (`Conciencia logo.png`, 1080², alpha) in local files. Cropped it the same way (`sips -c 430 1010`, alpha preserved) → `public/conciencia-logo.png`; deleted the superseded `public/conciencia-logo.jpeg`. Both `Topbar.tsx` and `Sidebar.tsx` now point at the `.png`.
- **Removed the `mix-blend-mode:multiply` hack** from `.top-logo` and `.brand-logo` — unneeded now the ground is transparent, and it was slightly darkening the letters. The mark now sits perfectly clean on the cream (topbar + drawer), no ghost box.
- **Enlarged the top-bar logo** (Lewis chose "enlarge top-bar logo, all pages" over a home-only masthead): `.top-logo` 38→**58px** desktop, 30→**42px** (`≤600px`); drawer `.brand-logo` 44→48px. Verified at 1280 + 375: no overlap with burger/CTA at mobile, no errors.

### Next step
- If a crisper mark is ever wanted at very large sizes, an **SVG** logo would beat the raster PNG — not needed at current sizes.

---

## Session 7 — 2026-07-08 — Services tab + admin backend + booking capture

Lewis asked for a **Servicios** tab in the public menu and an admin backend where Marie manages offerings (with image uploads + optional prices), plus a booking flow where a visitor leaves name/email/phone so Marie can contact them.

### Gap named up front (golden-rule tension)
CLAUDE.md keeps the inherited **service price management** admin FLAGGED OFF and lists shop/payments/services as out of MVP. Read this request as a **different thing**: not the Astro-Psyche Lab Bedrock pricing tool, but a fresh, magazine-appropriate **showcase + lead-capture** — the same shape as `contact_messages`, with **no on-site checkout or payment**. Built it clean (not by un-flagging the inherited tool); `FLAGS.servicePriceManagement` stays `false` and unported. Flag if that read is wrong — if you actually meant to reveal the inherited pricing admin, that's a separate port.

### What changed
- **Migration `0009_services.sql`** (NOT applied — see blocker): `services` (title/slug/summary/description/`price_text` optional/`image_urls text[]` gallery/image_alt/is_published/sort_order) and `service_bookings` (service_id+`service_title` snapshot/name/email/**phone**/message/is_read). RLS mirrors the established split — public reads published services, public INSERTs bookings, admin full. Because 0007's `ALTER DEFAULT PRIVILEGES` auto-grants anon SELECT on future tables, the migration **explicitly `REVOKE SELECT … FROM anon` on `service_bookings`** (PII — same intent as contact_messages). Adds a dedicated **`service-images` Storage bucket** (mirrors 0008).
- **Admin backend**: `/admin/services` (list) · `/admin/services/new` · `/admin/services/[id]` (edit) via `ServiceEditorForm`, with a new multi-image `ServiceImagesUploader` (drag/click/paste, first image = cover, "hacer portada"/quitar, single alt). `/admin/reservas` lists booking requests (`BookingsTable`, mark-read, clickable mailto/tel). Dashboard gained services + unread-bookings counts and a "Nuevo servicio" quick action.
- **Public tab**: `/servicios` (card grid) + `/servicios/[slug]` (gallery + price + Markdown description + embedded `ServiceBookingForm`). Booking `POST /api/reservar` → `service_bookings` → `303` redirect to `/servicios/<slug>?ok=1|0`, read **client-side** (Suspense + `useSearchParams`) — the same static-page confirmation pattern the Astro prerender bug forced us to (deliberately reused so the bug can't recur). "Servicios" added to the burger nav, footer Secciones, and the sitemap (static path + per-service entries).
- **Shared bits**: `uploadImage.ts` refactored to `uploadImageToBucket(file, bucket)` with `uploadArticleImage`/`uploadServiceImage` wrappers (article uploads unchanged). New `Service`/`ServiceBooking` types, `lib/content.ts` `getPublishedServices`/`getServiceBySlug`, admin strings for services/serviceEditor/bookings. AdminNav's dead flag-gated `/admin/services` stub replaced with the live, always-on items.

### Decisions (flag if wrong)
- **[Likely] `price_text` free-form, not numeric.** "Optionally add the prices" → a single nullable text line ("Desde 50€", "Consultar") gives Marie full control over currency/format; nothing computes on price, so a number bought nothing.
- **[Likely] Gallery (`image_urls text[]`), one shared alt.** "upload images" (plural) → multiple images per service, first is the cover. Per-image alt was the lean thing to skip; one alt covers the cover, extras get "". Future refinement if wanted.
- **[Likely] Bookings land in Supabase + `/admin/reservas`**, not email — reuses the exact anon-key + RLS pattern (zero new secrets), same call as contact_messages. Trivial to add an email-forward later.
- **[Certain] No payment/checkout.** Booking = lead capture; Marie contacts the person. Keeps the MVP "no shop/payments" rule intact.

### Verified (fixture-mocked build + prod server + Playwright, since the sandbox has no Supabase creds/egress)
- `tsc --noEmit` clean; `next build` compiles + passes type/lint validity. With `lib/content.ts` temporarily fixture-backed (reverted after — `git diff` clean), the **full route table builds green**: `/servicios` is `○` static, `/servicios/[slug]` is `●` SSG (both fixture slugs prerendered), only `/admin/*` + `/api/*` are `ƒ` — public services pages stay CDN-static like articles.
- Playwright (real Chromium): listing shows 2 cards, price tag only on the priced one; detail page's booking form **hydrates** with nombre/email/telefono/mensaje and correct hidden values (`servicio=s1`, `slug=…`); gallery splits 1 hero + 2 thumbs from a 3-image service; **`?ok=1` renders the "Solicitud enviada" success state**; no JS/React console errors (only blocked fixture image/font hosts). Screenshots brand-correct (cream/lilac/aubergine/marigold, Fraunces headings).

### Blockers — need Lewis
- **Apply `0009_services.sql` by hand** in the CI Supabase SQL editor (`lfyerbxqfwjjftcpjzbv`). The Supabase MCP in this env *still* only sees the unrelated "CFO Production/Staging" projects (checked again — won't touch them, golden rule), so I can't apply it. **Until it's applied the tables + `service-images` bucket don't exist and both the admin CRUD and the public `/servicios` fetch will fail at runtime.**
- After applying: smoke-test end-to-end — log in → `/admin/services/new` → upload images + set a price → publish → confirm it shows on `/servicios` and its detail page → submit a booking → confirm it appears in `/admin/reservas`.

### Out of scope (noted, not built)
- Payments/checkout (deliberate — lead capture only).
- Per-image alt text (single shared alt for now).
- Booking confirmation email to the visitor (Marie contacts manually); an email-forward of the request to Marie is a trivial future add.
