"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export function TypewriterText({
  prompts,
  className,
}: {
  prompts: string[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const current = prompts[promptIndex] ?? "";

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(current);
      return;
    }

    const typeSpeed = isDeleting ? 28 : 48;
    const pauseAtEnd = 2200;
    const pauseAfterDelete = 400;

    if (!isDeleting && displayed === current) {
      const t = setTimeout(() => setIsDeleting(true), pauseAtEnd);
      return () => clearTimeout(t);
    }

    if (isDeleting && displayed === "") {
      const t = setTimeout(() => {
        setIsDeleting(false);
        setPromptIndex((i) => (i + 1) % prompts.length);
      }, pauseAfterDelete);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (isDeleting) {
        setDisplayed((d) => d.slice(0, -1));
      } else {
        setDisplayed(current.slice(0, displayed.length + 1));
      }
    }, typeSpeed);

    return () => clearTimeout(t);
  }, [current, displayed, isDeleting, prompts.length, reduceMotion]);

  return (
    <span
      className={cn(
        "inline-flex min-h-[1.5em] items-center font-medium text-sky-600",
        className
      )}
    >
      <span className="mr-1 text-slate-400">&ldquo;</span>
      {displayed}
      <span
        className="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-sky-500"
        aria-hidden
      />
      <span className="ml-1 text-slate-400">&rdquo;</span>
    </span>
  );
}
