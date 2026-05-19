"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useSearchParams } from "next/navigation";
import { Bot } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { useAccountContext } from "@/context/AccountContext";

export interface ToolCallBlock {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "running" | "done";
}

interface Message {
  id: string;
  role: "user" | "eic";
  content: string;
  time?: string;
  hasPostPreview?: boolean;
  toolCalls?: ToolCallBlock[];
}

export interface EICChatWindowHandle {
  sendCommand: (command: string) => void;
}

interface EICChatWindowProps {
  threadId: string | null;
}

function createId(): string {
  return crypto.randomUUID();
}

function formatTime(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? "p" : "a";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes}${period}`;
}

export const EICChatWindow = forwardRef<EICChatWindowHandle, EICChatWindowProps>(
  function EICChatWindow({ threadId }, ref) {
    const { activeAccount } = useAccountContext();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    // Track which threadIds (or "legacy" for null) have already had init called
    const initCalledRef = useRef<Set<string>>(new Set());

    const initChat = useCallback(
      async (tid: string | null, aid: string) => {
        const key = tid ?? "legacy";
        if (initCalledRef.current.has(key)) return;
        initCalledRef.current.add(key);

        const greetingId = createId();
        setIsTyping(true);

        try {
          const res = await fetch("/api/chat/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: aid, threadId: tid }),
          });

          if (res.headers.get("content-type")?.includes("application/json")) {
            const data = await res.json();
            if (data.skip || data.error) return;
          }

          const reader = res.body?.getReader();
          if (!reader) return;

          const decoder = new TextDecoder();
          let accumulated = "";
          let messageAdded = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") break;

              try {
                const { token, error } = JSON.parse(payload);
                if (error) break;
                if (!token) continue;

                accumulated += token;

                if (!messageAdded) {
                  messageAdded = true;
                  setIsTyping(false);
                  setMessages((prev) => [
                    ...prev,
                    { id: greetingId, role: "eic", content: accumulated, time: formatTime() },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === greetingId ? { ...m, content: accumulated } : m,
                    ),
                  );
                }
              } catch {
                // malformed SSE line, skip
              }
            }
          }
        } catch {
          // Silently fail — user can still chat normally
        } finally {
          setIsTyping(false);
        }
      },
      [],
    );

    // Load history whenever account or thread changes
    useEffect(() => {
      if (!activeAccount?.id) return;

      setMessages([]);

      async function loadHistory() {
        try {
          const url =
            `/api/chat/history?accountId=${encodeURIComponent(activeAccount!.id)}` +
            (threadId ? `&threadId=${encodeURIComponent(threadId)}` : "");
          const res = await fetch(url);
          if (!res.ok) return;

          const data: Array<{
            id: string;
            role: "user" | "eic";
            content: string;
            created_at: string;
          }> = await res.json();

          if (data.length > 0) {
            setMessages(
              data.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                time: formatTime(m.created_at),
              })),
            );
          } else if (threadId) {
            // New thread with no history — generate a greeting
            initChat(threadId, activeAccount!.id);
          }
        } catch {
          // Fail silently
        }
      }

      loadHistory();
    }, [activeAccount?.id, threadId, initChat]);

    // Legacy: auto-trigger EIC greeting only when arriving from launch flow
    useEffect(() => {
      const justLaunched = searchParams.get("launched") === "true";
      const launchAccountId = searchParams.get("accountId");
      if (!justLaunched || !launchAccountId) return;

      // Clean up the query params so refreshes don't re-trigger
      window.history.replaceState(null, "", "/chat");

      initChat(null, launchAccountId);
    }, [searchParams, initChat]);

    // Auto-scroll on new messages
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages, isTyping]);

    const addEicResponse = useCallback(
      async (userText: string) => {
        setIsTyping(true);
        const msgId = createId();

        try {
          const res = await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userText,
              accountId: activeAccount?.id,
              threadId: threadId ?? undefined,
            }),
          });

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No stream body");

          const decoder = new TextDecoder();
          let lineBuffer = "";
          let messageAdded = false;
          let streamDone = false;

          const ensureMessage = () => {
            if (!messageAdded) {
              messageAdded = true;
              setIsTyping(false);
              setMessages((prev) => [
                ...prev,
                { id: msgId, role: "eic" as const, content: "", time: formatTime(), toolCalls: [] },
              ]);
            }
          };

          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;

            lineBuffer += decoder.decode(value, { stream: true });
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();

              let event: Record<string, unknown>;
              try {
                event = JSON.parse(payload);
              } catch {
                continue;
              }

              if (event.type === "token") {
                ensureMessage();
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId
                      ? { ...m, content: m.content + (event.text as string) }
                      : m,
                  ),
                );
              } else if (event.type === "tool_start") {
                ensureMessage();
                const tc: ToolCallBlock = {
                  id: event.id as string,
                  name: event.name as string,
                  input: (event.input as Record<string, unknown>) ?? {},
                  status: "running",
                };
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId
                      ? { ...m, toolCalls: [...(m.toolCalls ?? []), tc] }
                      : m,
                  ),
                );
              } else if (event.type === "tool_end") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId
                      ? {
                          ...m,
                          toolCalls: (m.toolCalls ?? []).map((tc) =>
                            tc.id === (event.id as string)
                              ? { ...tc, output: event.output as string, status: "done" as const }
                              : tc,
                          ),
                        }
                      : m,
                  ),
                );
              } else if (event.type === "done") {
                streamDone = true;
                break;
              } else if (event.type === "error") {
                ensureMessage();
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId
                      ? {
                          ...m,
                          content:
                            m.content || "Sorry, something went wrong. Please try again.",
                        }
                      : m,
                  ),
                );
                streamDone = true;
                break;
              }
            }
          }

          if (!messageAdded) {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              { id: msgId, role: "eic" as const, content: "", time: formatTime(), toolCalls: [] },
            ]);
          }
        } catch {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: msgId,
              role: "eic" as const,
              content: "Sorry, I'm having trouble connecting. Please try again.",
              time: formatTime(),
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      },
      [activeAccount?.id, threadId],
    );

    const handleSend = useCallback(
      (text: string) => {
        setMessages((prev) => [
          ...prev,
          { id: createId(), role: "user", content: text, time: formatTime() },
        ]);
        addEicResponse(text);
      },
      [addEicResponse],
    );

    useImperativeHandle(ref, () => ({
      sendCommand: (command: string) => {
        handleSend(command);
      },
    }));

    return (
      <div className="flex flex-col h-full min-w-0">
        {/* Topbar */}
        <div className="h-14 border-b border-border flex items-center px-6 gap-3 bg-surface-1 flex-shrink-0 transition-colors duration-500">
          <span className="text-[15px] font-semibold text-text-1 flex-1">
            Editor-in-Chief
          </span>
          <span className="text-xs text-text-3">
            {messages.length > 0 ? `${messages.length} messages` : ""}
          </span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-8 px-6">
          <div className="max-w-[720px] w-full mx-auto flex flex-col gap-6">
            {messages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-text-2 mb-4">
                  <Bot className="size-6" />
                </div>
                <p className="text-sm text-text-2 font-medium">
                  Editor-in-Chief
                </p>
                <p className="text-xs text-text-3 mt-1 max-w-sm">
                  Your newsroom editor. Ask about pipeline status, agent performance, budgets, or give editorial direction.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Thinking indicator */}
            {isTyping && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-3 flex-shrink-0 flex items-center justify-center text-text-2">
                  <Bot className="size-[15px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex gap-1">
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                    </div>
                    <span className="text-xs text-text-3 italic">
                      Working on it...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <ChatComposer onSend={handleSend} />
      </div>
    );
  }
);
