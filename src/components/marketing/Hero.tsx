"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { AmbientBackground } from "@/components/marketing/motion/AmbientBackground";
import { HeroDashboardPreview } from "@/components/marketing/motion/HeroDashboardPreview";
import { TypewriterText } from "@/components/marketing/motion/TypewriterText";
import { fadeUp, staggerContainer, wordReveal } from "@/lib/animations";
import { cn } from "@/lib/utils";

const HERO_PROMPTS = [
  "Explain photosynthesis for my biology quiz tomorrow",
  "Create a 10-question calculus practice set",
  "Summarize my notes on World War II causes",
  "What should I study first for the SAT math section?",
];

const headlineWords = ["Learn", "smarter", "with", "your"];
const headlineAccent = ["personal", "AI", "tutor"];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-12 sm:px-6 sm:pt-20 sm:pb-32">
      <AmbientBackground variant="hero" />

      <motion.div
        className="relative mx-auto max-w-5xl text-center"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-8 flex justify-center">
          <motion.span
            animate={
              reduceMotion
                ? undefined
                : { boxShadow: ["0 0 0 0 oklch(0.55 0.2 230/0)", "0 0 20px 4px oklch(0.55 0.2 230/0.2)", "0 0 0 0 oklch(0.55 0.2 230/0)"] }
            }
            transition={{ duration: 3, repeat: Infinity }}
            className="marketing-badge"
          >
            <Sparkles className="h-4 w-4 text-sky-500" aria-hidden />
            AI-powered learning for every student
          </motion.span>
        </motion.div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
          {reduceMotion ? (
            <>
              Learn smarter with your{" "}
              <span className="marketing-gradient-text">personal AI tutor</span>
            </>
          ) : (
            <>
              <span className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1">
                {headlineWords.map((word, i) => (
                  <motion.span
                    key={word}
                    custom={i}
                    variants={wordReveal}
                    initial="hidden"
                    animate="visible"
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>{" "}
              <span className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1">
                {headlineAccent.map((word, i) => (
                  <motion.span
                    key={word}
                    custom={i + 4}
                    variants={wordReveal}
                    initial="hidden"
                    animate="visible"
                    className="marketing-gradient-text inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </>
          )}
        </h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
        >
          LearnFlow combines AI tutoring, smart notes, adaptive quizzes, and
          structured study plans a colorful, focused workspace built for
          students who want real results.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mx-auto mt-6 flex min-h-[2rem] max-w-xl flex-wrap items-center justify-center gap-2 text-base sm:text-lg"
        >
          <span className="text-slate-500">Try asking:</span>
          <TypewriterText prompts={HERO_PROMPTS} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <Link
              href="/register"
              className={cn(
                "marketing-btn-primary marketing-btn-shimmer inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold"
              )}
            >
              Get started free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <Link
              href="/#features"
              className="marketing-btn-outline inline-flex rounded-xl px-8 py-3.5 text-base font-semibold"
            >
              Explore features
            </Link>
          </motion.div>
        </motion.div>

        <HeroDashboardPreview />
      </motion.div>
    </section>
  );
}
