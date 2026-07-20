"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// First-party, cookieless analytics. window.ciTrack beacons every event to our
// own /api/track sink (see lib/analytics + migration 0011) — no cookies/PII, no
// consent needed. The Plausible/Umami hooks below stay for optional external
// use but are dormant unless a provider is provisioned. Meta Pixel is
// consent-gated: fbq is NEVER loaded until the visitor accepts. Everything
// no-ops gracefully if the corresponding env var is unset.
const PROVIDER = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "plausible";
const ANALYTICS_DOMAIN = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CONSENT_KEY = "ci_consent";
// Kill switch: set NEXT_PUBLIC_ANALYTICS_INGEST=off to stop first-party beacons.
const INGEST_ON = process.env.NEXT_PUBLIC_ANALYTICS_INGEST !== "off";

// Article/service/category slug from the current path, so pageviews on those
// pages carry a slug too (article_read already passes its own).
function currentSlug(): string | undefined {
  const m = window.location.pathname.match(/^\/(?:articulos|servicios|categoria)\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

function readUtm() {
  const p = new URLSearchParams(window.location.search);
  const source = p.get("utm_source") || undefined;
  const medium = p.get("utm_medium") || undefined;
  const campaign = p.get("utm_campaign") || undefined;
  if (!source && !medium && !campaign) return undefined;
  return { source, medium, campaign };
}

// Fire-and-forget beacon to the first-party sink. sendBeacon survives page
// unload (important for click/navigation events); falls back to keepalive fetch.
// Wrapped so analytics can never throw into the page.
function beacon(name: string, props?: Record<string, string>) {
  if (!INGEST_ON || typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      name,
      path: window.location.pathname,
      slug: props?.slug || currentSlug(),
      referrer: document.referrer || undefined,
      utm: readUtm(),
      props,
    });
    // sendBeacon returns false when the UA refuses to queue (payload too large,
    // queue full) — and is absent on older browsers. In both cases fall back to a
    // keepalive fetch so the event isn't silently dropped.
    const blob = new Blob([payload], { type: "application/json" });
    const queued = navigator.sendBeacon?.("/api/track", blob) ?? false;
    if (!queued) {
      void fetch("/api/track", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the page */
  }
}

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
  const pathname = usePathname();

  // ciTrack + delegated [data-event] click tracking (runs once).
  useEffect(() => {
    window.ciTrack = (event, props) => {
      // First-party sink first (always on), then the optional/dormant providers.
      beacon(event, props);
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

  // First-party pageview on first load and every client-side route change.
  useEffect(() => {
    beacon("pageview");
  }, [pathname]);

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
