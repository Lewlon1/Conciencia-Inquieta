"use client";

import { useEffect } from "react";

// Faithful port of BaseLayout.astro's inline nav script: renders the overlay
// backdrop and wires #hamb (open), #overlay (close), #collapseBtn (toggle
// desktop rail), and Escape (close) by id — the sibling Sidebar/Topbar render
// those elements, which exist in the DOM by the time this effect runs.
export default function NavOverlay() {
  useEffect(() => {
    const hamb = document.getElementById("hamb");
    const collapseBtn = document.getElementById("collapseBtn");
    const overlay = document.getElementById("overlay");

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
    collapseBtn?.addEventListener("click", toggleRail);
    document.addEventListener("keydown", onKeydown);

    return () => {
      hamb?.removeEventListener("click", openNav);
      overlay?.removeEventListener("click", closeNav);
      collapseBtn?.removeEventListener("click", toggleRail);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return <div className="overlay" id="overlay" />;
}
