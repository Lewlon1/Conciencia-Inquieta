// Per-category visual identity for the public site.
//
// The design this is ported from keyed its card geometry to 6 invented topics
// (Política/Cultura/Tecnología/Ciencia/Sociedad/Economía). CI has 9 real
// categories, so the mapping is generalised to cover all of them — keyed by
// SLUG, not display name, so an editorial rename can't silently drop a
// category back to the fallback. Slugs are fixed in migration 0003.

interface CategoryStyle {
  /** Tailwind corner geometry for the card frame — the "restless" shape language. */
  shape: string;
  /** Gradient stops for the placeholder shown when an article has no image. */
  grad: [string, string];
  /** Foreground on top of that gradient: the darker stops need light text. */
  onDark: boolean;
}

const PURPLE = "#e9c6e9";
const ORANGE = "#fabb5c";
const INK = "#180a29";

const STYLES: Record<string, CategoryStyle> = {
  "derechos-humanos": {
    shape: "rounded-tr-[80px]",
    grad: [PURPLE, "#b98fc0"],
    onDark: false,
  },
  "politica-internacional": {
    shape: "rounded-bl-[70px]",
    grad: [ORANGE, "#e8923f"],
    onDark: false,
  },
  latinoamerica: {
    shape: "rounded-tl-[60px] rounded-br-[60px]",
    grad: [ORANGE, PURPLE],
    onDark: false,
  },
  feminismo: {
    shape: "rounded-t-[80px]",
    grad: [PURPLE, "#d98a99"],
    onDark: false,
  },
  cultura: {
    shape: "rounded-3xl",
    grad: ["#c79bd6", ORANGE],
    onDark: false,
  },
  medioambiente: {
    shape: "rounded-br-[80px]",
    grad: ["#bcd6a8", "#86a86b"],
    onDark: false,
  },
  "movimientos-sociales": {
    shape: "rounded-b-[60px]",
    grad: [ORANGE, "#d98a99"],
    onDark: false,
  },
  opinion: {
    shape: "rounded-none",
    grad: [INK, "#4a2f66"],
    onDark: true,
  },
  "musica-artes": {
    shape: "rounded-[60px]",
    grad: ["#c79bd6", ORANGE],
    onDark: false,
  },
};

const FALLBACK: CategoryStyle = {
  shape: "rounded-2xl",
  grad: [PURPLE, ORANGE],
  onDark: false,
};

export function styleForCategory(
  slug: string | null | undefined
): CategoryStyle {
  return (slug && STYLES[slug]) || FALLBACK;
}

/** Tailwind classes for a card's corner geometry. */
export function shapeFor(slug: string | null | undefined): string {
  return styleForCategory(slug).shape;
}

export function gradFor(slug: string | null | undefined): string {
  const [a, b] = styleForCategory(slug).grad;
  return `linear-gradient(135deg,${a},${b})`;
}

/** First letter of the category name, used as the placeholder glyph. */
export function glyphFor(name: string): string {
  return (name || "·").trim()[0] || "·";
}

/** Opinión's placeholder is dark, so anything drawn over it needs light ink. */
export function isDarkCategory(slug: string | null | undefined): boolean {
  return styleForCategory(slug).onDark;
}
