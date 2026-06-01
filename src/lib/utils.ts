import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function markdownToHtml(text: string): string {
  if (!text) return ""

  let html = text

  // Escape any existing HTML to prevent XSS before we add our own tags
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Bold: **text** or __text__
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__([\s\S]*?)__/g, "<strong>$1</strong>")

  // Italic: *text* or _text_  (single asterisk/underscore, not double)
  html = html.replace(/\*(?!\*)([\s\S]*?)(?<!\*)\*/g, "<em>$1</em>")
  html = html.replace(/_(?!_)([\s\S]*?)(?<!_)_/g, "<em>$1</em>")

  // Inline code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
  )

  // Code blocks: ```code```
  html = html.replace(
    /```[\w]*\n?([\s\S]*?)```/g,
    '<pre class="bg-gray-100 rounded p-3 my-2 overflow-x-auto text-sm font-mono whitespace-pre-wrap"><code>$1</code></pre>'
  )

  // Horizontal rule: ---
  html = html.replace(/^---$/gm, '<hr class="border-gray-200 my-3" />')

  // Headers: ### ## #
  html = html.replace(
    /^### (.*$)/gm,
    '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>'
  )
  html = html.replace(
    /^## (.*$)/gm,
    '<h2 class="text-lg font-bold mt-4 mb-1">$1</h2>'
  )
  html = html.replace(
    /^# (.*$)/gm,
    '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>'
  )

  // Unordered list items: * item or - item
  html = html.replace(/^[\*\-] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/g,
    (match) => `<ul class="my-2 space-y-0.5">${match}</ul>`
  )

  // Numbered list items: 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

  // Line breaks: double newline = paragraph break, single newline = <br>
  html = html.replace(/\n\n+/g, '</p><p class="mb-2">')
  html = '<p class="mb-2">' + html + "</p>"
  html = html.replace(/\n/g, "<br />")

  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-2"><\/p>/g, "")
  html = html.replace(/<p class="mb-2"><br \/><\/p>/g, "")

  return html
}
