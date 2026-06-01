import { markdownToHtml } from "@/lib/utils";

/** Shared HTML rendering styles when @tailwindcss/typography is not installed. */
export const NOTE_CONTENT_HTML_CLASS =
  "max-w-none text-sm text-muted-foreground [&_em]:italic [&_li]:mb-1 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5";

export const NOTE_CONTENT_HTML_CLASS_PREVIEW = NOTE_CONTENT_HTML_CLASS;

export const NOTE_CONTENT_MARKDOWN_CLASS =
  "text-sm text-gray-800 leading-relaxed [&_strong]:font-bold [&_em]:italic [&_code]:font-mono [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-0.5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_pre]:bg-gray-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:text-xs [&_hr]:border-gray-200 [&_p]:mb-2 [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200";

export const NOTE_CONTENT_MARKDOWN_PREVIEW_CLASS =
  "text-sm text-gray-600 line-clamp-3 overflow-hidden [&_strong]:font-bold [&_em]:italic [&_*]:text-gray-600";

/** Markdown from AI tutor / plain text, or HTML from the rich-text editor. */
export function noteContentDisplayHtml(content: string): string {
  if (!content) return "";
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  return markdownToHtml(content);
}

/** HTML block for an embedded screenshot with number, optional title, and delete control. */
export function buildNoteImageBlockHtml(imageUrl: string, imageNumber: number): string {
  const safeUrl = imageUrl.replace(/"/g, "&quot;");
  const n = String(imageNumber);
  return `<div data-note-image="true" contenteditable="false" class="note-embedded-image my-6"><button type="button" data-note-image-delete="" class="note-image-delete-btn" aria-label="Remove screenshot" title="Remove image">×</button><div class="note-image-header"><span data-note-image-number="" class="note-image-number">${n}</span><input type="text" data-note-image-title="" placeholder="Add your screenshot title" class="note-image-title-input" value="" /></div><img src="${safeUrl}" alt="Screenshot ${n}" class="note-embedded-image-img" /></div>`;
}

export function countEmbeddedImagesInHtml(html: string): number {
  if (!html) return 0;
  const matches = html.match(/data-note-image="true"/g);
  return matches?.length ?? 0;
}

/** Re-label screenshot numbers after one is removed (1, 2, 3, …). */
export function renumberEmbeddedImagesInHtml(html: string): string {
  if (!html || typeof document === "undefined") return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  renumberEmbeddedImagesInElement(container);
  return container.innerHTML;
}

export function renumberEmbeddedImagesInElement(root: ParentNode): void {
  const blocks = root.querySelectorAll("[data-note-image]");
  blocks.forEach((block, index) => {
    const num = index + 1;
    const badge = block.querySelector("[data-note-image-number]");
    if (badge) badge.textContent = String(num);
    const img = block.querySelector("img");
    if (img) img.alt = `Screenshot ${num}`;
  });
}

/** Read-only view for note preview (no inputs / delete buttons). */
export function polishNoteImagesForReadonly(html: string): string {
  if (!html.includes("data-note-image") || typeof document === "undefined") {
    return html;
  }
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("[data-note-image]").forEach((block) => {
    block.querySelector("[data-note-image-delete]")?.remove();
    const num = block.querySelector("[data-note-image-number]")?.textContent?.trim();
    const titleInput = block.querySelector(
      "[data-note-image-title]"
    ) as HTMLInputElement | null;
    const customTitle = titleInput?.value?.trim();
    titleInput?.remove();

    const header = block.querySelector(".note-image-header");
    if (header) {
      const label = document.createElement("p");
      label.className = "note-image-readonly-caption";
      if (customTitle) {
        label.innerHTML = `<span class="note-image-number">${num ?? ""}</span> ${customTitle}`;
      } else if (num) {
        label.innerHTML = `<span class="note-image-number">${num}</span> <span class="note-image-title-hint">Screenshot</span>`;
      }
      header.replaceWith(label);
    }
  });
  return container.innerHTML;
}

export function prepareContentForEditor(content: string): string {
  if (!content) return "";
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  return content.replace(/\n/g, "<br>");
}

export function isNoteContentEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

export function noteContentPlainText(html: string): string {
  if (!html) return "";
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.replace(/\r\n/g, "\n").trim();
  }
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strip common markdown markers for cleaner list previews. */
function stripMarkdownMarkers(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^```[\s\S]*?```/gm, "[code block]")
    .replace(/^---$/gm, "")
    .trim();
}

/** Short plain-text excerpt for note list cards (line-clamp works on text nodes only). */
export function noteContentPreviewText(content: string, maxLines = 5): string {
  const plain = stripMarkdownMarkers(noteContentPlainText(content));
  if (!plain) return "";

  const lines = plain.split("\n").map((l) => l.trim()).filter(Boolean);
  const excerpt = lines.slice(0, maxLines).join("\n");
  const maxChars = maxLines * 120;
  if (excerpt.length <= maxChars) return excerpt;
  return `${excerpt.slice(0, maxChars).trim()}…`;
}
