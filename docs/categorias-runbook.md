# Runbook — adding a magazine category

Marie can **rename and reorder** categories herself at `/admin/categorias`.
Creating one is a two-step operation that needs a deploy, and it is done by Lewis.

## Why it isn't self-serve

Every category carries a visual identity — a card corner geometry and a placeholder
gradient — defined in `lib/categoryStyle.ts`, keyed by **slug**. Two consequences:

1. A slug with no `STYLES` entry silently falls back to the generic
   `rounded-2xl` purple→orange card, so it looks visibly unlike the other sections.
2. The shapes are Tailwind arbitrary values (`rounded-tr-[80px]`). Tailwind only
   compiles classes it finds as literal strings in source, so a shape typed into an
   admin field would produce **no CSS at all**. This can't be fixed with a DB column;
   it needs the class to exist in a source file.

That's why creation is a code change, not a button.

## Steps

### 1. Insert the row

Slug rules, matching the seeds in `supabase/migrations/0003_categories_and_authors.sql`:
lowercase, accents stripped (`Política` → `politica`), spaces → hyphens, no trailing
hyphen. The slug is **permanent** — it's the public URL, and changing it later 404s
every existing link, share and indexed page.

`sort_order` can be any integer; the next save from `/admin/categorias` renumbers the
whole set contiguously from 1.

```sql
INSERT INTO categories (slug, name, sort_order)
VALUES ('nueva-seccion', 'Nueva sección', 10);
```

Run it in the Supabase SQL editor for project `lfyerbxqfwjjftcpjzbv`.

### 2. Add the matching style, then deploy

In `lib/categoryStyle.ts`, add an entry to `STYLES` keyed by the **same slug**:

```ts
"nueva-seccion": {
  shape: "rounded-tr-[80px]",   // literal string — Tailwind must see it here
  grad: [PURPLE, "#b98fc0"],    // two gradient stops for the image placeholder
  onDark: false,                // true only for dark stops (see "opinion")
},
```

Then merge and deploy. Both steps or neither — a row without a style is an off-brand
section, and a style without a row is dead code.

## What changes, and when

Public pages are ISR with `revalidate = 60`, so everything below updates within ~1 minute
of the insert. No rebuild is needed for the row itself; step 2 needs a deploy.

- Sidebar section list — `components/public/Sidebar.tsx`
- Mobile nav — `components/public/MobileNav.tsx`
- Home "Explora por tema" pills and the per-category clusters — `app/(public)/page.tsx`
- `/articulos` filter chips — `components/public/ArticleBrowser.tsx` (ordered by `sort_order`)
- `/categoria/<slug>` — renders on demand; `generateStaticParams` doesn't list it yet
  but `dynamicParams` defaults to true, so the page works immediately
- `sitemap.xml` — `app/sitemap.ts`

## Two things to check afterwards

- **The section is empty until something is filed in it.** It appears in the nav and the
  sitemap straight away, pointing at a page with no articles. Either publish into it the
  same day or add the row when the first article is ready.
- **Nine is already a lot.** The sidebar and the home pills render every category with no
  grouping and no overflow handling. Past ~12 the navigation stops reading as a curated
  set. Adding a category should be an editorial decision, not a filing convenience.

## Deleting a category

Not supported, by design. `articles.category_id` has no `ON DELETE` rule
(`supabase/migrations/0004_articles_content_model.sql`) and the article editor requires a
category, so a delete would need a "reassign these N articles" flow that doesn't exist.
If a section is retired, rename it or leave it empty.
