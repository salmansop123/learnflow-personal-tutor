"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeSettings({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>
          Choose how LearnFlow looks. System follows your device preference.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Theme preference"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(opt.value);
                  toast.success(`Theme set to ${opt.label.toLowerCase()}`);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all",
                  selected
                    ? "border-primary bg-primary/10 text-primary shadow-soft"
                    : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          High-contrast focus rings and reduced motion respect your browser
          settings where supported.
        </p>
      </CardContent>
    </Card>
  );
}
