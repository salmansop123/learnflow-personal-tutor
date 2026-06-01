import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecentChatRow } from "@/types/dashboard";

export function RecentChats({ chats }: { chats: RecentChatRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent chats</CardTitle>
          <CardDescription>AI tutor conversations</CardDescription>
        </div>
        <Link
          href="/dashboard/ai-tutor"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {chats.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Ask the AI tutor anything pick a subject or chat freely."
            actionLabel="Start chatting"
            actionHref="/dashboard/ai-tutor"
            className="py-8"
          />
        ) : (
          <ul className="space-y-3">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href="/dashboard/ai-tutor"
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                >
                  <MessageSquare
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.subject ? `${chat.subject} · ` : ""}
                      {formatDistanceToNow(new Date(chat.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
