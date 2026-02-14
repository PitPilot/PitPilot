"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const NAVBAR_OFFSET = 72;

function scrollToHash(hash: string) {
  if (typeof window === "undefined") return;
  const id = hash.replace(/^#/, "");
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const top =
    target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash) return;
    const hash = window.location.hash;
    requestAnimationFrame(() => scrollToHash(hash));
  }, [pathname]);

  useEffect(() => {
    function onHashChange() {
      scrollToHash(window.location.hash);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const target = event.target as Element | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#")) {
        event.preventDefault();
        if (window.location.hash !== href) {
          window.history.pushState(null, "", href);
        }
        scrollToHash(href);
        return;
      }

      if (href.startsWith("/#") && window.location.pathname === "/") {
        event.preventDefault();
        if (window.location.pathname + window.location.hash !== href) {
          window.history.pushState(null, "", href);
        }
        scrollToHash(href.slice(1));
      }
    }

    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
