import Link from "next/link";
import { Mail } from "lucide-react";
import { SOCIAL, MAILTO } from "@/config/social";
import { InstagramIcon, FacebookGlyph } from "@/components/public/BrandIcons";

// Black footer with the oversized scrolling wordmark behind it. The newsletter
// field is a real POST to /api/suscribir (no-JS-safe form action, same as the
// rest of the capture surfaces) — not the inert input the source design had.
//
// The marquee animates to translateX(-50%), so the two spans below MUST stay
// identical for the loop to be seamless.

const MARQUEE =
  "CONCIENCIA INQUIETA • NOTICIAS QUE IMPORTAN • CONVERSACIONES QUE FALTAN • REFLEXIONES QUE SANAN • ";

// The social row below is the "add them back once CI's accounts exist" case
// the old footer's placeholder icons were removed for — these are real
// destinations from config/social.ts, not href="#". No X or TikTok: CI has
// neither account, and that's still the rule.
//
// This footer renders inside the public layout, so it IS the "at the bottom of
// every page" surface Marie asked for.

const SOCIAL_PILL =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-ci-orange hover:text-ci-ink";

export default function MarqueeFooter() {
  const year = new Date().getFullYear();
  const repeated = MARQUEE.repeat(3);

  return (
    <footer className="on-dark relative overflow-hidden bg-black">
      <div
        className="overflow-hidden border-b border-white/10 py-16"
        aria-hidden="true"
      >
        <div className="marquee-track">
          <span className="whitespace-nowrap pr-8 font-heading text-[8vw] font-black leading-none text-ci-purple/[0.06]">
            {repeated}
          </span>
          <span className="whitespace-nowrap pr-8 font-heading text-[8vw] font-black leading-none text-ci-purple/[0.06]">
            {repeated}
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 px-6 py-16 md:grid-cols-3 md:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conciencia-logo.png"
            alt="Conciencia Inquieta"
            width={1010}
            height={430}
            className="mb-4 h-16 w-auto"
          />
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            Diario digital autogestionado. No practicamos la neutralidad, sino la
            verdad con contexto, memoria y humanidad.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">
              Navegación
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/", label: "Portada" },
                { href: "/articulos", label: "Artículos" },
                { href: "/servicios", label: "Servicios" },
                { href: "/sobre-nosotras", label: "Sobre nosotras" },
                { href: "/contacto", label: "Contacto" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/60 transition-colors hover:text-ci-orange"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/privacidad", label: "Aviso legal & privacidad" },
                { href: "/cookies", label: "Cookies" },
                { href: "/terminos", label: "Términos" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/60 transition-colors hover:text-ci-orange"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white">
            Boletín
          </h4>
          <p className="mb-4 text-sm leading-relaxed text-white/60">
            Las conversaciones que faltan, en tu correo.
          </p>
          <form action="/api/suscribir" method="post" className="flex gap-2">
            <label htmlFor="footer-email" className="sr-only">
              Email para el boletín
            </label>
            <input
              id="footer-email"
              type="email"
              name="email"
              required
              placeholder="tu@email.com"
              className="min-w-0 flex-1 rounded-full border-2 border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 transition-colors focus:border-ci-orange focus:outline-none"
            />
            <input type="hidden" name="source" value="footer" />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ci-orange px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-ci-ink transition-colors hover:bg-ci-purple"
            >
              Unirme
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className={SOCIAL_PILL}
            >
              <InstagramIcon className="h-4 w-4" />
              <span className="sr-only">Síguenos en Instagram</span>
            </a>
            <a
              href={SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              className={SOCIAL_PILL}
            >
              <FacebookGlyph className="text-lg" />
              <span className="sr-only">Síguenos en Facebook</span>
            </a>
            <a href={MAILTO} title={SOCIAL.email} className={SOCIAL_PILL}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Escríbenos a {SOCIAL.email}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 text-center md:px-8">
        <p className="text-xs text-white/40">
          © {year} Conciencia Inquieta · Hecho con conciencia
        </p>
      </div>
    </footer>
  );
}
