"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function RouteLoading() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  const startLoading = useCallback(() => {
    setLoading(true);
    setProgress(0);
  }, []);

  const stopLoading = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    // Animate progress while loading
    if (!loading) return;

    let frame: number;
    let current = 0;

    const tick = () => {
      // Fast at first, then slow down — never reaches 100 on its own
      current += (88 - current) * 0.06;
      setProgress(current);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loading]);

  useEffect(() => {
    // Intercept link clicks to detect navigation
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only handle internal navigation links
      const isInternal =
        href.startsWith("/") || href.startsWith(window.location.origin);
      const isAnchor = href.startsWith("#");
      const isNewTab =
        anchor.target === "_blank" || e.metaKey || e.ctrlKey;

      if (isInternal && !isAnchor && !isNewTab) {
        // Don't start loading if we're already on this page
        if (href === window.location.pathname) return;
        startLoading();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [startLoading, stopLoading]);

  useEffect(() => {
    // App Router route change completed
    if (loading) {
      const timer = window.setTimeout(() => {
        stopLoading();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [pathname, loading, stopLoading]);

  useEffect(() => {
    if (!loading) return;
    // Never leave the bar stuck around ~80%
    const timer = window.setTimeout(() => {
      stopLoading();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [loading, stopLoading]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 z-[100] h-0.5 w-full">
      <div
        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
