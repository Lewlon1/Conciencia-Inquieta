import type { Metadata } from "next";
import ServiceCard from "@/components/public/ServiceCard";
import { getPublishedServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Servicios — Conciencia Inquieta",
  description:
    "Acompañamiento, colaboraciones y servicios de Conciencia Inquieta. Solicita una reserva y hablamos.",
  path: "/servicios",
});

export default async function ServiciosPage() {
  const services = await getPublishedServices();

  return (
    <>
      <div className="wrap page-intro">
        <div className="kicker">Trabaja con nosotras</div>
        <h1>Servicios</h1>
        <p>
          Acompañamiento, colaboraciones y propuestas a medida. Elige lo que
          necesitas y cuéntanos: Marie se pondrá en contacto contigo.
        </p>
      </div>
      <div className="wrap section">
        {services.length > 0 ? (
          <div className="grid">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--muted)",
              fontFamily: "var(--read)",
              fontStyle: "italic",
            }}
          >
            Pronto anunciaremos nuestros servicios. Mientras tanto, puedes
            escribirnos desde la página de contacto.
          </p>
        )}
      </div>
    </>
  );
}
