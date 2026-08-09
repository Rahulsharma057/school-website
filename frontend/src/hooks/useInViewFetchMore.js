"use client";

import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a sentinel element at the bottom of a list.
 * When that sentinel scrolls into view, `onIntersect` fires (guarded
 * against firing again while already loading) — this is the lazy-load
 * trigger for the "View All" gallery page's infinite scroll.
 */
export default function useInViewFetchMore({ onIntersect, enabled = true, rootMargin = "400px" }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onIntersect]);

  return sentinelRef;
}
