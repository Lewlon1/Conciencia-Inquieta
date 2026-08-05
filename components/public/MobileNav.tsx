"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, isActive } from "@/components/public/Sidebar";
import type { Category } from "@/types";

// Below md, where the hover rail can't work: a black masthead plus a
// full-screen drawer. Replaces the old Topbar + NavOverlay pair (the drawer
// state lives in React now instead of being wired by element id).
//
// NO AnimatePresence / exit animation here, deliberately. Verified in this
// repo (framer-motion 12.43 + React 18): the exiting drawer animated to
// opacity 0 but AnimatePresence never unmounted it, leaving a `fixed inset-0`
// node that still swallowed every click on the page — document.elementFromPoint
// at the viewport centre resolved inside the closed drawer. A fade-out isn't
// worth a site that goes dead after one menu open/close, so the drawer mounts
// and unmounts outright and only animates in.

export default function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="on-dark sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/10 bg-black px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2"
          aria-label="Conciencia Inquieta — portada"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conciencia-logo.png"
            alt="Conciencia Inquieta"
            width={1010}
            height={430}
            className="h-9 w-auto"
          />
        </Link>
        <Link
          href="/unete"
          data-event="cta_click"
          data-cta="mobile_unete"
          className="ml-auto rounded-full bg-ci-orange px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-ci-ink"
        >
          Únete
        </Link>
      </header>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="on-dark fixed inset-0 z-50 overflow-y-auto bg-black px-6 py-6 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
            <div className="mb-8 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conciencia-logo.png"
                alt="Conciencia Inquieta"
                width={1010}
                height={430}
                className="h-10 w-auto"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                autoFocus
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-display text-xl font-bold transition-colors ${
                    isActive(item.key, pathname)
                      ? "bg-ci-purple text-ci-ink"
                      : "text-white/70"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <p className="mb-3 mt-10 text-[0.68rem] uppercase tracking-[0.16em] text-ci-orange">
              Secciones
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categoria/${c.slug}`}
                    className="block py-1.5 text-sm text-white/60"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-xs text-white/40">
              <Link href="/privacidad">Aviso legal &amp; privacidad</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/terminos">Términos</Link>
            </div>
        </motion.div>
      )}
    </>
  );
}
