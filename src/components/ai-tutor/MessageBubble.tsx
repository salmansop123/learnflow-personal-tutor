import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { extractTextFromUIMessage } from "@/lib/ai-messages";

export function MessageBubble({
  message,
  children,
}: {
  message: UIMessage;
  children?: React.ReactNode;
}) {
  const isUser = message.role === "user";
  const text = extractTextFromUIMessage(message);

  if (!text && !children) return null;

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "gradient-brand text-primary-foreground shadow-soft"
            : "glass-panel border bg-card/80 text-foreground shadow-soft"
        )}
      >
        <p className="whitespace-pre-wrap">{text}</p>
        {children ? (
          <div className="mt-2 border-t border-border/40 pt-2">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
