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

// Aspect ratios mirror the real public frames post-redesign; the pixel values
// are just an illustrative size at that ratio, since every frame is now
// fluid-width (aspect-ratio boxes rather than fixed heights). Keep these in
// sync when a public frame's ratio changes, or the admin's focal preview
// stops predicting what readers actually see.
//   hero band  → aspect-[2/1]  (articulos/[slug], servicios/[slug])
//   slideshow  → aspect-[16/9] (HeroSlideshow, home)
//   card       → aspect-[4/3]  (ArticleCard) / aspect-[16/9] (ServiceCard)
export const ARTICLE_HERO_FRAME: FrameSpec = { label: "Cabecera", width: 640, height: 320 };
export const ARTICLE_CARD_FRAME: FrameSpec = { label: "Tarjeta", width: 300, height: 225 };
export const ARTICLE_FEATURE_FRAME: FrameSpec = { label: "Portada", width: 400, height: 225 };
export const SERVICE_CARD_FRAME: FrameSpec = { label: "Tarjeta", width: 320, height: 180 };
export const SERVICE_HERO_FRAME: FrameSpec = { label: "Detalle", width: 640, height: 320 };

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
