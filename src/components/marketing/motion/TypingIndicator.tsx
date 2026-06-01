"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TypingIndicator() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <span className="text-xs text-slate-400">AI is thinking…</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
      <motion.span
        className="h-2 w-2 rounded-full bg-sky-400"
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-cyan-400"
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-violet-400"
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: 0.3 }}
      />
      <span className="ml-2 text-xs font-medium text-slate-500">
        AI tutor is typing…
      </span>
    </div>
  );
}
