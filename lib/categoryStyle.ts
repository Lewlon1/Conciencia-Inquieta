// Per-category gradient used as a placeholder when an article has no
// featured_image_url. Matches the approved CI prototype's palette.
const GRADIENTS: Record<string, [string, string]> = {
  "Derechos humanos": ["#e9c6e9", "#b98fc0"],
  "Política internacional": ["#fabb5c", "#e8923f"],
  "Latinoamérica": ["#f4b9c2", "#d98a99"],
  "Feminismo": ["#e9c6e9", "#d98a99"],
  "Cultura": ["#fabb5c", "#c79bd6"],
  "Medioambiente": ["#bcd6a8", "#86a86b"],
  "Movimientos sociales": ["#fabb5c", "#d98a99"],
  "Opinión": ["#382a44", "#6a4f7a"],
  "Música y artes": ["#c79bd6", "#fabb5c"],
};

export function gradFor(category: string): string {
  const g = GRADIENTS[category] ?? ["#e9c6e9", "#fabb5c"];
  return `linear-gradient(135deg,${g[0]},${g[1]})`;
}

export function glyphFor(category: string): string {
  return (category || "·").trim()[0] || "·";
}
