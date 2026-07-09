import Link from "next/link";
import type { Service } from "@/types";

// Server component. Mirrors ArticleCard's structure so it reuses the public
// design-system card classes (.card/.ph/.body/.meta), with a price line and a
// booking CTA specific to services.
export default function ServiceCard({ service }: { service: Service }) {
  const href = `/servicios/${service.slug}`;
  const cover = service.image_urls?.[0];

  return (
    <Link className="card service-card" href={href}>
      <div className="ph service-ph">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={service.image_alt || service.title} />
        ) : (
          <span className="glyph">✦</span>
        )}
      </div>
      <div className="body">
        <h3>{service.title}</h3>
        {service.summary && <p>{service.summary}</p>}
        <div className="service-foot">
          {service.price_text && (
            <span className="price-tag">{service.price_text}</span>
          )}
          <span className="service-cta">Reservar →</span>
        </div>
      </div>
    </Link>
  );
}
