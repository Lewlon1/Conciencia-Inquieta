"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

// Free email-list signup — CI's own audience. POST /api/suscribir redirects
// back with ?ok=1|0&source=… . These pages are statically rendered, so the
// result is read client-side from the query string (via useSearchParams — the
// component MUST be wrapped in <Suspense> by its page, else it forces the page
// dynamic). Fires the `signup` analytics event on success.

interface Props {
  source: string;
  /** "purple" sits on a pastel block, "light" on the white page. */
  variant?: "purple" | "light";
}

export default function SubscribeForm({ source, variant = "light" }: Props) {
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
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ci-orange">
          <Check className="h-7 w-7 text-ci-ink" aria-hidden="true" />
        </span>
        <p className="font-display text-xl font-bold text-ci-ink">
          ¡Ya estás en la lista!
        </p>
        <p className="mt-2 text-sm text-ci-ink/60">
          Gracias por suscribirte. Te escribiremos pronto con lo nuevo de
          Conciencia Inquieta.
        </p>
      </div>
    );
  }

  const onPurple = variant === "purple";

  return (
    <form action="/api/suscribir" method="post" className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`sub-${source}`} className="sr-only">
          Email
        </label>
        <input
          id={`sub-${source}`}
          type="email"
          name="email"
          required
          placeholder="tu@email.com"
          className={`min-w-0 flex-1 rounded-full px-5 py-4 text-ci-ink placeholder-ci-ink/40 focus:outline-none ${
            onPurple
              ? "border-0 bg-white"
              : "border-2 border-ci-ink/15 bg-white focus:border-ci-orange"
          }`}
        />
        <input type="hidden" name="source" value={source} />
        <button
          type="submit"
          data-event="cta_click"
          data-cta={`subscribe_${source}`}
          className={`whitespace-nowrap rounded-full px-6 py-4 font-display font-bold uppercase tracking-wide transition-colors ${
            onPurple
              ? "bg-ci-ink text-ci-purple hover:bg-ci-orange hover:text-ci-ink"
              : "bg-ci-orange text-ci-ink hover:bg-ci-purple"
          }`}
        >
          Suscribirme
        </button>
      </div>

      {errored && (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          No hemos podido procesar tu suscripción. Inténtalo de nuevo.
        </p>
      )}

      <p className={`mt-3 text-xs ${onPurple ? "text-ci-ink/60" : "text-ci-ink/50"}`}>
        Un email a la semana, como mucho. Cancela cuando quieras. Nunca
        compartimos tu dirección.
      </p>
    </form>
  );
}
