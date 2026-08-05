import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/public/PageHero";

// In-group 404: rendered inside the (public) root layout (rail, fonts, footer)
// for notFound() calls from public pages — e.g. an unknown article or category
// slug.
export default function PublicNotFound() {
  return (
    <>
      <PageHero
        kicker="404"
        title={
          <>
            Esta página se <span className="text-ci-orange">perdió</span>.
          </>
        }
        lead="Puede que el enlace esté roto o que el artículo ya no exista."
      />
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-ci-orange px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-colors hover:bg-ci-purple"
          >
            Volver a la portada
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/articulos"
            className="inline-flex items-center gap-2 rounded-full border-2 border-ci-ink/15 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-colors hover:border-ci-orange"
          >
            Ver todos los artículos
          </Link>
        </div>
      </section>
    </>
  );
}
