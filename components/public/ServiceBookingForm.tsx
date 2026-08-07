"use client";

import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import {
  fieldLabel,
  fieldInput,
  fieldTextarea,
  submitButton,
  errorNote,
} from "@/components/public/formStyles";

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
      <div className="rounded-3xl bg-ci-purple/30 p-10 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ci-orange">
          <Send className="h-7 w-7 text-ci-ink" aria-hidden="true" />
        </span>
        <p className="font-display text-xl font-bold text-ci-ink">
          Solicitud enviada
        </p>
        <p className="mt-2 text-sm text-ci-ink/60">
          Gracias por tu interés. Maria Elisa se pondrá en contacto contigo
          pronto para concretar los detalles.
        </p>
      </div>
    );
  }

  return (
    <form action="/api/reservar" method="post" className="space-y-5">
      <input type="hidden" name="servicio" value={serviceId} />
      <input type="hidden" name="servicio_titulo" value={serviceTitle} />
      <input type="hidden" name="slug" value={slug} />

      <div>
        <label htmlFor="nombre" className={fieldLabel}>
          Nombre
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          required
          placeholder="Tu nombre"
          className={fieldInput}
        />
      </div>
      <div>
        <label htmlFor="email" className={fieldLabel}>
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="tucorreo@ejemplo.com"
          className={fieldInput}
        />
      </div>
      <div>
        <label htmlFor="telefono" className={fieldLabel}>
          Teléfono
        </label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          required
          placeholder="+34 600 000 000"
          className={fieldInput}
        />
      </div>
      <div>
        <label htmlFor="mensaje" className={fieldLabel}>
          Mensaje (opcional)
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          placeholder="Cuéntanos qué necesitas o cuándo te viene bien…"
          className={fieldTextarea}
        />
      </div>

      {ok === "0" && (
        <p className={errorNote}>
          No hemos podido enviar tu solicitud. Revisa los datos e inténtalo de
          nuevo.
        </p>
      )}

      <button type="submit" className={submitButton}>
        Solicitar reserva
      </button>
    </form>
  );
}
