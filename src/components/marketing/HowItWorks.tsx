"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, GraduationCap, LineChart } from "lucide-react";

import { defaultViewport, fadeUp, staggerContainer } from "@/lib/animations";

const steps = [
  {
    step: "01",
    title: "Set your goals",
    description:
      "Create study plans, add tasks, and schedule reminders so your week has structure.",
    icon: ClipboardList,
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    step: "02",
    title: "Learn with AI",
    description:
      "Ask your tutor anything, pin helpful answers to notes, and run quick quizzes.",
    icon: GraduationCap,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    step: "03",
    title: "Track progress",
    description:
      "Log sessions, review activity charts, and see hours by subject on your dashboard.",
    icon: LineChart,
    gradient: "from-emerald-500 to-teal-500",
  },
];

export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-y border-sky-100/80 px-4 py-20 sm:px-6 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-50/40 via-transparent to-violet-50/40"
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
          <span className="marketing-badge">How it works</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Three steps to mastery
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From planning to progress a simple flow that keeps you moving.
          </p>
        </motion.div>

        <div className="relative mt-14">
          {!reduceMotion ? (
            <motion.div
              className="absolute left-[16.67%] right-[16.67%] top-[2.5rem] hidden h-0.5 origin-left bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 lg:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          ) : (
            <div
              className="absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-sky-300/60 to-transparent lg:block"
              aria-hidden
            />
          )}
          <motion.div
            variants={staggerContainer}
            className="grid gap-10 lg:grid-cols-3"
          >
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  whileHover={reduceMotion ? undefined : { y: -6 }}
                  className="relative text-center"
                >
                  <motion.div
                    animate={
                      reduceMotion
                        ? undefined
                        : { y: [0, -4, 0] }
                    }
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: index * 0.5,
                      ease: "easeInOut",
                    }}
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-[0_12px_32px_oklch(0.55_0.18_240/0.3)]`}
                  >
                    <Icon className="h-7 w-7" aria-hidden />
                  </motion.div>
                  <p className="mt-6 text-sm font-bold text-sky-600">
                    Step {item.step}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
