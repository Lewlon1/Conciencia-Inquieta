/**
 * When does an author appear publicly?
 *
 * Migration 0003 seeds a placeholder author whose bio starts with "TODO" so the
 * article editor has something selectable. A placeholder must never surface on
 * /sobre-nosotras as if it were a real person, so the team grid only shows
 * authors with a genuine bio.
 *
 * Single source of truth on purpose: the public filter (`getPublicAuthors` in
 * lib/content.ts) and the admin badge (/admin/autores) both call this, so the
 * rule the admin *shows* can never drift from the rule the site *applies*.
 * Kept dependency-free so client components can import it too.
 */
export function isAuthorPublic(author: { bio: string | null }): boolean {
  return !!author.bio && !author.bio.trim().toUpperCase().startsWith("TODO");
}
