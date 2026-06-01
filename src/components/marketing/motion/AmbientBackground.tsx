"use client";

import { motion, useReducedMotion } from "framer-motion";

import { glowPulse } from "@/lib/animations";
import { cn } from "@/lib/utils";

const PARTICLES = [
  { left: "8%", top: "18%", size: 6, delay: 0, color: "bg-sky-400/50" },
  { left: "22%", top: "72%", size: 4, delay: 1.2, color: "bg-cyan-400/45" },
  { left: "78%", top: "25%", size: 5, delay: 0.6, color: "bg-violet-400/40" },
  { left: "88%", top: "65%", size: 4, delay: 2, color: "bg-emerald-400/35" },
  { left: "45%", top: "12%", size: 3, delay: 1.5, color: "bg-fuchsia-400/35" },
  { left: "62%", top: "82%", size: 5, delay: 0.3, color: "bg-sky-300/40" },
  { left: "35%", top: "45%", size: 3, delay: 2.4, color: "bg-cyan-300/30" },
  { left: "92%", top: "40%", size: 4, delay: 1.8, color: "bg-violet-300/35" },
];

export function AmbientBackground({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "section";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="marketing-mesh-shift absolute inset-0 opacity-80" />

      <motion.div
        variants={reduceMotion ? undefined : glowPulse}
        initial="initial"
        animate={reduceMotion ? undefined : "animate"}
        className={cn(
          "absolute rounded-full blur-3xl",
          variant === "hero"
            ? "-left-40 top-0 h-[28rem] w-[28rem] bg-gradient-to-br from-sky-400/45 via-cyan-300/35 to-transparent"
            : "-left-20 top-10 h-64 w-64 bg-gradient-to-br from-sky-300/30 to-transparent"
        )}
      />
      <motion.div
        variants={reduceMotion ? undefined : glowPulse}
        initial="initial"
        animate={reduceMotion ? undefined : "animate"}
        transition={{ delay: 1 }}
        className={cn(
          "absolute rounded-full blur-3xl",
          variant === "hero"
            ? "-right-32 top-20 h-80 w-80 bg-gradient-to-br from-violet-400/40 via-fuchsia-300/25 to-transparent"
            : "right-0 top-1/3 h-56 w-56 bg-gradient-to-br from-violet-300/25 to-transparent"
        )}
      />
      <motion.div
        variants={reduceMotion ? undefined : glowPulse}
        initial="initial"
        animate={reduceMotion ? undefined : "animate"}
        transition={{ delay: 2 }}
        className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl"
      />

      {!reduceMotion
        ? PARTICLES.map((p, i) => (
            <span
              key={i}
              className={cn(
                "marketing-particle absolute rounded-full",
                p.color
              )}
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))
        : null}
    </div>
  );
}
