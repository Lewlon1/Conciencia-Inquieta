"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// Cookieless analytics (Plausible/Umami) loads unconditionally — no cookies/PII,
// no consent needed. Meta Pixel is consent-gated: fbq is NEVER loaded until the
// visitor accepts (or has already accepted). Everything no-ops gracefully if the
// corresponding env var is unset.
const PROVIDER = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "plausible";
const ANALYTICS_DOMAIN = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CONSENT_KEY = "ci_consent";

function loadPixel(pixelId: string) {
  if (window.fbq) return;
  const queue: unknown[][] = [];
  const fbq = ((...args: unknown[]) => {
    fbq.queue.push(args);
  }) as ((...args: unknown[]) => void) & { queue: unknown[][] };
  fbq.queue = queue;
  window.fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

export default function Analytics() {
  const [showBanner, setShowBanner] = useState(false);

  // ciTrack + delegated [data-event] click tracking (runs once).
  useEffect(() => {
    window.ciTrack = (event, props) => {
      try {
        window.plausible?.(event, { props: props || {} });
        window.umami?.track(event, props || {});
      } catch {
        /* analytics must never break the page */
      }
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-event]");
      if (!el) return;
      const { event, ...props } = el.dataset;
      if (event) window.ciTrack?.(event, props as Record<string, string>);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Consent gate for the Meta Pixel.
  useEffect(() => {
    let consent: string | null = null;
    try {
      consent = localStorage.getItem(CONSENT_KEY);
    } catch {
      /* private browsing — banner just reappears next visit */
    }
    if (consent === "granted") {
      if (PIXEL_ID) loadPixel(PIXEL_ID);
      return;
    }
    if (consent === "denied" || !PIXEL_ID) return; // nothing to ask consent for
    setShowBanner(true);
  }, []);

  function persistConsent(value: "granted" | "denied") {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
  }

  function accept() {
    persistConsent("granted");
    if (PIXEL_ID) loadPixel(PIXEL_ID);
    setShowBanner(false);
  }

  function reject() {
    persistConsent("denied");
    setShowBanner(false);
  }

  return (
    <>
      {PROVIDER === "plausible" && ANALYTICS_DOMAIN && (
        <Script
          strategy="afterInteractive"
          data-domain={ANALYTICS_DOMAIN}
          src="https://plausible.io/js/script.pageview-props.tagged-events.js"
        />
      )}
      {PROVIDER === "umami" && ANALYTICS_DOMAIN && (
        <Script
          strategy="afterInteractive"
          data-website-id={ANALYTICS_DOMAIN}
          src="https://cloud.umami.is/script.js"
        />
      )}

      {showBanner && (
        <div id="consent-banner" className="consent-banner">
          <p>
            Usamos analítica sin cookies para entender qué leéis. Con tu permiso,
            también usamos el Píxel de Meta para medir campañas — no se activa
            hasta que aceptes. <a href="/cookies">Más info</a>.
          </p>
          <div className="consent-actions">
            <button className="btn-line" type="button" onClick={reject}>
              Rechazar
            </button>
            <button className="btn-amber" type="button" onClick={accept}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
