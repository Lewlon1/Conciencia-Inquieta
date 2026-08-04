"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Newspaper, Users, Briefcase, Mail, Brain } from "lucide-react";
import type { Category } from "@/types";

// Desktop-only nav rail: 72px of black, expanding to 280px on hover/focus.
// Below md it's hidden entirely and MobileNav takes over — hover is not a
// gesture that exists on touch, and a 72px rail eats a fifth of a phone.
// The collapsed width is mirrored by --rail in public.css.
//
// No AnimatePresence anywhere in here — see the note in MobileNav.tsx: exits
// were observed not to unmount in this stack, which would leave the expanded
// labels and category list stranded inside the 72px rail. Enter-only.

export const NAV_ITEMS = [
  { key: "home", href: "/", label: "Portada", icon: Home },
  { key: "articulos", href: "/articulos", label: "Artículos", icon: Newspaper },
  { key: "servicios", href: "/servicios", label: "Servicios", icon: Briefcase },
  {
    key: "sobre-nosotras",
    href: "/sobre-nosotras",
    label: "Sobre nosotras",
    icon: Users,
  },
  { key: "contacto", href: "/contacto", label: "Contacto", icon: Mail },
] as const;

export function isActive(key: string, pathname: string): boolean {
  if (key === "home") return pathname === "/";
  if (key === "articulos")
    return pathname.startsWith("/articulos") || pathname.startsWith("/categoria");
  if (key === "servicios") return pathname.startsWith("/servicios");
  return pathname === `/${key}`;
}

export default function Sidebar({ categories }: { categories: Category[] }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(e) => {
        // Only collapse once focus has genuinely left the rail, otherwise
        // tabbing between links would slam it shut mid-traversal.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setExpanded(false);
      }}
      initial={false}
      animate={{ width: expanded ? 280 : 72 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="on-dark fixed left-0 top-0 z-50 hidden h-screen flex-col overflow-hidden bg-black md:flex"
      aria-label="Navegación principal"
    >
      <div className="flex h-20 shrink-0 items-center overflow-hidden border-b border-white/10 px-3">
        <Link
          href="/"
          className="flex w-full items-center gap-3"
          aria-label="Conciencia Inquieta — portada"
        >
          {expanded ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/conciencia-logo.png"
              alt="Conciencia Inquieta"
              width={1010}
              height={430}
              className="h-12 w-auto max-w-none"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">
              <Brain className="h-7 w-7 text-ci-orange" aria-hidden="true" />
            </span>
          )}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto py-6">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.key, pathname);
          return (
            <Link key={item.key} href={item.href} className="group/nav relative">
              <span className="flex items-center gap-3 px-5 py-3">
                {active && (
                  <motion.span
                    layoutId="ci-active-pill"
                    className="absolute left-2 h-8 w-8 rounded-full bg-ci-purple"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                {/* The pill sits behind the ICON only, so only the icon gets
                    ink. An active label is still on black — colouring it ink
                    too (as the source design did) makes it unreadable. */}
                <item.icon
                  className={`relative z-10 h-5 w-5 shrink-0 transition-colors ${
                    active ? "text-ci-ink" : "text-white/60 group-hover/nav:text-white"
                  }`}
                  aria-hidden="true"
                />
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`relative z-10 whitespace-nowrap font-display text-base font-bold transition-colors ${
                      active
                        ? "text-ci-purple"
                        : "text-white/60 group-hover/nav:text-white"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </span>
            </Link>
          );
        })}

        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 border-t border-white/10 px-5 pt-5"
          >
              <p className="mb-3 text-[0.68rem] uppercase tracking-[0.16em] text-ci-orange">
                Secciones
              </p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/categoria/${c.slug}`}
                      className={`block whitespace-nowrap py-1 text-sm transition-colors hover:text-white ${
                        pathname === `/categoria/${c.slug}`
                          ? "text-ci-purple"
                          : "text-white/50"
                      }`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
          </motion.div>
        )}
      </nav>

      <div className="shrink-0 px-3 pb-6">
        {expanded ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
              href="/unete"
              data-event="cta_click"
              data-cta="sidebar_unete"
              className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-ci-orange px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-ci-ink transition-colors hover:bg-ci-purple"
            >
              Únete
            </Link>
          </motion.div>
        ) : (
          <div className="flex justify-center">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="block h-6 w-6 rounded-full border-2 border-white/20 border-t-ci-orange"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
