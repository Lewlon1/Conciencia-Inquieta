# Image focal point & resize — design spec

Date: 2026-07-09

## Problem

The featured/cover image on articles and services renders in several fixed-height, fluid-width frames via `object-fit: cover`, always centered (`object-position: 50% 50%`):

| Content type | Frame | Height |
|---|---|---|
| Article | Feature tile (`.feature .ph`) | 210px |
| Article | Grid card (`.card .ph`) | 172px |
| Article | Detail hero (`.hero-img`) | 380px |
| Service | Grid card (`.card .ph.service-ph`) | 172px |
| Service | Detail gallery tile (`.service-gallery img`) | 220px |

Marie has no control over which part of an uploaded image survives the crop, and no way to see the crop before publishing. An off-center subject (e.g. a face not in the middle third) gets cut off in one or more frames with no warning.

## Scope

- Applies to: **article featured image** and **service cover image** (`image_urls[0]`). Non-cover gallery images are unaffected.
- One focal setting per image, reused across every frame it appears in — not independent per-frame settings.
- Positioning (pan) and zoom (resize), not a destructive crop — the original uploaded file is never modified or replaced.

## Data model

New migration `supabase/migrations/0010_image_focal_point.sql`, applied by hand via the Supabase SQL editor for `lfyerbxqfwjjftcpjzbv` (same standing process as `0008`/`0009` — MCP in this environment still has no access to that project).

```sql
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS focal_x numeric,     -- 0–100, % from left. NULL = 50 (center)
  ADD COLUMN IF NOT EXISTS focal_y numeric,     -- 0–100, % from top.  NULL = 50 (center)
  ADD COLUMN IF NOT EXISTS focal_zoom numeric;  -- 1.0–3.0. NULL = 1.0 (no zoom)

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS focal_x numeric,
  ADD COLUMN IF NOT EXISTS focal_y numeric,
  ADD COLUMN IF NOT EXISTS focal_zoom numeric;
```

(`IF NOT EXISTS` keeps this re-runnable, matching `0008`/`0009`'s idempotent style.)

`NULL` on any of the three is treated as the default (50 / 50 / 1.0) everywhere they're read — i.e. every existing published article and service renders **pixel-identical to today** the moment this migration lands. No backfill, zero visual regression risk on rollout.

**Services + "hacer portada":** focal values live on the `services` row, describing the current cover image. If Marie promotes a different gallery image to cover, focal values reset to defaults — it's a different photo, the old crop doesn't apply to it. Considered storing focal data per-image (turning `image_urls text[]` into an array of objects) to avoid this reset, but promoting a new cover is rare and the schema/UI cost of per-image focal data isn't justified for it. Accepted limitation.

## New shared code

- **`lib/focalImage.ts`** — one pure function: `(focal_x, focal_y, focal_zoom) → { objectPosition, transform, transformOrigin }`. The single source of truth for the CSS math; both the admin editor and the public renderer call it, so there's no risk of the two drifting apart.
- **`components/public/FocalImage.tsx`** — thin wrapper around `<img>` using that helper. Replaces the raw `<img>` currently in `ArticleCard.tsx`, the article hero (`app/(public)/articulos/[slug]/page.tsx`), `ServiceCard.tsx`, and the service gallery. Props: `src, alt, focalX, focalY, focalZoom, className`.
- **`components/admin/ui/ImageFocalEditor.tsx`** — the editor UI (below). Props: `imageUrl`, current `focalX/focalY/focalZoom`, `onChange`, and `frames: {label: string, width: number, height: number}[]` describing which preview tiles to render.

## Editor UI

One reference frame is directly editable; the rest are live read-only mirrors driven by the same values:

- **Articles** — reference frame is the **Hero** (380px, biggest and most detail-sensitive); Tarjeta and Destacado render as smaller mirrors alongside it.
- **Services** — reference frame is the **Card** (172px, services have no hero-equivalent); the Gallery tile renders as the mirror.

Interaction on the reference frame: a resizable, draggable rectangle overlaid on the full (unzoomed) image — drag the body to pan (updates `focal_x/y` from the rectangle's center), drag a corner handle to resize (updates `focal_zoom`; smaller rectangle = more zoomed in). The rectangle's aspect ratio is locked to the reference frame's aspect ratio while resizing, so it can't distort. Resize is bounded so the rectangle can never exceed the source image (min zoom 1.0, matching today's default crop) or shrink past a minimum size (max zoom 3.0). A "Restablecer" link resets to center/no-zoom.

`ImageUploader.tsx` and `ServiceImagesUploader.tsx` render `ImageFocalEditor` in place of their current plain thumbnail `<img>` once a value exists — same component, same responsibility ("show/manage the current image"), just a richer view when there's something to position.

Editor preview tiles use fixed illustrative widths at a single reference viewport (desktop) — the real public frames are fluid-width/fixed-height and vary slightly by breakpoint, same as they do today under plain `object-fit: cover`. This feature doesn't change that existing responsive behavior, it only adds control over the anchor point and zoom within it.

## Backward compatibility

No query changes needed — `lib/content.ts` already uses `select("*"...)` for both `articles` and `services`, so the new columns arrive automatically once the migration is applied. Only `types/index.ts` (`Article`, `Service`) needs the three new optional fields.

## Edge cases

- **No image yet** — focal editor doesn't render; matches `ImageUploader`'s existing empty state.
- **Replacing the image** ("Reemplazar") — focal values reset to defaults. A new photo has no relationship to the old crop.
- **Promoting a different cover image** (services) — same reset, see Data model above.
- **Removing the image** ("Quitar") — focal values are left as stored (harmless; nothing renders without a URL).
- **Animated GIFs** — unaffected. Focal positioning is a render-time CSS concern, independent of the existing upload/compression pipeline (`uploadImage.ts` already special-cases GIFs to skip Canvas re-encoding; that's orthogonal to this feature).
- **Zoom bounds** — clamped to [1.0, 3.0] in both the drag interaction and, defensively, in `focalImage.ts` itself, so a hand-edited/corrupt DB value can't produce a broken (e.g. negative or absurdly large) transform.

## Testing plan

- `focalImage.ts`: default inputs (null/undefined) produce `object-position: 50% 50%` and no scale transform; out-of-range zoom is clamped.
- Manual/Playwright smoke test (matches this repo's established fixture-mocked build + prod server + Playwright pattern): upload an image in the article editor, drag the rectangle off-center and zoom in, confirm all three mirror tiles update live, save, reload the editor and confirm the saved position is restored, then verify the public article's card/feature/hero all reflect the same anchor point (`preview_inspect` on computed `object-position`/`transform`).
- Regression check: an existing article/service with no focal data (`NULL` columns) renders with unchanged `object-position: 50% 50%` and no transform, on both admin and public sides.

## Out of scope

- Positioning for non-cover gallery images.
- Per-frame independent positioning (one setting is reused everywhere, per decision above).
- Any destructive/baked crop — the original uploaded file is never altered.
