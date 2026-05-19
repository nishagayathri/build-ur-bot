"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Plus, Search } from "lucide-react";
import { useAccountContext } from "@/context/AccountContext";
import { cn } from "@/lib/utils";

interface Thread {
  threadId: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ChatSidebarProps {
  activeThreadId: string | null;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
}

export function ChatSidebar({ activeThreadId, onNewChat, onSelectThread }: ChatSidebarProps) {
  const { activeAccount } = useAccountContext();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeAccount?.id) return;

    async function load() {
      try {
        const res = await fetch(
          `/api/chat/threads?accountId=${encodeURIComponent(activeAccount!.id)}`,
        );
        if (!res.ok) return;
        setThreads(await res.json());
      } catch {
        // Fail silently
      }
    }

    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [activeAccount?.id]);

  const filtered = search
    ? threads.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()),
      )
    : threads;

  return (
    <aside className="w-[280px] flex-shrink-0 bg-surface-1 border-r border-border flex flex-col transition-colors duration-500">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-2 border-b border-border">
        <h1 className="text-lg font-bold flex-1">Chat</h1>
        <button
          onClick={onNewChat}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-surface-3 transition-colors duration-150"
          title="New chat"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-surface-2 border-[1.5px] border-transparent rounded-lg pl-[34px] pr-3 text-[13px] font-sans text-text-1 outline-none placeholder:text-text-3 focus:border-genesis-accent focus:bg-surface-1 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 genesis-scrollbar">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center text-text-3 mb-3">
              <MessageCircle className="size-4" />
            </div>
            <p className="text-xs text-text-3">
              {search ? "No matching conversations." : "No conversations yet. Hit + to start one."}
            </p>
          </div>
        )}

        {filtered.map((thread) => {
          const isActive = thread.threadId === activeThreadId;
          return (
            <button
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
              className={cn(
                "w-full flex items-start gap-2.5 px-3 py-3 rounded-lg mb-0.5",
                "border-l-[3px] text-left transition-colors duration-150",
                isActive
                  ? "border-l-genesis-accent bg-surface-2"
                  : "border-l-transparent hover:bg-surface-2",
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-3 text-text-3 mt-0.5">
                <MessageCircle className="size-[14px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-text-1 truncate">
                    {thread.title}
                  </span>
                  {thread.lastMessageAt && (
                    <span className="text-[10px] text-text-4 flex-shrink-0">
                      {formatRelativeTime(thread.lastMessageAt)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-text-4 mt-1 inline-block">
                  {thread.messageCount} message{thread.messageCount !== 1 ? "s" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
