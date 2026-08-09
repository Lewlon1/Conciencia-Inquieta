import type { ReactNode } from "react";

// The black page masthead the design repeats across every non-home route:
// orange kicker, oversized Roboto Black headline, optional lead, and the
// diagonal rules. Server component — no motion, so it renders in the static
// HTML and doesn't cost a hydration boundary on legal pages.

export default function PageHero({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-black px-6 pb-20 pt-16 md:px-8 md:pb-24 md:pt-20">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute right-1/4 top-4 block h-1 w-80 -rotate-[25deg] bg-ci-orange" />
        <span className="absolute right-0 top-36 block h-1 w-48 -rotate-[25deg] bg-ci-purple/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <span className="mb-4 inline-block text-sm font-bold uppercase tracking-wider text-ci-orange">
          {kicker}
        </span>
        <h1 className="max-w-4xl font-heading text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-6 max-w-xl text-lg text-white/60">{lead}</p>
        )}
        {children}
      </div>
    </section>
  );
}
