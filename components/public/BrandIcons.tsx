// Brand marks for the social links.
//
// lucide-react v1 dropped brand icons, and this repo's standing rule (see the
// comment above `shareLinks` in app/(public)/articulos/[slug]/page.tsx) is that
// approximating a brand path from memory is worse than not drawing it. So:
//
//   Instagram — drawn, because its mark IS plain geometry (rounded square,
//   concentric circle, corner dot). Reproducing it needs no recalled curves.
//   Facebook  — typographic "f", the same fallback the article share row
//   already ships. Its real mark is a specific letterform on a specific
//   roundrect; a hand-drawn version would be a worse lie than an honest glyph.
//
// Both take the lucide-style className so callers size and colour them with
// `h-4 w-4` + `text-*`, and both are aria-hidden — every call site pairs them
// with an sr-only label naming the destination.

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookGlyph({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`font-heading font-black leading-none ${className ?? ""}`}>
      f
    </span>
  );
}
