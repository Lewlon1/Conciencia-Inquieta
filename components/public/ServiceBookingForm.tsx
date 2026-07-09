"use client";

import { useSearchParams } from "next/navigation";

// POST /api/reservar redirects back to /servicios/<slug>?ok=1|0, read
// client-side (the detail page is statically rendered, so the query string
// only exists at request time in the browser). Field names MUST stay
// nombre/email/telefono/mensaje/servicio/servicio_titulo — the route handler
// maps them to service_bookings columns name/email/phone/message/
// service_id/service_title.
export default function ServiceBookingForm({
  serviceId,
  serviceTitle,
  slug,
}: {
  serviceId: string;
  serviceTitle: string;
  slug: string;
}) {
  const params = useSearchParams();
  const ok = params.get("ok");

  if (ok === "1") {
    return (
      <div className="success">
        <div className="tick">✓</div>
        <h3>Solicitud enviada</h3>
        <p>
          Gracias por tu interés. Marie se pondrá en contacto contigo pronto para
          concretar los detalles.
        </p>
      </div>
    );
  }

  return (
    <form className="form" action="/api/reservar" method="post">
      <input type="hidden" name="servicio" value={serviceId} />
      <input type="hidden" name="servicio_titulo" value={serviceTitle} />
      <input type="hidden" name="slug" value={slug} />
      <div className="field">
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          placeholder="Tu nombre"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="telefono">Teléfono</label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          placeholder="+34 600 000 000"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="mensaje">Mensaje (opcional)</label>
        <textarea
          id="mensaje"
          name="mensaje"
          placeholder="Cuéntanos qué necesitas o cuándo te viene bien…"
        />
      </div>
      {ok === "0" && (
        <p className="note error">
          No hemos podido enviar tu solicitud. Revisa los datos e inténtalo de
          nuevo.
        </p>
      )}
      <button className="btn-amber" type="submit">
        Solicitar reserva →
      </button>
    </form>
  );
}
