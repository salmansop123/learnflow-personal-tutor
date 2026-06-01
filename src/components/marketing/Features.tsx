"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Brain,
  FileText,
  MessageSquare,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AmbientBackground } from "@/components/marketing/motion/AmbientBackground";
import {
  defaultViewport,
  fadeUp,
  staggerContainer,
  cardHover,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

const features: {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
}[] = [
  {
    title: "AI Tutor",
    description:
      "Chat with a subject aware tutor that explains concepts step by step and adapts to your level.",
    icon: MessageSquare,
    gradient: "from-sky-50 via-white to-cyan-50/80",
    iconBg: "from-sky-400 to-cyan-400",
  },
  {
    title: "Smart Notes",
    description:
      "Capture ideas, pin AI answers, summarize content, and export polished PDFs.",
    icon: FileText,
    gradient: "from-violet-50 via-white to-fuchsia-50/60",
    iconBg: "from-violet-400 to-fuchsia-400",
  },
  {
    title: "Quiz Engine",
    description:
      "Generate MCQs, fill in the blank, and short answer quizzes with instant review.",
    icon: Brain,
    gradient: "from-emerald-50 via-white to-teal-50/70",
    iconBg: "from-emerald-400 to-teal-400",
  },
  {
    title: "Study Sessions",
    description:
      "Track focus time with timers, plans, tasks, and hours-by-subject insights.",
    icon: Timer,
    gradient: "from-cyan-50 via-white to-sky-50/80",
    iconBg: "from-cyan-400 to-sky-500",
  },
  {
    title: "Study Plans",
    description:
      "Organize goals into active plans, tasks, and archived milestones.",
    icon: BookOpen,
    gradient: "from-amber-50/80 via-white to-orange-50/50",
    iconBg: "from-amber-400 to-orange-400",
  },
  {
    title: "Email Reminders",
    description:
      "Schedule study nudges and get notified when it is time to hit the books.",
    icon: Bell,
    gradient: "from-rose-50/60 via-white to-pink-50/50",
    iconBg: "from-rose-400 to-pink-400",
  },
];

export function Features() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
      <AmbientBackground variant="section" className="opacity-50" />
      <div
        className="pointer-events-none absolute inset-0 marketing-section-alt"
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
          <span className="marketing-badge">Features</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to{" "}
            <span className="marketing-gradient-text">study well</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            One vibrant workspace for tutoring, notes, quizzes, and planning
            built for students who want results, not tab overload.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={fadeUp}>
                <motion.div
                  variants={cardHover}
                  initial="rest"
                  whileHover={reduceMotion ? undefined : "hover"}
                  className={cn(
                    "marketing-card h-full overflow-hidden bg-gradient-to-br p-6",
                    feature.gradient
                  )}
                >
                  <motion.div
                    whileHover={
                      reduceMotion ? undefined : { rotate: [0, -8, 8, 0] }
                    }
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      feature.iconBg
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
