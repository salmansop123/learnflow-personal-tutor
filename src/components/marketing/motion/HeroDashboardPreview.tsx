"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import { AnimatedCounter } from "@/components/marketing/motion/AnimatedCounter";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

/** Bar heights as % of the 96px (h-24) chart area */
const CHART_BARS = [42, 68, 55, 82, 74, 90, 65];
const CHART_HEIGHT_PX = 96;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const stats = [
  {
    label: "Study hours",
    value: 12.5,
    decimals: 1,
    suffix: "h",
    tint: "from-sky-100 to-cyan-50",
    glow: "group-hover:shadow-[0_0_24px_oklch(0.55_0.18_230/0.25)]",
  },
  {
    label: "Quiz score",
    value: 87,
    decimals: 0,
    suffix: "%",
    tint: "from-violet-100 to-fuchsia-50",
    glow: "group-hover:shadow-[0_0_24px_oklch(0.55_0.2_300/0.25)]",
  },
  {
    label: "Tasks done",
    value: 24,
    decimals: 0,
    suffix: "",
    tint: "from-emerald-100 to-teal-50",
    glow: "group-hover:shadow-[0_0_24px_oklch(0.55_0.16_155/0.25)]",
  },
];

function barHeightPx(percent: number) {
  return (percent / 100) * CHART_HEIGHT_PX;
}

export function HeroDashboardPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="overflow-hidden rounded-2xl border border-sky-200/50 bg-white/85 shadow-[0_24px_64px_oklch(0.55_0.14_230/0.18)] backdrop-blur-md"
      >
        <div className="flex items-center gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50/90 to-violet-50/60 px-5 py-3.5">
          <Image
            src="/logo.svg"
            alt=""
            width={120}
            height={28}
            className="h-7 w-auto"
          />
          <span className="text-xs font-medium text-slate-500">
            Live dashboard preview
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="marketing-pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-600">Active session</span>
          </span>
        </div>

        <div className="grid gap-4 bg-gradient-to-br from-sky-50/60 via-white to-violet-50/40 p-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              className={cn(
                "group rounded-xl border border-white/80 bg-gradient-to-br p-5 text-left shadow-sm transition-shadow duration-300",
                stat.tint,
                stat.glow
              )}
            >
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                <AnimatedCounter
                  value={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                />
              </p>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-sky-100/80 bg-white/60 px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weekly study activity
          </p>
          <div className="flex h-24 items-end justify-between gap-2">
            {CHART_BARS.map((pct, i) => {
              const basePx = barHeightPx(pct);
              const peakPx = barHeightPx(Math.min(pct + 12, 98));

              return (
                <div
                  key={i}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <motion.div
                    className="w-full max-w-[2rem] rounded-t-md bg-gradient-to-t from-sky-500 to-cyan-400 shadow-sm"
                    initial={{ height: basePx }}
                    animate={
                      reduceMotion
                        ? { height: basePx }
                        : { height: [basePx, peakPx, basePx] }
                    }
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.15,
                    }}
                  />
                  <span className="text-[10px] text-slate-400">
                    {DAY_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
