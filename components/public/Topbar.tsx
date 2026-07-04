import Link from "next/link";

// Server component. #hamb is wired by NavOverlay (by id) exactly like the
// original inline script; the data-event attr is picked up by Analytics'
// delegated click handler.
export default function Topbar() {
  return (
    <header className="topbar">
      <button className="hamb" id="hamb" aria-label="Abrir menú">
        ≡
      </button>
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
