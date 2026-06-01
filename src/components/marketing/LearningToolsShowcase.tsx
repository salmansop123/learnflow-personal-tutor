"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, FileDown, FileText, Pin, ScanLine, Tag } from "lucide-react";

import { AmbientBackground } from "@/components/marketing/motion/AmbientBackground";
import { defaultViewport, fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function LearningToolsShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
      <AmbientBackground variant="section" />
      <motion.div
        className="relative mx-auto max-w-6xl"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="marketing-badge">Learning tools</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Notes, PDFs, and quizzes{" "}
            <span className="marketing-gradient-text">powered by AI</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Capture knowledge, analyze exam papers, and practice with adaptive
            quizzes in one flow.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          <motion.div
            variants={fadeUp}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            className="marketing-card relative overflow-hidden p-6"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-400 text-white">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-bold text-slate-900">Smart notes</h3>
            <p className="mt-2 text-sm text-slate-600">
              Pin AI answers, tag subjects, and export polished PDFs.
            </p>
            <div className="mt-6 rounded-lg border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-violet-800">
                  Photosynthesis — AI summary
                </p>
                <span
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-violet-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800"
                  aria-hidden
                >
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Biology", "Chapter 4"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded-full border border-violet-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                  >
                    <Tag className="h-2.5 w-2.5" aria-hidden />
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-full rounded bg-violet-200/60" />
                <div className="h-2 w-5/6 rounded bg-violet-200/50" />
                <div className="h-2 w-4/5 rounded bg-violet-200/40" />
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs font-medium text-violet-600">
                <FileDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Ready to export as PDF
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            className="marketing-card relative overflow-hidden p-6"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-400 text-white">
              <ScanLine className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-bold text-slate-900">PDF analysis</h3>
            <p className="mt-2 text-sm text-slate-600">
              Upload exam papers AI scans patterns and suggests focus areas.
            </p>
            <div className="relative mt-6 overflow-hidden rounded-lg border border-sky-100 bg-slate-50 p-4">
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-slate-200" />
                <div className="h-2 w-4/5 rounded bg-slate-200" />
                <div className="h-2 w-3/5 rounded bg-slate-200" />
              </div>
              {!reduceMotion ? (
                <div className="marketing-scan-line absolute inset-0" aria-hidden />
              ) : null}
              <p className="relative mt-4 text-xs font-medium text-sky-600">
                Analyzing exam pattern…
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            className="marketing-card relative overflow-hidden p-6"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white">
              <Brain className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-bold text-slate-900">Adaptive quizzes</h3>
            <p className="mt-2 text-sm text-slate-600">
              Dynamic questions with instant explanations and review mode.
            </p>
            <motion.div
              className="mt-6 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4"
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      boxShadow:
                        "0 0 32px oklch(0.55 0.16 155 / 0.25)",
                    }
              }
            >
              <p className="text-xs font-semibold text-emerald-700">
                Question 3 of 10
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                Which process releases oxygen during photosynthesis?
              </p>
              <div className="mt-3 flex gap-2">
                {["A", "B", "C", "D"].map((opt, i) => (
                  <motion.span
                    key={opt}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    whileHover={{ scale: 1.08 }}
                    className={cn(
                      "flex h-8 w-8 cursor-default items-center justify-center rounded-lg text-xs font-bold",
                      i === 1
                        ? "bg-emerald-500 text-white shadow-md"
                        : "border border-emerald-200 bg-white text-slate-600"
                    )}
                  >
                    {opt}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
