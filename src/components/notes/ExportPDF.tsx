"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadNotePdf } from "@/lib/download-pdf";
import type { NoteRow } from "@/types/note";

export function ExportPDF({ note }: { note: NoteRow }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    setError(null);
    try {
      await downloadNotePdf(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={handleExport}
        className="gap-1.5"
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {isExporting ? "Exporting…" : "Download PDF"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
