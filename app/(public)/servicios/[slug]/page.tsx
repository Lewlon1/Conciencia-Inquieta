import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import FocalImage from "@/components/public/FocalImage";
import ServiceBookingForm from "@/components/public/ServiceBookingForm";
import PageHero from "@/components/public/PageHero";
import { getPublishedServices, getServiceBySlug } from "@/lib/content";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";

// ISR + on-demand, same contract as articles: known slugs are built now and
// regenerated ~1 min after an edit; a slug published later renders on first
// request (dynamicParams defaults to true); junk slugs hit notFound() → 404.
export const revalidate = 60;

export async function generateStaticParams() {
  const services = await getPublishedServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return pageMetadata({
    title: `${service.title} — Servicios — Conciencia Inquieta`,
    description: service.summary || `Servicio de ${SITE_NAME}: ${service.title}.`,
    path: `/servicios/${service.slug}`,
    images: service.image_urls?.[0] ? [service.image_urls[0]] : undefined,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [cover, ...rest] = service.image_urls ?? [];
  const canonical = new URL(`/servicios/${service.slug}`, SITE_URL).toString();

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary || undefined,
    image: cover || undefined,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    url: canonical,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <PageHero kicker="Servicios" title={service.title} lead={service.summary}>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {service.price_text && (
            <span className="rounded-full bg-ci-orange px-5 py-2 font-display font-bold text-ci-ink">
              {service.price_text}
            </span>
          )}
          <a
            href="#reservar"
            data-event="cta_click"
            data-cta="service_hero_reservar"
            className="rounded-full bg-ci-purple px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-colors hover:bg-white"
          >
            Solicitar reserva
          </a>
        </div>
      </PageHero>

      {cover && (
        <div className="bg-black">
          <div className="mx-auto aspect-[16/9] max-w-5xl overflow-hidden md:aspect-[2/1]">
            <FocalImage
              src={cover}
              alt={service.image_alt || service.title}
              focalX={service.focal_x}
              focalY={service.focal_y}
              focalZoom={service.focal_zoom}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[var(--maxread)] px-6 py-16 md:px-8">
        {rest.length > 0 && (
          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rest.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${i}`}
                src={url}
                alt={service.image_alt || service.title}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}

        {service.description && (
          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {service.description}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <section id="reservar" className="bg-ci-purple/25 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-[var(--maxread)] rounded-3xl bg-white p-8 md:p-10">
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-wider text-ci-orange">
            Reserva
          </span>
          <h2 className="mb-3 font-heading text-3xl font-bold leading-tight tracking-tight text-ci-ink md:text-4xl">
            Solicita este servicio
          </h2>
          <p className="mb-8 max-w-xl text-ci-ink/70">
            Déjanos tu nombre, email y teléfono y Maria Elisa te contactará
            para concretar los detalles. Sin compromiso.
          </p>
          <Suspense fallback={null}>
            <ServiceBookingForm
              serviceId={service.id}
              serviceTitle={service.title}
              slug={service.slug}
            />
          </Suspense>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <Link
          href="/servicios"
          className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-all hover:gap-3"
        >
          <ArrowLeft className="h-4 w-4 text-ci-orange" aria-hidden="true" />
          Todos los servicios
        </Link>
      </div>
    </>
  );
}
