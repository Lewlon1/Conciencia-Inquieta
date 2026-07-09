# Image Focal Point & Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Marie reposition (pan) and resize (zoom) the article featured image / service cover image within their existing display frames, and see a live, accurate preview of every frame the image appears in, before publishing.

**Architecture:** Store a focal point + zoom (`focal_x`, `focal_y`, `focal_zoom`) per image as three nullable numeric columns on `articles`/`services`. A single pure function (`lib/focalImage.ts`) turns those into CSS (`object-position` + `transform: scale()`), used identically by a public rendering component (`FocalImage`) and an admin drag/resize editor (`ImageFocalEditor`). `NULL` means "center, no zoom" — today's exact behavior — so existing content is visually unaffected until repositioned.

**Tech Stack:** Next.js/React/TypeScript, Supabase (Postgres + Storage), no new dependencies. This repo has no unit-test framework (no jest/vitest, no `test` script in `package.json`) — verification follows its established convention instead: `npx tsc --noEmit` for type safety, and the Claude Code preview tools (`preview_inspect`, `preview_eval`, `preview_screenshot`) driving the actual dev server for behavior, matching how every prior session in `lessons.md` verified admin/public features (fixture-mocked build + prod server + Playwright/browser checks).

**Spec:** `docs/superpowers/specs/2026-07-09-image-focal-point-design.md`

---

## Before you start

Start the dev server via the `preview_start` tool (not `npm run dev` in Bash) so you can drive it with `preview_*` tools throughout. Confirm it's serving `/admin` (redirects to login without a session — that's expected, the article/service editor pages need an authenticated session which isn't available in this environment; browser verification below targets the **public** pages only, which don't need auth. Admin-side interactive verification is a visual, human smoke test — call it out explicitly to the user at the end, don't claim it as machine-verified).

---

### Task 1: Migration — focal point columns

**Files:**
- Create: `supabase/migrations/0010_image_focal_point.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================
-- Conciencia Inquieta — Focal point + zoom for the article featured image
-- and the service cover image.
--
-- Lets Marie pan/zoom where the image is anchored within its display frames
-- (article feature tile / grid card / hero; service grid card / detail hero)
-- without cropping or replacing the uploaded file. NULL on any of the three
-- columns means "center, no zoom" — i.e. today's exact object-fit:cover
-- behavior — so every existing row renders unchanged until repositioned.
--
-- Applied BY HAND in the Supabase SQL editor for project ref
-- lfyerbxqfwjjftcpjzbv (same standing process as 0008/0009 — the MCP in
-- this environment has no access to that project). Re-runnable.
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS focal_x numeric,     -- 0–100, % from left. NULL = 50 (center)
  ADD COLUMN IF NOT EXISTS focal_y numeric,     -- 0–100, % from top.  NULL = 50 (center)
  ADD COLUMN IF NOT EXISTS focal_zoom numeric;  -- 1.0–3.0. NULL = 1.0 (no zoom)

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS focal_x numeric,
  ADD COLUMN IF NOT EXISTS focal_y numeric,
  ADD COLUMN IF NOT EXISTS focal_zoom numeric;

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: Verify it's valid SQL**

Run: `npx supabase db lint supabase/migrations/0010_image_focal_point.sql 2>/dev/null || echo "no local supabase CLI stack — skip, this repo applies migrations by hand (see lessons.md)"`

This repo has no working local Supabase/MCP connection to the live project (standing blocker, documented repeatedly in `lessons.md`) — there's no way to actually apply and confirm this migration from this environment. Note in your final summary that **this migration still needs to be run by hand** in the Supabase SQL editor before focal data can be saved, exactly like `0008`/`0009`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0010_image_focal_point.sql
git commit -m "Add focal_x/focal_y/focal_zoom columns for article + service images"
```

---

### Task 2: Extend `Article` and `Service` types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add the three fields to both interfaces**

In `types/index.ts`, change:

```ts
export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  content: string | null;
  category_id: string | null;
  tags: string[];
  author_id: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  is_published: boolean;
  published_at: string | null;
  reading_time_min: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}
```

to:

```ts
export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  content: string | null;
  category_id: string | null;
  tags: string[];
  author_id: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  focal_x: number | null;
  focal_y: number | null;
  focal_zoom: number | null;
  is_published: boolean;
  published_at: string | null;
  reading_time_min: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}
```

And change:

```ts
export interface Service {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  /** Optional, free-form price line ("Desde 50€", "Consultar"). */
  price_text: string | null;
  /** Gallery of image URLs; the first entry is the cover. */
  image_urls: string[];
  image_alt: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

to:

```ts
export interface Service {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  /** Optional, free-form price line ("Desde 50€", "Consultar"). */
  price_text: string | null;
  /** Gallery of image URLs; the first entry is the cover. */
  image_urls: string[];
  image_alt: string | null;
  /** Focal point/zoom for image_urls[0] (the cover). Resets when a different image is promoted to cover. */
  focal_x: number | null;
  focal_y: number | null;
  focal_zoom: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: same errors as before this change (there will be some — code that constructs `Article`/`Service` records without the three new fields is now missing required properties; those get fixed in Tasks 11 and 13). Confirm no NEW errors reference typos in the fields you just added (e.g. no `Property 'focal_x' does not exist`).

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "Add focal_x/focal_y/focal_zoom to Article and Service types"
```

---

### Task 3: `lib/focalImage.ts` — the shared focal-point math

**Files:**
- Create: `lib/focalImage.ts`

- [ ] **Step 1: Write the module**

```ts
// Single source of truth for turning a stored focal point + zoom into the
// CSS needed to render it — used identically by the public FocalImage
// component and the admin ImageFocalEditor, so the two can never drift.

export interface FocalValue {
  focalX: number;
  focalY: number;
  focalZoom: number;
}

export const DEFAULT_FOCAL: FocalValue = { focalX: 50, focalY: 50, focalZoom: 1 };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export interface FrameSpec {
  label: string;
  width: number;
  height: number;
}

// Real fixed heights from app/(public)/public.css; widths are either the
// real fixed max-width (--maxread: 40rem = 640px, for the two hero-shaped
// frames) or an illustrative stand-in for the fluid-width grid frames
// (their real width varies by breakpoint/column count regardless).
export const ARTICLE_HERO_FRAME: FrameSpec = { label: "Hero", width: 640, height: 380 };
export const ARTICLE_CARD_FRAME: FrameSpec = { label: "Tarjeta", width: 300, height: 172 };
export const ARTICLE_FEATURE_FRAME: FrameSpec = { label: "Destacado", width: 300, height: 210 };
export const SERVICE_CARD_FRAME: FrameSpec = { label: "Tarjeta", width: 300, height: 172 };
export const SERVICE_HERO_FRAME: FrameSpec = { label: "Detalle", width: 640, height: 360 };

function clampPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return DEFAULT_FOCAL.focalX;
  return Math.min(100, Math.max(0, value));
}

function clampZoom(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return DEFAULT_FOCAL.focalZoom;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Turn stored focal_x/focal_y/focal_zoom (any of which may be null/undefined,
 * meaning "use the default") into the CSS needed to render an <img> anchored
 * on that point at that zoom — correct for any frame's own aspect ratio,
 * since object-position/transform-origin are percentage-based.
 */
export function computeFocalStyle(
  focalX: number | null | undefined,
  focalY: number | null | undefined,
  focalZoom: number | null | undefined
): { objectPosition: string; transform: string; transformOrigin: string } {
  const x = clampPercent(focalX);
  const y = clampPercent(focalY);
  const zoom = clampZoom(focalZoom);
  return {
    objectPosition: `${x}% ${y}%`,
    transform: zoom === 1 ? "none" : `scale(${zoom})`,
    transformOrigin: `${x}% ${y}%`,
  };
}
```

- [ ] **Step 2: Verify behavior**

There's no test runner in this repo, so verify with a throwaway Node check (do not commit this file):

```bash
cat > /tmp/focal-check.mjs <<'EOF'
function clampPercent(v) { return v == null || Number.isNaN(v) ? 50 : Math.min(100, Math.max(0, v)); }
function clampZoom(v) { return v == null || Number.isNaN(v) ? 1 : Math.min(3, Math.max(1, v)); }
function computeFocalStyle(fx, fy, fz) {
  const x = clampPercent(fx), y = clampPercent(fy), zoom = clampZoom(fz);
  return { objectPosition: `${x}% ${y}%`, transform: zoom === 1 ? "none" : `scale(${zoom})`, transformOrigin: `${x}% ${y}%` };
}
console.assert(JSON.stringify(computeFocalStyle(null, null, null)) === JSON.stringify({objectPosition:"50% 50%",transform:"none",transformOrigin:"50% 50%"}), "defaults failed");
console.assert(computeFocalStyle(30, 70, 2).objectPosition === "30% 70%", "position failed");
console.assert(computeFocalStyle(30, 70, 2).transform === "scale(2)", "zoom failed");
console.assert(computeFocalStyle(0, 0, 10).transform === "scale(3)", "zoom clamp failed");
console.assert(computeFocalStyle(0, 0, 0.2).transform === "none", "zoom floor failed");
console.log("focalImage math OK");
EOF
node /tmp/focal-check.mjs && rm /tmp/focal-check.mjs
```

Expected: `focalImage math OK`, no assertion failures.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from `lib/focalImage.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/focalImage.ts
git commit -m "Add lib/focalImage.ts — shared focal point/zoom CSS math"
```

---

### Task 4: `FocalImage` — public rendering component

**Files:**
- Create: `components/public/FocalImage.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { computeFocalStyle } from "@/lib/focalImage";

interface FocalImageProps {
  src: string;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  focalZoom?: number | null;
  className?: string;
}

// Drop-in replacement for a plain <img> inside a .ph/.hero-img/.service-hero
// frame (object-fit: cover already applies via that ancestor's CSS) — this
// just adds the object-position + zoom anchor on top.
export default function FocalImage({
  src,
  alt,
  focalX,
  focalY,
  focalZoom,
  className,
}: FocalImageProps) {
  const { objectPosition, transform, transformOrigin } = computeFocalStyle(
    focalX,
    focalY,
    focalZoom
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectPosition, transform, transformOrigin }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/public/FocalImage.tsx
git commit -m "Add FocalImage public rendering component"
```

---

### Task 5: Wire `FocalImage` into `ArticleCard`

**Files:**
- Modify: `components/public/ArticleCard.tsx`

- [ ] **Step 1: Replace the raw `<img>` with `FocalImage`**

```tsx
import Link from "next/link";
import type { CSSProperties } from "react";
import { gradFor, glyphFor, catClassFor } from "@/lib/categoryStyle";
import FocalImage from "@/components/public/FocalImage";
import type { ArticleWithRelations } from "@/types";

interface Props {
  article: ArticleWithRelations;
  variant?: "card" | "feature";
  style?: CSSProperties;
}

export default function ArticleCard({ article, variant = "card", style }: Props) {
  const href = `/articulos/${article.slug}`;
  const catName = article.category?.name ?? "";
  const authorName = article.author?.name ?? "Redacción";

  const placeholder = article.featured_image_url ? (
    <FocalImage
      src={article.featured_image_url}
      alt={article.featured_image_alt || ""}
      focalX={article.focal_x}
      focalY={article.focal_y}
      focalZoom={article.focal_zoom}
    />
  ) : (
    <span className="glyph">{glyphFor(catName)}</span>
  );
```

(Everything below `placeholder` — the `variant === "feature"` branch and the default `card` return — is unchanged; it already just renders `{placeholder}` inside `.ph`.)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/public/ArticleCard.tsx
git commit -m "Render article card/feature images through FocalImage"
```

---

### Task 6: Wire `FocalImage` into the article detail hero

**Files:**
- Modify: `app/(public)/articulos/[slug]/page.tsx`

- [ ] **Step 1: Add the import**

Change:

```tsx
import ArticleCard from "@/components/public/ArticleCard";
import SubscribeForm from "@/components/public/SubscribeForm";
```

to:

```tsx
import ArticleCard from "@/components/public/ArticleCard";
import FocalImage from "@/components/public/FocalImage";
import SubscribeForm from "@/components/public/SubscribeForm";
```

- [ ] **Step 2: Replace the raw `<img>` in the hero block**

Change:

```tsx
          <div
            className="ph hero-img"
            data-cat={catName}
            style={{ background: gradFor(catName) }}
          >
            {article.featured_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.featured_image_url}
                alt={article.featured_image_alt || ""}
              />
            ) : (
              <span className="glyph">{glyphFor(catName)}</span>
            )}
          </div>
```

to:

```tsx
          <div
            className="ph hero-img"
            data-cat={catName}
            style={{ background: gradFor(catName) }}
          >
            {article.featured_image_url ? (
              <FocalImage
                src={article.featured_image_url}
                alt={article.featured_image_alt || ""}
                focalX={article.focal_x}
                focalY={article.focal_y}
                focalZoom={article.focal_zoom}
              />
            ) : (
              <span className="glyph">{glyphFor(catName)}</span>
            )}
          </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/articulos/[slug]/page.tsx"
git commit -m "Render article hero image through FocalImage"
```

---

### Task 7: Wire `FocalImage` into `ServiceCard`

**Files:**
- Modify: `components/public/ServiceCard.tsx`

- [ ] **Step 1: Replace the raw `<img>` with `FocalImage`**

The current file renders its placeholder inline (no separate `placeholder` variable, unlike `ArticleCard`) — keep that structure, just swap the `<img>` for `<FocalImage>`:

```tsx
import Link from "next/link";
import FocalImage from "@/components/public/FocalImage";
import type { Service } from "@/types";

// Server component. Mirrors ArticleCard's structure so it reuses the public
// design-system card classes (.card/.ph/.body/.meta), with a price line and a
// booking CTA specific to services.
export default function ServiceCard({ service }: { service: Service }) {
  const href = `/servicios/${service.slug}`;
  const cover = service.image_urls?.[0];

  return (
    <Link className="card service-card" href={href}>
      <div className="ph service-ph">
        {cover ? (
          <FocalImage
            src={cover}
            alt={service.image_alt || service.title}
            focalX={service.focal_x}
            focalY={service.focal_y}
            focalZoom={service.focal_zoom}
          />
        ) : (
          <span className="glyph">✦</span>
        )}
      </div>
      <div className="body">
        <h3>{service.title}</h3>
        {service.summary && <p>{service.summary}</p>}
        <div className="service-foot">
          {service.price_text && (
            <span className="price-tag">{service.price_text}</span>
          )}
          <span className="service-cta">Reservar →</span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/public/ServiceCard.tsx
git commit -m "Render service card image through FocalImage"
```

---

### Task 8: Wire `FocalImage` into the service detail hero

**Files:**
- Modify: `app/(public)/servicios/[slug]/page.tsx`

- [ ] **Step 1: Add the import**

Change:

```tsx
import ServiceBookingForm from "@/components/public/ServiceBookingForm";
```

to:

```tsx
import FocalImage from "@/components/public/FocalImage";
import ServiceBookingForm from "@/components/public/ServiceBookingForm";
```

- [ ] **Step 2: Replace the raw `<img>` in the `.service-hero` block only**

Change:

```tsx
          {cover && (
            <div className="ph service-hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={service.image_alt || service.title} />
            </div>
          )}
```

to:

```tsx
          {cover && (
            <div className="ph service-hero">
              <FocalImage
                src={cover}
                alt={service.image_alt || service.title}
                focalX={service.focal_x}
                focalY={service.focal_y}
                focalZoom={service.focal_zoom}
              />
            </div>
          )}
```

Leave the `.service-gallery` block (the `rest.map(...)` loop below it) untouched — those are the non-cover images, out of scope.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/servicios/[slug]/page.tsx"
git commit -m "Render service detail hero image through FocalImage"
```

---

### Task 9: `ImageFocalEditor` — the admin drag/resize UI

This is the largest task — built incrementally so each capability is independently verifiable.

**Files:**
- Create: `components/admin/ui/ImageFocalEditor.tsx`

- [ ] **Step 1: Static render — reference frame + rectangle, no interaction yet**

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import {
  computeFocalStyle,
  DEFAULT_FOCAL,
  MAX_ZOOM,
  MIN_ZOOM,
  type FrameSpec,
} from "@/lib/focalImage";

const DISPLAY_WIDTH = 320; // px — fixed width the reference image is shown at while editing
const MIRROR_WIDTH = 150; // px — fixed width of each read-only mirror tile

interface ImageFocalEditorProps {
  imageUrl: string;
  alt: string;
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  onChange: (focal: { focalX: number; focalY: number; focalZoom: number }) => void;
  referenceFrame: FrameSpec;
  mirrorFrames: FrameSpec[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function ImageFocalEditor({
  imageUrl,
  alt,
  focalX,
  focalY,
  focalZoom,
  onChange,
  referenceFrame,
  mirrorFrames,
}: ImageFocalEditorProps) {
  const x = focalX ?? DEFAULT_FOCAL.focalX;
  const y = focalY ?? DEFAULT_FOCAL.focalY;
  const zoom = focalZoom ?? DEFAULT_FOCAL.focalZoom;

  const imgRef = useRef<HTMLImageElement>(null);
  const [displayHeight, setDisplayHeight] = useState<number | null>(null);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    setDisplayHeight((DISPLAY_WIDTH * img.naturalHeight) / img.naturalWidth);
  }, []);

  const refAspect = referenceFrame.width / referenceFrame.height;

  // The crop rectangle's size at zoom=1 is whatever object-fit:cover would
  // pick: full image height + cropped width (image relatively wider than
  // the frame), or full width + cropped height (image relatively taller).
  function baseRectSize(imgW: number, imgH: number) {
    const imgAspect = imgW / imgH;
    if (imgAspect > refAspect) {
      const height = imgH;
      return { width: height * refAspect, height };
    }
    const width = imgW;
    return { width, height: width / refAspect };
  }

  if (!displayHeight) {
    return (
      <div className="text-sm text-[#6b6560]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt}
          onLoad={handleImageLoad}
          style={{ display: "none" }}
        />
        Cargando imagen…
      </div>
    );
  }

  const base = baseRectSize(DISPLAY_WIDTH, displayHeight);
  const rectWidth = base.width / zoom;
  const rectHeight = base.height / zoom;
  const centerX = (x / 100) * DISPLAY_WIDTH;
  const centerY = (y / 100) * displayHeight;
  const rectLeft = clamp(centerX - rectWidth / 2, 0, DISPLAY_WIDTH - rectWidth);
  const rectTop = clamp(centerY - rectHeight / 2, 0, displayHeight - rectHeight);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-medium text-[#6b6560] mb-1.5">
          {referenceFrame.label}
        </div>
        <div
          className="relative select-none rounded-lg overflow-hidden bg-[#2b2434]"
          style={{ width: DISPLAY_WIDTH, height: displayHeight }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            draggable={false}
            style={{ width: DISPLAY_WIDTH, height: displayHeight, display: "block" }}
          />
          <div
            data-testid="focal-rect"
            className="absolute border-2 border-[#fff9f1] rounded"
            style={{
              left: rectLeft,
              top: rectTop,
              width: rectWidth,
              height: rectHeight,
              boxShadow: "0 0 0 999px rgba(43,36,52,.55)",
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {mirrorFrames.map((frame) => {
          const style = computeFocalStyle(x, y, zoom);
          const mirrorHeight = MIRROR_WIDTH / (frame.width / frame.height);
          return (
            <div key={frame.label}>
              <div className="text-xs font-medium text-[#6b6560] mb-1.5">
                {frame.label}
              </div>
              <div
                className="rounded-lg overflow-hidden bg-[#2b2434]"
                style={{ width: MIRROR_WIDTH, height: mirrorHeight }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: style.objectPosition,
                    transform: style.transform,
                    transformOrigin: style.transformOrigin,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors. `MIN_ZOOM`/`MAX_ZOOM`/`onChange` are unused at this point — harmless, since this repo's `tsconfig.json` has `strict: true` but not `noUnusedLocals`/`noUnusedParameters`. They're wired in Step 3.

- [ ] **Step 3: Add pan (drag the rectangle body)**

Add this above the `return` statement (after the `rectTop` calculation):

```tsx
  const dragRef = useRef<{
    mode: "pan" | "resize";
    startClientX: number;
    startClientY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  function updateFromRect(left: number, top: number, width: number, height: number) {
    const clampedWidth = clamp(width, base.width / MAX_ZOOM, base.width / MIN_ZOOM);
    const clampedHeight = clampedWidth / refAspect;
    const clampedLeft = clamp(left, 0, DISPLAY_WIDTH - clampedWidth);
    const clampedTop = clamp(top, 0, displayHeight! - clampedHeight);
    const newX = ((clampedLeft + clampedWidth / 2) / DISPLAY_WIDTH) * 100;
    const newY = ((clampedTop + clampedHeight / 2) / displayHeight!) * 100;
    const newZoom = clamp(base.width / clampedWidth, MIN_ZOOM, MAX_ZOOM);
    onChange({ focalX: newX, focalY: newY, focalZoom: newZoom });
  }

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    if (drag.mode === "pan") {
      updateFromRect(drag.startLeft + dx, drag.startTop + dy, drag.startWidth, drag.startHeight);
      return;
    }

    // Resize: rectangle center stays fixed; distance from center to the
    // pointer (on whichever axis moved further, scaled by aspect ratio)
    // drives the new half-width. Works the same for any of the 4 corners.
    const centerXAtStart = drag.startLeft + drag.startWidth / 2;
    const centerYAtStart = drag.startTop + drag.startHeight / 2;
    const pointerDx = Math.abs(centerXAtStart - (centerXAtStart + dx));
    const pointerDy = Math.abs(centerYAtStart - (centerYAtStart + dy));
    const halfWidth = Math.max(pointerDx, pointerDy * refAspect);
    const newWidth = halfWidth * 2;
    updateFromRect(
      centerXAtStart - newWidth / 2,
      centerYAtStart - newWidth / refAspect / 2,
      newWidth,
      newWidth / refAspect
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  function startDrag(mode: "pan" | "resize", e: React.PointerEvent) {
    e.preventDefault();
    if (mode === "resize") e.stopPropagation();
    dragRef.current = {
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startLeft: rectLeft,
      startTop: rectTop,
      startWidth: rectWidth,
      startHeight: rectHeight,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }
```

Then add `onPointerDown={(e) => startDrag("pan", e)}` and `className="absolute border-2 border-[#fff9f1] rounded cursor-move"` (adding `cursor-move`) to the `data-testid="focal-rect"` div.

- [ ] **Step 4: Add resize handles (the 4 corners)**

Inside the `data-testid="focal-rect"` div, add four handle children:

```tsx
          <div
            data-testid="focal-rect"
            onPointerDown={(e) => startDrag("pan", e)}
            className="absolute border-2 border-[#fff9f1] rounded cursor-move"
            style={{
              left: rectLeft,
              top: rectTop,
              width: rectWidth,
              height: rectHeight,
              boxShadow: "0 0 0 999px rgba(43,36,52,.55)",
            }}
          >
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <div
                key={corner}
                data-testid={`focal-handle-${corner}`}
                onPointerDown={(e) => startDrag("resize", e)}
                className="absolute w-3 h-3 bg-[#fff9f1] rounded-sm cursor-nwse-resize"
                style={{
                  top: corner.includes("n") ? -6 : undefined,
                  bottom: corner.includes("s") ? -6 : undefined,
                  left: corner.includes("w") ? -6 : undefined,
                  right: corner.includes("e") ? -6 : undefined,
                }}
              />
            ))}
          </div>
```

- [ ] **Step 5: Add the reset control**

After the mirror-frames `<div className="flex flex-wrap gap-3">...</div>` block, add:

```tsx
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_FOCAL })}
        className="text-xs font-medium text-[#6b6560] hover:text-[#1a1a18] underline"
      >
        Restablecer posición
      </button>
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors — every prop (`onChange`, `MIN_ZOOM`, `MAX_ZOOM`) is now used.

- [ ] **Step 7: Commit**

```bash
git add components/admin/ui/ImageFocalEditor.tsx
git commit -m "Add ImageFocalEditor: drag/resize positioning with live frame mirrors"
```

---

### Task 10: Wire `ImageFocalEditor` into `ImageUploader` (articles)

**Files:**
- Modify: `components/admin/ui/ImageUploader.tsx`

- [ ] **Step 1: Add focal props and render the editor once a value exists**

Change the imports and props interface:

```tsx
"use client";

import { useId, useRef, useState } from "react";
import {
  uploadArticleImage,
  validateImageFile,
} from "@/lib/admin/uploadImage";
import ImageFocalEditor from "@/components/admin/ui/ImageFocalEditor";
import {
  ARTICLE_CARD_FRAME,
  ARTICLE_FEATURE_FRAME,
  ARTICLE_HERO_FRAME,
} from "@/lib/focalImage";

interface ImageUploaderProps {
  value: string; // current featured_image_url ("" if none)
  alt: string; // current featured_image_alt
  onChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  onFocalChange: (focal: { focalX: number; focalY: number; focalZoom: number }) => void;
  label?: string; // defaults to "Imagen destacada"
  altLabel?: string; // defaults to "Texto alternativo de la imagen"
}
```

Add `focalX`, `focalY`, `focalZoom`, `onFocalChange` to the destructured props in the function signature (alongside `value, alt, onChange, onAltChange, label, altLabel`).

- [ ] **Step 2: Replace the plain thumbnail `<img>` with `ImageFocalEditor`**

Change:

```tsx
      ) : value ? (
        <div
          tabIndex={0}
          className="rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-3 focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={alt}
            className="max-h-[180px] w-auto rounded-lg object-contain"
          />
          <div className="flex flex-wrap gap-2 mt-3">
```

to:

```tsx
      ) : value ? (
        <div
          tabIndex={0}
          className="rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-3 focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <ImageFocalEditor
            imageUrl={value}
            alt={alt}
            focalX={focalX}
            focalY={focalY}
            focalZoom={focalZoom}
            onChange={onFocalChange}
            referenceFrame={ARTICLE_HERO_FRAME}
            mirrorFrames={[ARTICLE_CARD_FRAME, ARTICLE_FEATURE_FRAME]}
          />
          <div className="flex flex-wrap gap-2 mt-3">
```

Leave the "Reemplazar"/"Quitar" buttons below unchanged for now — reset-on-replace is wired in Task 11 (where `onChange("")` / a new upload live in `ArticleEditorForm`'s state, alongside the focal reset).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: new errors from `ArticleEditorForm.tsx` — it calls `<ImageUploader>` without the four new required props. That's expected; fixed in Task 11.

- [ ] **Step 4: Commit**

```bash
git add components/admin/ui/ImageUploader.tsx
git commit -m "Wire ImageFocalEditor into ImageUploader for article featured images"
```

---

### Task 11: Thread focal state through `ArticleEditorForm`

**Files:**
- Modify: `components/admin/ArticleEditorForm.tsx`

- [ ] **Step 1: Add focal state**

After the existing `featuredImageAlt` state (around line 68-70):

```tsx
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    initialData?.featured_image_alt ?? ""
  );
  const [focalX, setFocalX] = useState<number | null>(initialData?.focal_x ?? null);
  const [focalY, setFocalY] = useState<number | null>(initialData?.focal_y ?? null);
  const [focalZoom, setFocalZoom] = useState<number | null>(
    initialData?.focal_zoom ?? null
  );
```

- [ ] **Step 2: Include focal values in the autosave snapshot**

In the `snapshot` `JSON.stringify({...})` block, add the three fields alongside `featuredImageUrl, featuredImageAlt,`:

```tsx
    featuredImageUrl,
    featuredImageAlt,
    focalX,
    focalY,
    focalZoom,
```

- [ ] **Step 3: Restore focal values in `restoreDraft()`**

In `restoreDraft()`, after `setFeaturedImageAlt(d.featuredImageAlt ?? "");`, add:

```tsx
      setFocalX(d.focalX ?? null);
      setFocalY(d.focalY ?? null);
      setFocalZoom(d.focalZoom ?? null);
```

- [ ] **Step 4: Reset focal values when the image is replaced or removed**

`ImageUploader`'s `onChange` prop is currently wired directly to `setFeaturedImageUrl`. Change:

```tsx
      <ImageUploader
        value={featuredImageUrl}
        alt={featuredImageAlt}
        onChange={setFeaturedImageUrl}
        onAltChange={setFeaturedImageAlt}
        label={t.editor.featuredImage}
        altLabel={t.editor.featuredImageAlt}
      />
```

to:

```tsx
      <ImageUploader
        value={featuredImageUrl}
        alt={featuredImageAlt}
        onChange={(url) => {
          setFeaturedImageUrl(url);
          setFocalX(null);
          setFocalY(null);
          setFocalZoom(null);
        }}
        onAltChange={setFeaturedImageAlt}
        focalX={focalX}
        focalY={focalY}
        focalZoom={focalZoom}
        onFocalChange={({ focalX: x, focalY: y, focalZoom: z }) => {
          setFocalX(x);
          setFocalY(y);
          setFocalZoom(z);
        }}
        label={t.editor.featuredImage}
        altLabel={t.editor.featuredImageAlt}
      />
```

(A new upload or "Quitar" both call `onChange` with a new URL or `""` — resetting focal values either way is correct: no image, or a different photo, neither has a meaningful old crop.)

- [ ] **Step 5: Include focal values in the saved `record`**

In `save()`, add to the `record` object, alongside `featured_image_url`/`featured_image_alt`:

```tsx
      featured_image_url: featuredImageUrl || null,
      featured_image_alt: featuredImageAlt || null,
      focal_x: focalX,
      focal_y: focalY,
      focal_zoom: focalZoom,
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `ArticleEditorForm.tsx` or `ImageUploader.tsx`.

- [ ] **Step 7: Commit**

```bash
git add components/admin/ArticleEditorForm.tsx
git commit -m "Thread focal_x/focal_y/focal_zoom through ArticleEditorForm"
```

---

### Task 12: Wire `ImageFocalEditor` into `ServiceImagesUploader` (cover only)

**Files:**
- Modify: `components/admin/ui/ServiceImagesUploader.tsx`

- [ ] **Step 1: Add focal props**

Change the imports and props interface:

```tsx
"use client";

import { useRef, useState } from "react";
import { uploadServiceImage, validateImageFile } from "@/lib/admin/uploadImage";
import { t } from "@/lib/admin/strings";
import ImageFocalEditor from "@/components/admin/ui/ImageFocalEditor";
import { SERVICE_CARD_FRAME, SERVICE_HERO_FRAME } from "@/lib/focalImage";

interface ServiceImagesUploaderProps {
  value: string[]; // ordered image URLs; first is the cover
  alt: string;
  onChange: (urls: string[]) => void;
  onAltChange: (alt: string) => void;
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  onFocalChange: (focal: { focalX: number; focalY: number; focalZoom: number }) => void;
}
```

Add `focalX`, `focalY`, `focalZoom`, `onFocalChange` to the destructured function props.

- [ ] **Step 2: Reset focal values when the cover image changes**

`removeAt` and `makeCover` can both change which URL is at index 0. Change:

```tsx
  const removeAt = (index: number) => {
    setError(null);
    onChange(value.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const reordered = [...value];
    const [picked] = reordered.splice(index, 1);
    reordered.unshift(picked);
    onChange(reordered);
  };
```

to:

```tsx
  const removeAt = (index: number) => {
    setError(null);
    const wasCover = index === 0;
    onChange(value.filter((_, i) => i !== index));
    if (wasCover) onFocalChange({ focalX: 50, focalY: 50, focalZoom: 1 });
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const reordered = [...value];
    const [picked] = reordered.splice(index, 1);
    reordered.unshift(picked);
    onChange(reordered);
    onFocalChange({ focalX: 50, focalY: 50, focalZoom: 1 });
  };
```

Also reset when a brand-new cover is uploaded (i.e. the gallery was empty before this upload). In `handleFiles`, change:

```tsx
  const handleFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);
    let next = value;
    try {
      for (const file of files) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }
        const { url } = await uploadServiceImage(file);
        next = [...next, url];
        onChange(next);
      }
    } catch {
      setError(t.serviceEditor.uploadError);
    } finally {
      setUploading(false);
    }
  };
```

to:

```tsx
  const handleFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);
    let next = value;
    const hadNoCoverBefore = value.length === 0;
    try {
      for (const file of files) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }
        const { url } = await uploadServiceImage(file);
        next = [...next, url];
        onChange(next);
      }
      if (hadNoCoverBefore && next.length > 0) {
        onFocalChange({ focalX: 50, focalY: 50, focalZoom: 1 });
      }
    } catch {
      setError(t.serviceEditor.uploadError);
    } finally {
      setUploading(false);
    }
  };
```

- [ ] **Step 3: Render `ImageFocalEditor` for the cover tile, keep plain thumbnails for the rest**

Change the gallery grid's cover tile (`index === 0`). Current:

```tsx
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-2"
            >
              {index === 0 && (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-semibold uppercase tracking-wider bg-deep text-white px-2 py-0.5 rounded-full">
                  {t.serviceEditor.coverBadge}
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-28 w-full rounded-lg object-cover"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
```

to:

```tsx
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-2"
            >
              {index === 0 && (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-semibold uppercase tracking-wider bg-deep text-white px-2 py-0.5 rounded-full">
                  {t.serviceEditor.coverBadge}
                </span>
              )}
              {index === 0 ? (
                <ImageFocalEditor
                  imageUrl={url}
                  alt={alt}
                  focalX={focalX}
                  focalY={focalY}
                  focalZoom={focalZoom}
                  onChange={onFocalChange}
                  referenceFrame={SERVICE_CARD_FRAME}
                  mirrorFrames={[SERVICE_HERO_FRAME]}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  className="h-28 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: new errors from `ServiceEditorForm.tsx` — it calls `<ServiceImagesUploader>` without the four new required props. Expected; fixed in Task 13.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ui/ServiceImagesUploader.tsx
git commit -m "Wire ImageFocalEditor into ServiceImagesUploader's cover slot"
```

---

### Task 13: Thread focal state through `ServiceEditorForm`

**Files:**
- Modify: `components/admin/ServiceEditorForm.tsx`

- [ ] **Step 1: Add focal state**

After `const [imageAlt, setImageAlt] = useState(initialData?.image_alt ?? "");`, add:

```tsx
  const [focalX, setFocalX] = useState<number | null>(initialData?.focal_x ?? null);
  const [focalY, setFocalY] = useState<number | null>(initialData?.focal_y ?? null);
  const [focalZoom, setFocalZoom] = useState<number | null>(
    initialData?.focal_zoom ?? null
  );
```

- [ ] **Step 2: Pass focal props to `ServiceImagesUploader`**

Change:

```tsx
      <ServiceImagesUploader
        value={imageUrls}
        alt={imageAlt}
        onChange={(urls) => {
          setImageUrls(urls);
          markDirty();
        }}
        onAltChange={(alt) => {
          setImageAlt(alt);
          markDirty();
        }}
      />
```

to:

```tsx
      <ServiceImagesUploader
        value={imageUrls}
        alt={imageAlt}
        onChange={(urls) => {
          setImageUrls(urls);
          markDirty();
        }}
        onAltChange={(alt) => {
          setImageAlt(alt);
          markDirty();
        }}
        focalX={focalX}
        focalY={focalY}
        focalZoom={focalZoom}
        onFocalChange={({ focalX: x, focalY: y, focalZoom: z }) => {
          setFocalX(x);
          setFocalY(y);
          setFocalZoom(z);
          markDirty();
        }}
      />
```

- [ ] **Step 3: Include focal values in the saved `record`**

In `save()`, add to the `record` object, alongside `image_urls`/`image_alt`:

```tsx
      image_urls: imageUrls,
      image_alt: imageAlt.trim() || null,
      focal_x: focalX,
      focal_y: focalY,
      focal_zoom: focalZoom,
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: **zero errors project-wide** — this was the last remaining call site.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ServiceEditorForm.tsx
git commit -m "Thread focal_x/focal_y/focal_zoom through ServiceEditorForm"
```

---

### Task 14: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full project typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. Note: `next build` will still hit the same pre-existing "can't reach live Supabase" limitation every prior session has hit in this environment (no `.env` credentials here) — that's not a regression from this work; confirm the failure (if any) is that same credential-gated static-generation issue and not a new type/syntax error.

- [ ] **Step 2: Regression check — default rendering unchanged**

Using the `preview_start`/`preview_*` tools against the dev server:
1. Navigate to the homepage and an article detail page that has a `featured_image_url` but (pre-migration) no focal columns yet.
2. Run `preview_inspect` on the rendered `<img>` inside `.hero-img` and inside a `.card .ph`.
3. Expected: computed `object-position` is `50% 50%` and there is no `transform` (or `transform: none`) — i.e. identical to pre-change behavior, confirming `computeFocalStyle`'s defaults produce a no-op.

- [ ] **Step 3: Simulated focal math check via the public FocalImage component**

Since the admin editor needs an authenticated Supabase session this environment doesn't have, verify the rendering half of the loop directly: temporarily render a `<FocalImage src="..." alt="" focalX={20} focalY={80} focalZoom={2} />` on a scratch page (or via `preview_eval` injecting a DOM check against an existing `FocalImage`-rendered element if any test data has non-default values), and confirm via `preview_inspect` that the computed style shows `object-position: 20% 80%` and a `scale(2)` transform. Remove any scratch page/route added purely for this check before finishing — it's not part of the feature.

- [ ] **Step 4: Manual note for the admin-side interactive editor**

The drag/resize interaction in `ImageFocalEditor` lives behind Supabase Auth (`/admin/articles/new`, `/admin/services/new`) and this environment has no admin credentials to log in with — this step **cannot** be machine-verified here. Call this out explicitly to Lewis in your summary: he needs to manually log in, upload an image, drag the rectangle, confirm the mirror tiles update live, save, and confirm the public article/service reflects the same crop — the same "smoke test after applying the migration" pattern every prior session in `lessons.md` has ended with.

- [ ] **Step 5: Update `lessons.md`**

Append a new dated session entry (per `CLAUDE.md`'s "Update lessons.md at the end of every session" rule) summarizing: what was built, the still-pending manual migration apply (`0010`, same standing MCP blocker), and the still-pending manual admin smoke test from Step 4.

- [ ] **Step 6: Final commit**

```bash
git add lessons.md
git commit -m "Log image focal point session in lessons.md"
```

---

## Self-review notes

- **Spec coverage:** every spec section has a task — data model (Task 1-2), shared math (Task 3), public rendering (Tasks 4-8), editor UI (Task 9-13), backward compatibility (verified in Task 14 Step 2), edge cases (reset-on-replace in Task 11 Step 4, reset-on-promote/reset-on-new-cover in Task 12 Step 2), testing (Task 14).
- **No test framework exists in this repo** (confirmed via `package.json` — no `jest`/`vitest`/`@testing-library/*`, no `test` script) — TDD steps above use `tsc --noEmit` (fast, real, catches whole classes of mistakes) plus the actual Claude Code preview tools against the dev server, matching this repo's own established QA convention instead of introducing new test tooling unilaterally.
- **Type consistency check:** `onFocalChange({ focalX, focalY, focalZoom })` shape is identical everywhere it's threaded (Tasks 9, 10, 11, 12, 13) — `ImageFocalEditor`'s `onChange` prop, `ImageUploader`'s `onFocalChange` prop, and `ServiceImagesUploader`'s `onFocalChange` prop all use the same `{ focalX, focalY, focalZoom }` object shape, matching `FocalValue` in `lib/focalImage.ts`.
- **`ServiceCard.tsx` correction:** the original file has no `variant` prop (unlike `ArticleCard`) — Task 7's code doesn't reference one.
- **Known real limitation, not a gap in this plan:** the migration must still be applied by hand (standing blocker, unrelated to this feature) and the interactive drag/resize behavior needs a human with admin credentials to actually exercise — both are called out explicitly in Task 14 rather than glossed over.
