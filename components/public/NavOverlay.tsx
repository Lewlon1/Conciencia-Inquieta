"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Faithful port of BaseLayout.astro's inline nav script: renders the overlay
// backdrop and wires #hamb (open), #overlay/#mobileCloseBtn (close),
// #collapseBtn (toggle desktop rail), and Escape (close) by id — the sibling
// Sidebar/Topbar render those elements, which exist in the DOM by the time
// this effect runs.
export default function NavOverlay() {
  const pathname = usePathname();

  useEffect(() => {
    const hamb = document.getElementById("hamb");
    const collapseBtn = document.getElementById("collapseBtn");
    const overlay = document.getElementById("overlay");
    const mobileCloseBtn = document.getElementById("mobileCloseBtn");

    const openNav = () => {
      document.body.classList.add("nav-open");
      overlay?.classList.add("show");
    };
    const closeNav = () => {
      document.body.classList.remove("nav-open");
      overlay?.classList.remove("show");
    };
    const toggleRail = () => document.body.classList.toggle("rail");
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNav();
    };

    hamb?.addEventListener("click", openNav);
    overlay?.addEventListener("click", closeNav);
    mobileCloseBtn?.addEventListener("click", closeNav);
    collapseBtn?.addEventListener("click", toggleRail);
    document.addEventListener("keydown", onKeydown);

    return () => {
      hamb?.removeEventListener("click", openNav);
      overlay?.removeEventListener("click", closeNav);
      mobileCloseBtn?.removeEventListener("click", closeNav);
      collapseBtn?.removeEventListener("click", toggleRail);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  // The drawer is client-side navigation over the same DOM — close it on
  // route change, since #overlay's own click-to-close never fires otherwise.
  useEffect(() => {
    document.body.classList.remove("nav-open");
    document.getElementById("overlay")?.classList.remove("show");
  }, [pathname]);

  return <div className="overlay" id="overlay" />;
}
