"use client";

import { motion } from "framer-motion";

import { AnimatedChatDemo } from "@/components/marketing/motion/AnimatedChatDemo";
import { AmbientBackground } from "@/components/marketing/motion/AmbientBackground";
import { defaultViewport, fadeUp, slideInLeft, staggerContainer } from "@/lib/animations";

export function AIPreview() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
      <AmbientBackground variant="section" className="opacity-70" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={slideInLeft}
        >
          <span className="marketing-badge">AI Tutor</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your AI tutor,{" "}
            <span className="marketing-gradient-text">always on</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Ask questions in plain language, get clear explanations, and pin the
            best answers straight into your notes. LearnFlow remembers your
            subject and education level for more relevant help.
          </p>
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="mt-8 space-y-3 text-sm"
          >
            {[
              "Streaming responses with conversation history",
              "Pin assistant messages to notes in one click",
              "Optional custom topic for every chat",
            ].map((item) => (
              <motion.li
                key={item}
                variants={fadeUp}
                className="flex items-start gap-3"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400" />
                <span className="text-slate-600">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={fadeUp}
        >
          <AnimatedChatDemo />
        </motion.div>
      </div>
    </section>
  );
}
