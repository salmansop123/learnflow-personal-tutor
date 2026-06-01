import "server-only";

import { getFileExtension, isAllowedDocument } from "@/lib/document-constants";

const MAX_EXTRACT_CHARS = 28_000;

function truncateText(text: string): string {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (trimmed.length <= MAX_EXTRACT_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_EXTRACT_CHARS)}\n\n[Content truncated for length…]`;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text ?? "";
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractExcel(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames.slice(0, 3)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      parts.push(`## Sheet: ${sheetName}\n${csv}`);
    }
  }
  return parts.join("\n\n");
}

export async function extractTextFromFile(
  file: File
): Promise<{ text: string; extension: string }> {
  if (!isAllowedDocument(file)) {
    throw new Error(
      "Unsupported file type. Use PDF, DOCX, TXT, or Excel (.xlsx, .xls, .csv)."
    );
  }

  const ext = getFileExtension(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("File must be 8MB or smaller.");
  }

  let raw = "";

  if (ext === "pdf" || file.type.includes("pdf")) {
    raw = await extractPdf(buffer);
  } else if (ext === "docx" || file.type.includes("word")) {
    raw = await extractDocx(buffer);
  } else if (
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "csv" ||
    file.type.includes("spreadsheet") ||
    file.type.includes("excel")
  ) {
    raw = await extractExcel(buffer);
  } else {
    raw = buffer.toString("utf-8");
  }

  const text = truncateText(raw);
  if (!text) {
    throw new Error("No readable text found in this file.");
  }

  return { text, extension: ext || "txt" };
}
