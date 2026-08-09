import type { Metadata } from "next";
import Link from "next/link";
import ServiceCard from "@/components/public/ServiceCard";
import PageHero from "@/components/public/PageHero";
import { getPublishedServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Servicios — Conciencia Inquieta",
  description:
    "Acompañamiento, colaboraciones y servicios de Conciencia Inquieta. Solicita una reserva y hablamos.",
  path: "/servicios",
});

const PROCESS = [
  { num: "01", title: "Conversamos", desc: "Entendemos qué necesitas y por qué." },
  { num: "02", title: "Diseñamos", desc: "Preparamos una propuesta a tu medida." },
  { num: "03", title: "Lo hacemos", desc: "Ejecución, entrega y seguimiento." },
];

export default async function ServiciosPage() {
  const services = await getPublishedServices();

  return (
    <div className="relative">
      <PageHero
        kicker="Trabaja con nosotras"
        title={
          <>
            Ponemos ideas en movimiento.{" "}
            <span className="text-ci-orange">Trabajemos juntas</span>
          </>
        }
        lead="¿Tienes una idea? Nosotras te ayudamos a darle forma. Creación de contenido, asesoría, escritura, talleres y colaboraciones a medida. Cuéntanos qué necesitas y hablemos."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-24">
        {services.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-ci-purple/25 px-8 py-16 text-center">
            <p className="font-display text-2xl font-bold text-ci-ink">
              Pronto anunciaremos nuestros servicios.
            </p>
            <p className="mx-auto mt-3 max-w-md text-ci-ink/60">
              Mientras tanto, escríbenos y hablamos de lo que necesitas.
            </p>
            <Link
              href="/contacto"
              className="mt-8 inline-flex rounded-full bg-ci-ink px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-ci-orange hover:text-ci-ink"
            >
              Contacto
            </Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PROCESS.map((step) => (
            <div key={step.num} className="text-center">
              <span className="mb-2 block font-heading text-7xl font-black text-ci-purple/60">
                {step.num}
              </span>
              <h3 className="mb-2 font-display text-xl font-bold text-ci-ink">
                {step.title}
              </h3>
              <p className="text-sm text-ci-ink/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Floating CTA — the design's "Consulta Inquieta" button, wired to the
          real contact page instead of the source's fake setTimeout drawer. */}
      <Link
        href="/contacto"
        data-event="cta_click"
        data-cta="servicios_floating"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-ci-orange px-6 py-4 font-display text-sm font-bold uppercase tracking-wide text-ci-ink shadow-2xl transition-transform hover:scale-105"
      >
        <span
          aria-hidden="true"
          className="block h-2 w-2 animate-pulse rounded-full bg-ci-ink"
        />
        Consulta inquieta
      </Link>
    </div>
  );
}
