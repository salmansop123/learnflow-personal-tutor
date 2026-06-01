import type { UIMessage } from "ai";

import type { MessageRow } from "@/types/ai";

export function messagesToUIMessages(rows: MessageRow[]): UIMessage[] {
  return rows
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({
      id: row.id,
      role: row.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: row.content }],
    }));
}

export function extractTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text"
    )
    .map((part) => part.text)
    .join("");
}

export function findLastUserMessage(messages: UIMessage[]): UIMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i];
  }
  return undefined;
}
