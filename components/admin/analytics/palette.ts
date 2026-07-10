// Chart palette for the admin analytics dashboard. The two categorical hues are
// validated CVD-safe against the light admin surface (dataviz validator: amber↔
// violet ΔE 119). Amber = marigold family, used for the conversion/goal metric
// (signups); violet = lilac family, the primary magnitude hue. Admin is a
// single (light) theme, so no dark-mode variant is needed.
export const CHART = {
  /** Primary magnitude hue (funnel, visitor bars, visitors line). */
  primary: "#6d5bd0",
  /** The goal metric — signups / conversion. Draws the eye. */
  signups: "#d97706",
  /** Recessive bar track behind fills. */
  track: "#efeae1",
  /** Recessive gridlines/axes. */
  grid: "#ece8e1",
} as const;
