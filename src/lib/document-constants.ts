export const DOCUMENT_ACCEPT =
  ".pdf,.docx,.txt,.xlsx,.xls,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "text",
  "xlsx",
  "xls",
  "csv",
]);

export function getFileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

export function isAllowedDocument(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  const mime = file.type.toLowerCase();
  return (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("text") ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime === "application/vnd.ms-excel"
  );
}

export function buildDocumentContextBlock(
  files: { name: string; text: string }[]
): string {
  if (files.length === 0) return "";
  return files
    .map((f, i) => `### Document ${i + 1}: ${f.name}\n${f.text}`)
    .join("\n\n");
}
