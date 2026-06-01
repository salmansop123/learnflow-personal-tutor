"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "glass-panel border-border shadow-card",
          title: "text-foreground",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
