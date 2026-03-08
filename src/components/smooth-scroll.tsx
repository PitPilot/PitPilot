"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const NAVBAR_OFFSET = 72;

export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const hash = window.location.hash;
    requestAnimationFrame(() => {
      const target = document.getElementById(hash.replace(/^#/, ""));
      if (target) lenisRef.current?.scrollTo(target, { offset: -NAVBAR_OFFSET });
    });
  }, [pathname]);

  useEffect(() => {
    function onHashChange() {
      const target = document.getElementById(window.location.hash.replace(/^#/, ""));
      if (target) lenisRef.current?.scrollTo(target, { offset: -NAVBAR_OFFSET });
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#")) {
        event.preventDefault();
        if (window.location.hash !== href) window.history.pushState(null, "", href);
        const target = document.getElementById(href.replace(/^#/, ""));
        if (target) lenisRef.current?.scrollTo(target, { offset: -NAVBAR_OFFSET });
        return;
      }

      if (href.startsWith("/#") && window.location.pathname === "/") {
        event.preventDefault();
        if (window.location.pathname + window.location.hash !== href)
          window.history.pushState(null, "", href);
        const target = document.getElementById(href.slice(2));
        if (target) lenisRef.current?.scrollTo(target, { offset: -NAVBAR_OFFSET });
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
