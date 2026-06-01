"use client";

import {
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DOCUMENT_ACCEPT } from "@/lib/document-constants";
import { cn } from "@/lib/utils";

export type UploadedDocument = {
  id: string;
  name: string;
  text: string;
  extension: string;
  status: "uploading" | "ready" | "error";
  error?: string;
};

function fileIcon(ext: string) {
  if (["xlsx", "xls", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  return FileText;
}

async function extractFile(file: File): Promise<{
  name: string;
  text: string;
  extension: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/ai/extract-document", {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Upload failed");
  }
  return {
    name: (data as { name: string }).name ?? file.name,
    text: (data as { text: string }).text,
    extension: (data as { extension: string }).extension ?? "",
  };
}

export function useDocumentUpload(maxFiles = 3) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      const id = crypto.randomUUID();
      setDocuments((prev) => {
        if (prev.filter((d) => d.status !== "error").length >= maxFiles) {
          return prev;
        }
        return [
          ...prev,
          {
            id,
            name: file.name,
            text: "",
            extension: "",
            status: "uploading",
          },
        ];
      });

      try {
        const result = await extractFile(file);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, ...result, status: "ready" as const }
              : d
          )
        );
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Upload failed";
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, status: "error" as const, error: errMsg }
              : d
          )
        );
      }
    },
    [maxFiles]
  );

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
  }, []);

  const readyDocuments = documents.filter((d) => d.status === "ready");
  const isUploading = documents.some((d) => d.status === "uploading");

  return {
    documents,
    setDocuments,
    uploadFile,
    removeDocument,
    clearDocuments,
    readyDocuments,
    isUploading,
  };
}

export function DocumentUploadZone({
  documents,
  uploadFile,
  removeDocument,
  disabled,
  label = "Upload reference documents",
  hint = "PDF, DOCX, TXT, or Excel — up to 8MB each",
  maxFiles = 3,
  className,
}: {
  documents: UploadedDocument[];
  uploadFile: (file: File) => Promise<void>;
  removeDocument: (id: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  maxFiles?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const atLimit =
    documents.filter((d) => d.status !== "error").length >= maxFiles;

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      if (
        documents.filter((d) => d.status !== "error").length >= maxFiles
      ) {
        break;
      }
      void uploadFile(file);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !atLimit) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled && !atLimit) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !atLimit && inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all",
          "bg-gradient-to-br from-sky-50/80 via-white to-violet-50/60",
          isDragging
            ? "border-sky-400 shadow-[0_0_24px_oklch(0.65_0.14_230/0.25)]"
            : "border-sky-200/70 hover:border-sky-300 hover:shadow-sm",
          (disabled || atLimit) && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={DOCUMENT_ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled || atLimit}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className="mx-auto h-8 w-8 text-sky-500" aria-hidden />
        <p className="mt-2 text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>

      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map((doc) => {
            const Icon = fileIcon(doc.extension);
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border bg-card/80 px-3 py-2 shadow-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  {doc.status === "uploading" ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Extracting text…
                    </p>
                  ) : doc.status === "error" ? (
                    <p className="text-xs text-destructive">{doc.error}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {doc.text.length.toLocaleString()} characters ready
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={doc.status === "uploading"}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocument(doc.id);
                  }}
                  aria-label={`Remove ${doc.name}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function ChatAttachmentBar({
  documents,
  uploadFile,
  removeDocument,
  disabled,
  maxFiles = 3,
}: {
  documents: UploadedDocument[];
  uploadFile: (file: File) => Promise<void>;
  removeDocument: (id: string) => void;
  disabled?: boolean;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const atLimit =
    documents.filter((d) => d.status !== "error").length >= maxFiles;

  return (
    <div className="space-y-2 border-t bg-muted/20 px-4 py-2">
      {documents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/90 px-2.5 py-1 text-xs font-medium text-sky-900"
            >
              <FileText className="h-3 w-3 shrink-0" aria-hidden />
              <span className="max-w-[160px] truncate">{doc.name}</span>
              {doc.status === "uploading" ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : doc.status === "error" ? (
                <span className="text-destructive">!</span>
              ) : null}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-sky-200/60"
                disabled={doc.status === "uploading"}
                onClick={() => removeDocument(doc.id)}
                aria-label={`Remove ${doc.name}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !atLimit) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled && !atLimit && e.dataTransfer.files[0]) {
            void uploadFile(e.dataTransfer.files[0]);
          }
        }}
        className={cn(
          "flex items-center gap-2 rounded-lg transition-colors",
          isDragging && "bg-sky-50/80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={DOCUMENT_ACCEPT}
          className="sr-only"
          disabled={disabled || atLimit}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground"
          disabled={disabled || atLimit}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden />
          Attach file (PDF, DOCX, TXT, Excel)
        </Button>
      </div>
    </div>
  );
}
