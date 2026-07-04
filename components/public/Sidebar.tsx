"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { key: "home", href: "/", icon: "◎", label: "Portada" },
  { key: "articulos", href: "/articulos", icon: "✎", label: "Artículos" },
  { key: "sobre-nosotras", href: "/sobre-nosotras", icon: "❋", label: "Sobre nosotras" },
  { key: "contacto", href: "/contacto", icon: "✉", label: "Contacto" },
] as const;

function isActive(key: string, pathname: string): boolean {
  if (key === "home") return pathname === "/";
  if (key === "articulos")
    return pathname.startsWith("/articulos") || pathname.startsWith("/categoria");
  return pathname === `/${key}`;
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" id="sidebar" aria-label="Navegación principal">
      <Link className="brand" href="/" aria-label="Conciencia Inquieta — inicio">
        <span className="mark">C</span>
        <span className="wm">
          <b>Conciencia</b>
          <i>Inquieta</i>
        </span>
      </Link>
      <button
        className="collapse-btn"
        id="collapseBtn"
        title="Contraer menú"
        aria-label="Contraer menú"
      >
        ‹
      </button>
      <nav className="nav">
        <span className="nav-label">Secciones</span>
        {navLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={isActive(link.key, pathname) ? "active" : ""}
          >
            <span className="ico">{link.icon}</span>
            <span className="t">{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <Link className="side-cta" href="/unete" data-event="cta_click" data-cta="sidebar_unete">
          <span>Únete</span>
        </Link>
        <div className="socials" aria-label="Redes sociales">
          <a href="#" title="Instagram">◈</a>
          <a href="#" title="X">✕</a>
          <a href="#" title="TikTok">♪</a>
          <Link href="/unete" title="Boletín">✦</Link>
        </div>
      </div>
    </aside>
  );
}
