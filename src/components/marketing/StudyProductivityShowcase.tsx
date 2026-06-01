"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock, ListTodo } from "lucide-react";

import { AmbientBackground } from "@/components/marketing/motion/AmbientBackground";
import { AnimatedCounter } from "@/components/marketing/motion/AnimatedCounter";
import {
  defaultViewport,
  fadeUp,
  staggerContainer,
  cardHover,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

const tasks = [
  { title: "Review organic chemistry notes", done: true, priority: "high" },
  { title: "Complete practice quiz — Biology", done: false, priority: "medium" },
  { title: "Upload past paper PDF for analysis", done: false, priority: "low" },
];

const timeline = [
  { time: "9:00", label: "AI tutor — calculus help", color: "bg-sky-400" },
  { time: "11:30", label: "Study session — 45 min", color: "bg-cyan-400" },
  { time: "15:00", label: "Quiz review & notes", color: "bg-violet-400" },
];

export function StudyProductivityShowcase() {
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
          <span className="marketing-badge">Study workflow</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Plan, focus, and{" "}
            <span className="marketing-gradient-text">track every session</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Timers, tasks, reminders, and progress analytics keep your study
            rhythm consistent.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <motion.div variants={fadeUp} className="space-y-6">
            <div className="marketing-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Today&apos;s focus</h3>
                <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
                  <Clock className="h-4 w-4 text-sky-500" aria-hidden />
                  2h 15m logged
                </span>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                  <span>Weekly goal</span>
                  <span>
                    <AnimatedCounter value={68} suffix="%" />
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "68%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.45 }}
                  whileHover={reduceMotion ? undefined : { x: 4, scale: 1.01 }}
                  className={cn(
                    "marketing-card flex items-center gap-3 p-4",
                    !task.done && "marketing-float-card"
                  )}
                  style={
                    !reduceMotion && !task.done
                      ? { animationDelay: `${i * 0.5}s` }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      task.done
                        ? "bg-emerald-100 text-emerald-600"
                        : "border border-slate-200 bg-white text-slate-400"
                    )}
                  >
                    {task.done ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <ListTodo className="h-4 w-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.done
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      )}
                    >
                      {task.title}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      task.priority === "high" && "bg-rose-100 text-rose-600",
                      task.priority === "medium" && "bg-amber-100 text-amber-700",
                      task.priority === "low" && "bg-slate-100 text-slate-500"
                    )}
                  >
                    {task.priority}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <motion.div
              variants={cardHover}
              initial="rest"
              whileHover="hover"
              className="marketing-card h-full p-6"
            >
              <h3 className="font-bold text-slate-900">Study timeline</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your day, organized by LearnFlow
              </p>
              <ul className="relative mt-8 space-y-6">
                <div
                  className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-gradient-to-b from-sky-300 via-violet-300 to-emerald-300"
                  aria-hidden
                />
                {timeline.map((item, i) => (
                  <motion.li
                    key={item.time}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                    className="relative flex gap-4 pl-1"
                  >
                    <motion.span
                      animate={
                        reduceMotion
                          ? undefined
                          : { scale: [1, 1.2, 1] }
                      }
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                      className={cn(
                        "relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full ring-4 ring-white",
                        item.color
                      )}
                    />
                    <div>
                      <p className="text-xs font-bold text-sky-600">
                        {item.time}
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {item.label}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
