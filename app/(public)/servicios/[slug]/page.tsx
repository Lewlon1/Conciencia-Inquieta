import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FocalImage from "@/components/public/FocalImage";
import ServiceBookingForm from "@/components/public/ServiceBookingForm";
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

      <div className="wrap page-intro">
        <div className="kicker">
          <Link href="/servicios">Servicios</Link>
        </div>
        <h1>{service.title}</h1>
        {service.summary && <p>{service.summary}</p>}
        {service.price_text && (
          <div className="price-line">{service.price_text}</div>
        )}
      </div>

      <div className="wrap section">
        <div className="service-detail">
          {cover && (
            <div className="ph service-hero">
              <FocalImage
                src={cover}
                alt={service.image_alt || service.title}
                focalX={service.focal_x}
                focalY={service.focal_y}
                focalZoom={service.focal_zoom}
              />
            </div>
          )}

          {rest.length > 0 && (
            <div className="service-gallery">
              {rest.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt={service.image_alt || service.title}
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
      </div>

      <div className="wrap section">
        <div className="service-book" id="reservar">
          <div className="kicker">Reserva</div>
          <h2>Solicita este servicio</h2>
          <p className="service-book-lead">
            Déjanos tu nombre, email y teléfono y Marie te contactará para
            concretar los detalles. Sin compromiso.
          </p>
          <Suspense fallback={null}>
            <ServiceBookingForm
              serviceId={service.id}
              serviceTitle={service.title}
              slug={service.slug}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
