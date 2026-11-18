"use client";

import { useEffect, useRef, useState } from "react";

interface RollingNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function RollingNumber({
  value,
  suffix = "",
  className = "",
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    let rafId: number | null = null;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);

          const duration = 920;
          const start = performance.now();

          const step = (now: number) => {
            const elapsed = Math.min(1, (now - start) / duration);
            // Expo-out curve: 1 - Math.pow(2, -10 * t)
            const eased =
              elapsed === 1 ? 1 : 1 - Math.pow(2, -10 * elapsed);
            const current = Math.round(eased * value);
            setDisplayValue(current);
            if (elapsed < 1) {
              rafId = window.requestAnimationFrame(step);
            } else {
              setDisplayValue(value);
            }
          };

          rafId = window.requestAnimationFrame(step);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [value]);

  return (
    <span ref={ref} className={`num inline-block ${className}`}>
      {displayValue}
      {suffix}
    </span>
  );
}
