"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadStudySessionsPdf } from "@/lib/download-pdf";
import type { StudySessionRow } from "@/types/study";

export function ExportStudySessionsPDF({
  sessions,
  hoursBySubject,
}: {
  sessions: StudySessionRow[];
  hoursBySubject: Record<string, number>;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = sessions.filter((s) => s.endedAt != null).length;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      await downloadStudySessionsPdf(sessions, hoursBySubject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isExporting || completedCount === 0}
        onClick={handleExport}
        className="gap-1.5"
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {isExporting ? "Exporting…" : "Export sessions PDF"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
