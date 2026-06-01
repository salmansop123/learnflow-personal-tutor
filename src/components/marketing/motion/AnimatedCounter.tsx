"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function AnimatedCounter({
  value,
  suffix = "",
  decimals = 0,
  className,
  duration = 1.4,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(decimals > 0 ? "0.0" : "0");

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      setDisplay(
        decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
      );
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        setDisplay(
          decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))
        );
      },
    });

    return () => controls.stop();
  }, [isInView, value, decimals, duration, reduceMotion]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
      {suffix}
    </span>
  );
}
