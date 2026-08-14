"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the visitor has asked for less motion.
 *
 * The stylesheet already flattens CSS animations for these visitors; this is
 * for the motion CSS can't reach — canvas loops and timers that swap content.
 * Server-renders as `false` and re-renders after hydration, which
 * useSyncExternalStore handles without a mismatch.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
