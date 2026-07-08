import Link from "next/link";

// Server component. #hamb is wired by NavOverlay (by id) exactly like the
// original inline script; the data-event attr is picked up by Analytics'
// delegated click handler. Layout mirrors the reference masthead: burger on
// the left, centered wordmark logo, subscribe CTA on the right.
export default function Topbar() {
  return (
    <header className="topbar">
      <button className="hamb" id="hamb" aria-label="Abrir menú">
        ≡
      </button>
      <Link
        className="top-brand"
        href="/"
        aria-label="Conciencia Inquieta — inicio"
      >
        <img
          className="top-logo"
          src="/conciencia-logo.png"
          alt="Conciencia Inquieta"
          width={1010}
          height={430}
        />
      </Link>
      <div className="top-actions">
        <Link
          className="tbtn solid"
          href="/unete"
          data-event="cta_click"
          data-cta="topbar_unete"
        >
          Suscríbete
        </Link>
      </div>
    </header>
  );
}
