"use client";

import { useSearchParams } from "next/navigation";

// POST /api/contacto redirects back to /contacto?ok=1|0, read client-side.
// Field names MUST stay nombre/email/asunto/mensaje — the route handler maps
// them to contact_messages columns name/email/subject/message.
export default function ContactForm() {
  const params = useSearchParams();
  const ok = params.get("ok");

  if (ok === "1") {
    return (
      <div className="success">
        <div className="tick">✓</div>
        <h3>Mensaje enviado</h3>
        <p>Gracias por escribir. Te responderemos pronto.</p>
      </div>
    );
  }

  return (
    <form className="form" action="/api/contacto" method="post">
      <div className="field">
        <label htmlFor="nombre">Nombre</label>
        <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" required />
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
        <label htmlFor="asunto">Asunto</label>
        <select id="asunto" name="asunto">
          <option>Colaboración editorial</option>
          <option>Prensa y medios</option>
          <option>Otro</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="mensaje">Mensaje</label>
        <textarea id="mensaje" name="mensaje" placeholder="Cuéntanos…" required />
      </div>
      {ok === "0" && (
        <p className="note error">
          No hemos podido enviar tu mensaje. Inténtalo de nuevo o escríbenos
          directamente.
        </p>
      )}
      <button className="btn-amber" type="submit">
        Enviar mensaje →
      </button>
    </form>
  );
}
