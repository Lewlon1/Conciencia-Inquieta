/**
 * CI's public contact points — code-managed, single source of truth.
 *
 * Read by the footer, the /sobre-nosotras "Síguenos" block, /contacto and the
 * Organization JSON-LD, so a changed handle is a one-line edit here.
 *
 * NOT env vars on purpose: these are public, stable, and belong in the diff —
 * an env var would make them invisible in review and break the static build if
 * unset. Contrast SecondaryChannelButton, which IS env-gated because the
 * WhatsApp-vs-Telegram decision is still open.
 *
 * The Facebook URL is the /share/ redirect Marie sent, tracking param and all;
 * it resolves correctly. Swap it for the canonical page URL when she sends it.
 */
export const SOCIAL = {
  instagram: "https://www.instagram.com/conciencia.inquieta/",
  facebook: "https://www.facebook.com/share/1bhoRDozQC/?mibextid=wwXIfr",
  email: "hola@concienciainquieta.es",
} as const;

/** `mailto:` href for SOCIAL.email — the address itself is the link label. */
export const MAILTO = `mailto:${SOCIAL.email}`;
