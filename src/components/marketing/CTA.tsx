"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { fadeUp } from "@/lib/animations";

export function CTA() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="px-4 pb-24 sm:px-6 sm:pb-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl"
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[length:200%_200%] bg-gradient-to-br from-sky-500 via-cyan-500 to-violet-600"
          style={{ backgroundSize: "200% 200%" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-fuchsia-400/25 blur-2xl marketing-blob-animate"
          aria-hidden
        />

        <div className="relative px-8 py-16 text-center sm:px-14 sm:py-20">
          <motion.span
            animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Start learning today
          </motion.span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to study smarter?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            Join LearnFlow free set up in minutes and meet your AI tutor,
            notes, and quizzes in one beautiful, colorful workspace.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="/register"
                className="marketing-btn-shimmer inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-sky-700 shadow-lg hover:bg-white/95"
              >
                Create free account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <Link
                href="/pricing"
                className="inline-flex rounded-xl border-2 border-white/50 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                View pricing
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
