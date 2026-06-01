"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectionOption = {
  id: string;
  label: string;
  description?: string;
};

export function SelectionGrid({
  options,
  value,
  onChange,
  multi = false,
  className,
}: {
  options: SelectionOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  className?: string;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(id: string) {
    if (multi) {
      const next = selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id];
      onChange(next);
    } else {
      onChange(id);
    }
  }

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all duration-150",
              isSelected
                ? "scale-[1.02] border-sky-500 bg-sky-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            {isSelected ? (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white">
                <Check className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
            <span className="block font-semibold text-slate-900">{opt.label}</span>
            {opt.description ? (
              <span className="mt-1 block text-xs text-slate-500">
                {opt.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
