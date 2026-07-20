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

  // Fire the `signup` event at most once per success. `succeeded` is derived from
  // the ?ok=1 query string, which survives reloads, bfcache restores and shared
  // links — without a guard each of those re-fires signup and inflates the single
  // headline conversion metric. A sessionStorage one-shot (keyed by placement)
  // makes a reload a no-op while still allowing a genuine new signup elsewhere.
  useEffect(() => {
    if (!succeeded) return;
    const src = params.get("source") || "unknown";
    const key = `ci_signup_fired:${src}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: no persistence — accept the rare reload double-fire */
    }
    window.ciTrack?.("signup", { source: src });
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
