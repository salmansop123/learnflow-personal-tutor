"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";

import { defaultViewport, fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "LearnFlow turned my messy revision into a real system. The AI tutor explains things better than my textbook.",
    name: "Aisha K.",
    role: "Pre-med student",
    gradient: "from-sky-50 to-cyan-50/80",
    accent: "text-sky-500",
  },
  {
    quote:
      "I use study sessions and quizzes every week. The dashboard shows exactly where my hours go.",
    name: "Marcus T.",
    role: "Computer science major",
    gradient: "from-violet-50 to-fuchsia-50/60",
    accent: "text-violet-500",
  },
  {
    quote:
      "Pinning tutor answers to notes saved me hours. Everything stays in one place now.",
    name: "Priya S.",
    role: "High school senior",
    gradient: "from-emerald-50 to-teal-50/70",
    accent: "text-emerald-500",
  },
];

export function Testimonials() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative border-y border-sky-100/80 px-4 py-20 sm:px-6 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-50/30 via-transparent to-sky-50/30"
        aria-hidden
      />
      <motion.div
        className="relative mx-auto max-w-6xl"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="marketing-badge">Testimonials</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Loved by focused learners
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Students use LearnFlow to stay organized and learn faster.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
              >
                <div
                  className={cn(
                    "marketing-card flex h-full flex-col bg-gradient-to-br p-6 transition-shadow duration-300 hover:shadow-[0_16px_48px_oklch(0.55_0.14_230/0.12)]",
                    t.gradient
                  )}
                >
                <Quote className={cn("h-8 w-8 opacity-60", t.accent)} aria-hidden />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 border-t border-slate-200/60 pt-4">
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
