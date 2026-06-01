"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";

import { TypingIndicator } from "@/components/marketing/motion/TypingIndicator";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

const CONVERSATION = [
  {
    role: "user" as const,
    text: "Can you explain photosynthesis in simple terms?",
  },
  {
    role: "assistant" as const,
    text: "Plants use sunlight, water, and CO₂ to make glucose and release oxygen — like tiny solar panels in every leaf.",
  },
  {
    role: "user" as const,
    text: "What should I review before my biology quiz?",
  },
  // {
  //   role: "assistant" as const,
  //   text: "Focus on light-dependent vs Calvin cycle, key vocabulary, and one diagram. Want a 5-question quiz?",
  // },
];

export function AnimatedChatDemo() {
  const reduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(
    reduceMotion ? CONVERSATION.length : 1
  );
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    if (visibleCount >= CONVERSATION.length) {
      const reset = setTimeout(() => {
        setVisibleCount(1);
        setShowTyping(false);
      }, 4000);
      return () => clearTimeout(reset);
    }

    const next = CONVERSATION[visibleCount];
    if (next?.role === "assistant") {
      setShowTyping(true);
      const t = setTimeout(() => {
        setShowTyping(false);
        setVisibleCount((c) => c + 1);
      }, 1400);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setVisibleCount((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [visibleCount, reduceMotion]);

  const messages = CONVERSATION.slice(0, visibleCount);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/50 bg-white/90 shadow-[0_24px_64px_oklch(0.55_0.14_230/0.12)] backdrop-blur-sm">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl marketing-ai-pulse" />
      <div className="flex items-center gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-violet-50/50 px-4 py-3.5">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    "0 0 0 0 oklch(0.55 0.2 280 / 0)",
                    "0 0 0 8px oklch(0.55 0.2 280 / 0.15)",
                    "0 0 0 0 oklch(0.55 0.2 280 / 0)",
                  ],
                }
          }
          transition={{ duration: 2.5, repeat: Infinity }}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-400 text-white"
        >
          <Bot className="h-4 w-4" aria-hidden />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-slate-900">AI Tutor</p>
          <p className="text-xs text-slate-500">Biology · Streaming</p>
        </div>
      </div>

      <div className="min-h-[220px] space-y-4 bg-gradient-to-b from-slate-50/50 to-white p-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.role}-${i}-${msg.text.slice(0, 12)}`}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-400 text-white">
                  <Bot className="h-3.5 w-3.5" aria-hidden />
                </div>
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
                    : "border border-sky-100 bg-white text-slate-700 shadow-sm"
                )}
              >
                {msg.text}
              </div>
              {msg.role === "user" ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <User className="h-3.5 w-3.5 text-slate-600" aria-hidden />
                </div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {showTyping ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <motion.div
        variants={fadeUp}
        className="flex gap-2 border-t border-sky-100 bg-slate-50/50 p-3"
      >
        <div className="flex-1 rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-400">
          Ask your AI tutor anything…
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 cursor-default items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
        >
          <Send className="h-4 w-4" aria-hidden />
        </motion.div>
      </motion.div>
    </div>
  );
}
