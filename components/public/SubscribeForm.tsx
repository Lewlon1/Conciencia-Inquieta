"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Free MailerLite email-list signup — CI's own audience, double opt-in.
// POST /api/suscribir redirects back to /unete?ok=1|0&source=... . This page
// is statically rendered, so the success/error state is read client-side from
// the query string (via useSearchParams — the component MUST be wrapped in
// <Suspense> by its page, else it forces the page dynamic). Also fires the
// `signup` analytics event on success.
interface Props {
  source: string;
  dark?: boolean;
}

export default function SubscribeForm({ source, dark = false }: Props) {
  const params = useSearchParams();
  const ok = params.get("ok");
  const succeeded = ok === "1";
  const errored = ok === "0";

  useEffect(() => {
    if (succeeded) {
      window.ciTrack?.("signup", { source: params.get("source") || "unknown" });
    }
  }, [succeeded, params]);

  if (succeeded) {
    return (
      <div className="subscribe-block">
        <div className="success">
          <div className="tick">✓</div>
          <h3>¡Ya estás en la lista!</h3>
          <p>
            Gracias por suscribirte. Te escribiremos pronto con lo nuevo de
            Conciencia Inquieta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscribe-block">
      <form className="subscribe-form" action="/api/suscribir" method="post">
        <div className="row">
          <input
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.com"
            aria-label="Email"
            required
          />
          <button className="btn-amber" type="submit">
            Únete →
          </button>
        </div>
        <input type="hidden" name="source" value={source} />
        {errored && (
          <p className="note error">
            No hemos podido procesar tu suscripción. Inténtalo de nuevo.
          </p>
        )}
        <p className="legal" style={dark ? undefined : { color: "var(--muted)" }}>
          Un email a la semana, como mucho. Cancela cuando quieras. Nunca
          compartimos tu dirección.
        </p>
      </form>
    </div>
  );
}
