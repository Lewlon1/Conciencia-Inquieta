"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/types";

const navLinks = [
  { key: "home", href: "/", icon: "◎", label: "Portada" },
  { key: "articulos", href: "/articulos", icon: "✎", label: "Artículos" },
  { key: "servicios", href: "/servicios", icon: "✦", label: "Servicios" },
  { key: "sobre-nosotras", href: "/sobre-nosotras", icon: "❋", label: "Sobre nosotras" },
  { key: "contacto", href: "/contacto", icon: "✉", label: "Contacto" },
] as const;

function isActive(key: string, pathname: string): boolean {
  if (key === "home") return pathname === "/";
  if (key === "articulos")
    return pathname.startsWith("/articulos") || pathname.startsWith("/categoria");
  if (key === "servicios") return pathname.startsWith("/servicios");
  return pathname === `/${key}`;
}

interface Props {
  categories: Category[];
}

export default function Sidebar({ categories }: Props) {
  const pathname = usePathname();
  const [sectionsOpen, setSectionsOpen] = useState(false);

  // The mobile drawer reuses this same element (see NavOverlay); collapse
  // the categories sublist again each time it's closed so it doesn't reopen
  // pre-expanded next time.
  useEffect(() => {
    setSectionsOpen(false);
  }, [pathname]);

  return (
    <aside className="sidebar" id="sidebar" aria-label="Navegación principal">
      <Link className="brand" href="/" aria-label="Conciencia Inquieta — inicio">
        <img
          className="brand-logo"
          src="/conciencia-logo.png"
          alt="Conciencia Inquieta"
          width={1010}
          height={430}
        />
      </Link>
      <button
        className="mobile-close-btn"
        id="mobileCloseBtn"
        title="Cerrar menú"
        aria-label="Cerrar menú"
      >
        ×
      </button>
      <nav className="nav">
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={sectionsOpen}
          onClick={() => setSectionsOpen((o) => !o)}
        >
          <span>Secciones</span>
          <span className="chev">›</span>
        </button>
        {sectionsOpen && (
          <div className="nav-sub">
            {categories.map((c) => (
              <Link key={c.id} href={`/categoria/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </div>
        )}
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
        <div className="side-legal">
          <Link href="/privacidad">Aviso legal &amp; privacidad</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/terminos">Términos</Link>
        </div>
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
