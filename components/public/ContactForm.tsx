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

// POST /api/contacto redirects back to /contacto?ok=1|0, read client-side.
// Field names MUST stay nombre/email/asunto/mensaje — the route handler maps
// them to contact_messages columns name/email/subject/message.

export default function ContactForm() {
  const params = useSearchParams();
  const ok = params.get("ok");

  if (ok === "1") {
    return (
      <div className="rounded-3xl bg-ci-purple/30 p-10 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ci-orange">
          <Send className="h-7 w-7 text-ci-ink" aria-hidden="true" />
        </span>
        <p className="font-display text-xl font-bold text-ci-ink">
          ¡Mensaje enviado!
        </p>
        <p className="mt-2 text-sm text-ci-ink/60">
          Gracias por escribir. Te responderemos pronto.
        </p>
      </div>
    );
  }

  return (
    <form action="/api/contacto" method="post" className="max-w-2xl space-y-5">
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
        <label htmlFor="asunto" className={fieldLabel}>
          Asunto
        </label>
        <select id="asunto" name="asunto" className={fieldInput}>
          <option>Colaboración editorial</option>
          <option>Prensa y medios</option>
          <option>Otro</option>
        </select>
      </div>
      <div>
        <label htmlFor="mensaje" className={fieldLabel}>
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          placeholder="Cuéntanos…"
          className={fieldTextarea}
        />
      </div>

      {ok === "0" && (
        <p className={errorNote}>
          No hemos podido enviar tu mensaje. Inténtalo de nuevo o escríbenos
          directamente.
        </p>
      )}

      <button type="submit" className={submitButton}>
        Enviar mensaje
      </button>
    </form>
  );
}
