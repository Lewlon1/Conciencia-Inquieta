import { Suspense } from "react";
import type { Metadata } from "next";
import { Scale, BookOpen, Users, Mail } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import SubscribeForm from "@/components/public/SubscribeForm";
import { InstagramIcon, FacebookGlyph } from "@/components/public/BrandIcons";
import { SOCIAL, MAILTO } from "@/config/social";
import { getPublicAuthors } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

// The team grid is driven by the `authors` table, not a hardcoded list — the
// source design shipped four invented journalists, which have no place on a
// real masthead. Placeholder rows are filtered out in getPublicAuthors(), so
// the section simply doesn't render until Marie adds real bios.
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Sobre nosotras — Conciencia Inquieta",
  description:
    "Conciencia Inquieta es un diario digital autogestionado que apuesta por la verdad con contexto, memoria y humanidad.",
  path: "/sobre-nosotras",
});

// Outline pill, matching SecondaryChannelButton's light variant — the site's
// established style for an external CTA on a white surface.
const SOCIAL_LINK =
  "inline-flex items-center gap-2 rounded-full border-2 border-ci-ink/20 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-colors hover:border-ci-orange hover:bg-ci-orange";

const VALUES = [
  {
    n: "01",
    Icon: Scale,
    title: "No neutrales",
    desc: "Tomamos partido por la dignidad. Contamos de qué lado está el poder y de qué lado, la gente.",
  },
  {
    n: "02",
    Icon: BookOpen,
    title: "Con memoria",
    desc: "Nombrar es un acto de justicia. Volvemos sobre lo que otros prefieren olvidar.",
  },
  {
    n: "03",
    Icon: Users,
    title: "En comunidad",
    desc: "Sin grandes dueños ni anunciantes. Nos sostienen quienes nos leen y nos acompañan.",
  },
];

export default async function SobreNosotrasPage() {
  const authors = await getPublicAuthors();

  return (
    <>
      <PageHero
        kicker="Quiénes somos"
        title={
          <>
            Somos la <span className="text-ci-orange">chispa</span>
            <br />
            que no se apaga.
          </>
        }
      />

      {/* Manifesto */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:px-8 md:py-24">
        <span className="mb-6 inline-block rounded-full bg-ci-orange/20 px-4 py-1 text-xs font-bold uppercase tracking-wider text-ci-ink">
          Nuestro manifiesto
        </span>
        <p className="mb-6 font-display text-2xl font-bold leading-tight text-ci-ink md:text-4xl">
          Nacimos de una convicción simple: el periodismo no debería ser pasivo.
        </p>
        <p className="mb-6 text-lg leading-relaxed text-ci-ink/70">
          Conciencia Inquieta es un diario digital autogestionado que nace desde
          la urgencia de pensar, sentir y actuar en un mundo atravesado por la
          desigualdad, la violencia y la manipulación informativa.
        </p>
        <p className="text-lg leading-relaxed text-ci-ink/70">
          No practicamos la neutralidad, sino la{" "}
          <strong className="font-bold text-ci-ink">
            verdad con contexto, memoria y humanidad
          </strong>
          . Amplificamos voces silenciadas, incomodamos al poder y apostamos por
          una conciencia colectiva que despierte reflexión, empatía y acción.
        </p>
      </section>

      {/* Values */}
      <section className="bg-ci-purple/25 px-6 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center font-display text-3xl font-extrabold tracking-tight text-ci-ink md:text-5xl">
            Lo que nos mueve
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {VALUES.map(({ n, Icon, title, desc }) => (
              <div
                key={n}
                className="rounded-3xl border-2 border-transparent bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-ci-purple"
              >
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-ci-orange">
                  <Icon className="h-6 w-6 text-ci-ink" aria-hidden="true" />
                </span>
                <p className="font-heading text-sm font-bold text-ci-orange">
                  {n}
                </p>
                <h3 className="mb-3 font-display text-xl font-bold text-ci-ink">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-ci-ink/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Síguenos — sits above the Team block so it still renders while
          `authors` is empty (that section is conditional). */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center md:px-8 md:py-24">
        <h2 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-ci-ink md:text-4xl">
          Síguenos
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-ci-ink/60">
          Publicamos a diario en redes y respondemos todos los correos.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={SOCIAL_LINK}
          >
            <InstagramIcon className="h-5 w-5" />
            Instagram
          </a>
          <a
            href={SOCIAL.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={SOCIAL_LINK}
          >
            <FacebookGlyph className="text-xl" />
            Facebook
          </a>
          <a href={MAILTO} className={`${SOCIAL_LINK} normal-case tracking-normal`}>
            <Mail className="h-5 w-5" aria-hidden="true" />
            {SOCIAL.email}
          </a>
        </div>
      </section>

      {/* Team — only once there are real bios to show */}
      {authors.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 md:px-8">
          <h2 className="mb-12 border-b-2 border-ci-ink/10 pb-4 font-display text-3xl font-extrabold tracking-tight text-ci-ink md:text-5xl">
            Las mentes detrás
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {authors.map((author) => (
              <div key={author.id} className="text-center">
                <div className="relative mb-4 inline-block">
                  {author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.avatar_url}
                      alt=""
                      className="h-28 w-28 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-28 w-28 items-center justify-center rounded-full bg-ci-purple font-heading text-3xl font-bold text-ci-ink">
                      {author.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 -right-1 block h-8 w-8 rounded-full border-4 border-white bg-ci-orange"
                  />
                </div>
                <h3 className="font-display text-lg font-bold text-ci-ink">
                  {author.name}
                </h3>
                {author.bio && (
                  <p className="mt-1 text-sm leading-relaxed text-ci-ink/55">
                    {author.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Subscribe */}
      <section className="bg-ci-purple px-6 py-24 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 font-heading text-4xl font-black leading-[1.05] tracking-tight text-ci-ink md:text-5xl">
            Súmate a la conciencia{" "}
            <span className="text-ci-orange">colectiva</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-ci-ink/70">
            Cada suscripción hace posible un periodismo libre, sensible y
            valiente.
          </p>
          <div className="mx-auto max-w-lg text-left">
            <Suspense fallback={null}>
              <SubscribeForm source="about" variant="purple" />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}
