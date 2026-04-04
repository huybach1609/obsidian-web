"use client";

/**
 * Đo chiều cao khung chứa Tree (ResizeObserver + resize) để truyền `height` cho virtualized list.
 */

import { useEffect, useRef, useState } from "react";

const DEFAULT_EFFECT_DEPS: readonly unknown[] = [];

export function useContainerHeight(
  dependencies: readonly unknown[] = DEFAULT_EFFECT_DEPS,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const calculateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      } else {
        setContainerHeight(window.innerHeight - 100);
      }
    };

    const updateHeight = () => {
      requestAnimationFrame(calculateHeight);
    };

    const timeoutId = setTimeout(updateHeight, 0);
    const rafId = requestAnimationFrame(updateHeight);

    window.addEventListener("resize", updateHeight);

    const resizeObserver = new ResizeObserver(updateHeight);
    const parentElement = containerRef.current?.parentElement;

    if (parentElement) resizeObserver.observe(parentElement);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, dependencies);

  return { containerRef, containerHeight };
}
