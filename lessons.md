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
