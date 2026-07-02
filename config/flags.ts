/**
 * Feature flags — code-managed, Lewis-only.
 *
 * Marie never sees a flag UI. Flip these in code + redeploy when a feature
 * is ready to reveal. Both inherited features start OFF for the MVP — see
 * CLAUDE.md golden rules.
 */
export const FLAGS = {
  /** Astro-Psyche Lab's service price management admin (not ported into this repo yet). */
  servicePriceManagement: false,

  /** AI content-generation tools: repurpose, inspiration, transits, video-editor, photoshop (not ported yet). */
  contentGenerationTools: false,
} as const;

export type FlagKey = keyof typeof FLAGS;
