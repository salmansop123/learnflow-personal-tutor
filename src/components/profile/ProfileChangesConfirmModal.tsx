"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatFieldLabel,
  formatFieldValue,
  type ProfileValidationResult,
} from "@/lib/profile-change-utils";
import { cn } from "@/lib/utils";

export function ProfileChangesConfirmModal({
  open,
  pendingChanges,
  originalValues,
  validationResult,
  isSaving,
  onConfirm,
  onFixIssues,
  onCancel,
}: {
  open: boolean;
  pendingChanges: Record<string, unknown>;
  originalValues: Record<string, unknown>;
  validationResult: ProfileValidationResult | null;
  isSaving: boolean;
  onConfirm: () => void;
  onFixIssues: () => void;
  onCancel: () => void;
}) {
  const allValid = validationResult?.valid ?? true;
  const fields = Object.keys(pendingChanges);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-changes-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-lg"
          >
            <h2 id="profile-changes-title" className="text-lg font-semibold">
              Review your changes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Please confirm the following changes to your profile.
            </p>

            {validationResult && !allValid ? (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                Some changes look incorrect.
                {validationResult.summary
                  ? ` ${validationResult.summary}`
                  : " Please review the warnings below."}
              </div>
            ) : validationResult && allValid ? (
              <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                All changes look good!
              </div>
            ) : null}

            <ul className="mt-4 space-y-4">
              {fields.map((field) => {
                const fieldResult = validationResult?.fieldResults[field];
                const isInvalid = fieldResult?.valid === false;
                const hasNote =
                  fieldResult?.message && fieldResult.message.length > 0;

                return (
                  <li
                    key={field}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatFieldLabel(field)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {formatFieldValue(field, originalValues[field])}
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {formatFieldValue(field, pendingChanges[field])}
                      </span>
                    </div>
                    {isInvalid && hasNote ? (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        {fieldResult!.message}
                      </p>
                    ) : null}
                    {!isInvalid && hasNote ? (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        {fieldResult!.message}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              {!allValid ? (
                <Button
                  type="button"
                  onClick={onFixIssues}
                  disabled={isSaving}
                >
                  Fix issues
                </Button>
              ) : null}
              <Button
                type="button"
                variant={allValid ? "default" : "outline"}
                className={cn(!allValid && "border-red-500/50 text-red-700 hover:bg-red-500/10")}
                onClick={onConfirm}
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving…"
                  : allValid
                    ? "Confirm changes"
                    : "Save anyway"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
