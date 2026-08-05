import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Megaphone } from "lucide-react";
import HeroSlideshow from "@/components/public/HeroSlideshow";
import QuestionTicker from "@/components/public/QuestionTicker";
import ArticleCard from "@/components/public/ArticleCard";
import SubscribeForm from "@/components/public/SubscribeForm";
import SecondaryChannelButton from "@/components/public/SecondaryChannelButton";
import { getPublishedArticles, getCategories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

// ISR: the list refreshes ~1 min after a new article is published.
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Conciencia Inquieta — diario digital autogestionado",
  description:
    "Noticias que importan, conversaciones que faltan, reflexiones que sanan. Diario digital independiente: derechos humanos, feminismo, Latinoamérica, cultura y más.",
  path: "/",
});

export default async function HomePage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
  ]);

  const slideshow = articles.slice(0, 5);
  const latest = articles.slice(0, 6);

  return (
    <>
      {slideshow.length > 0 ? (
        <HeroSlideshow articles={slideshow} />
      ) : (
        // Empty state: no published articles yet, so the slideshow has nothing
        // to show. Still a real masthead rather than a spinner that never ends.
        <section className="flex min-h-[560px] items-center justify-center bg-black px-6 py-24 text-center">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conciencia-logo.png"
              alt="Conciencia Inquieta"
              width={1010}
              height={430}
              className="mx-auto mb-8 h-24 w-auto md:h-32"
            />
            <p className="mx-auto max-w-xl text-lg text-white/60">
              Noticias que importan, conversaciones que faltan, reflexiones que
              sanan. Pronto publicaremos los primeros artículos.
            </p>
          </div>
        </section>
      )}

      <QuestionTicker />

      {/* Manifesto strip */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ci-ink">
              <Sparkles className="h-4 w-4 text-ci-orange" aria-hidden="true" />
              La conciencia despierta
            </span>
            <h2 className="mb-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-ci-ink md:text-6xl">
              No practicamos la neutralidad.
              <br />
              Practicamos la <span className="text-ci-orange">verdad</span>.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-ci-ink/70">
              Conciencia Inquieta es un diario digital autogestionado. Verdad con
              contexto, memoria y humanidad: amplificamos voces silenciadas,
              incomodamos al poder y apostamos por una conciencia colectiva que
              despierte reflexión, empatía y acción.
            </p>
            <Link
              href="/sobre-nosotras"
              className="mt-8 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-all hover:gap-3"
            >
              Quiénes somos
              <ArrowRight className="h-4 w-4 text-ci-orange" aria-hidden="true" />
            </Link>
          </div>

          <div className="md:col-span-5">
            <div className="relative">
              <div
                className="absolute -left-4 -top-4 h-full w-full rotate-3 bg-ci-purple"
                aria-hidden="true"
              />
              <div className="relative -rotate-2 bg-ci-orange p-8">
                <Megaphone
                  className="mb-4 h-10 w-10 text-ci-ink"
                  aria-hidden="true"
                />
                <p className="mb-2 font-display text-3xl font-bold leading-tight text-ci-ink">
                  Sin dueños ni anunciantes
                </p>
                <p className="text-sm text-ci-ink/75">
                  Nos sostiene quien nos lee. Por eso podemos contar de qué lado
                  está el poder y de qué lado, la gente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest */}
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="mb-10 flex items-end justify-between gap-4 border-b-2 border-ci-ink/10 pb-4">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ci-ink md:text-5xl">
            Lo más reciente
          </h2>
          <Link
            href="/articulos"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-ci-ink transition-all hover:gap-3"
          >
            Ver todos
            <ArrowRight className="h-4 w-4 text-ci-orange" aria-hidden="true" />
          </Link>
        </div>

        {latest.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-ci-ink/50">Todavía no hay artículos publicados.</p>
        )}
      </section>

      {/* Explore by category */}
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <h2 className="mb-8 font-display text-2xl font-extrabold tracking-tight text-ci-ink md:text-3xl">
          Explora por tema
        </h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className="rounded-full bg-ci-ink/5 px-5 py-2.5 text-sm font-bold text-ci-ink transition-colors hover:bg-ci-purple"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="relative overflow-hidden bg-ci-purple py-24">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <span className="absolute -right-20 -top-20 block h-1 w-60 -rotate-45 bg-ci-orange" />
          <span className="absolute -right-10 top-40 block h-1 w-40 -rotate-45 bg-ci-ink/20" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="mb-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-ci-ink md:text-6xl">
            ¿Tu mente no para de
            <span className="block text-ci-orange">preguntar?</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-ci-ink/70">
            Suscríbete y recibe lo nuevo directamente en tu correo, sin
            algoritmos de por medio.
          </p>
          <div className="mx-auto max-w-lg text-left">
            <Suspense fallback={null}>
              <SubscribeForm source="home" variant="purple" />
            </Suspense>
          </div>
          <div className="mt-8">
            <SecondaryChannelButton />
          </div>
        </div>
      </section>
    </>
  );
}
