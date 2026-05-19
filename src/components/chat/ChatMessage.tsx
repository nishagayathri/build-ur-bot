"use client";

import { useState } from "react";
import { Bot, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { ChatPostPreview } from "@/components/chat/ChatPostPreview";
import type { ToolCallBlock } from "@/components/chat/EICChatWindow";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    role: "user" | "eic";
    content: string;
    time?: string;
    hasPostPreview?: boolean;
    toolCalls?: ToolCallBlock[];
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;

  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-semibold ${isUser
            ? "bg-genesis-accent-subtle text-genesis-accent"
            : "bg-surface-3 text-text-2"
          }`}
      >
        {isUser ? "AC" : <Bot className="size-[15px]" />}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-3 mb-1 flex items-center gap-2">
          {isUser ? "You" : "Marketary"}
          {message.time && (
            <span className="font-normal text-text-4">{message.time}</span>
          )}
        </div>
        <div className="text-sm leading-[1.65] text-text-1">
          {hasToolCalls && (
            <div className="mb-3 flex flex-col gap-1.5">
              {message.toolCalls!.map((tc) => (
                <ToolCallChip key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}
          {message.content && <MessageContent content={message.content} />}
          {message.hasPostPreview && <ChatPostPreview />}
        </div>
      </div>
    </div>
  );
}

function ToolCallChip({ toolCall }: { toolCall: ToolCallBlock }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface-2 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-surface-3 transition-colors"
      >
        <div className="flex-shrink-0">
          {toolCall.status === "running" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-text-3" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          )}
        </div>
        <code className="font-mono text-text-2 flex-1">{toolCall.name}</code>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-text-4 transition-transform flex-shrink-0",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2.5 space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-4 mb-1">
              Input
            </p>
            <pre className="font-mono text-text-2 bg-surface-3 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          {toolCall.output && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-4 mb-1">
                Output
              </p>
              <pre className="font-mono text-text-2 bg-surface-3 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                {toolCall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const paragraphs = content.split("\n\n");

  return (
    <>
      {paragraphs.map((paragraph, i) => {
        const lines = paragraph.split("\n");
        const isBulletList = lines.every(
          (l) => l.startsWith("• ") || l.startsWith("- ") || l.trim() === ""
        );

        if (isBulletList && lines.some((l) => l.startsWith("• ") || l.startsWith("- "))) {
          return (
            <ul key={i} className="my-2 pl-5 flex flex-col gap-1">
              {lines
                .filter((l) => l.startsWith("• ") || l.startsWith("- "))
                .map((line, j) => (
                  <li
                    key={j}
                    className="text-sm leading-[1.5] text-text-2 marker:text-genesis-accent"
                  >
                    <InlineFormatted text={line.replace(/^[•\-]\s*/, "")} />
                  </li>
                ))}
            </ul>
          );
        }

        return (
          <p key={i} className={i < paragraphs.length - 1 ? "mb-2.5" : ""}>
            <InlineFormatted text={paragraph} />
          </p>
        );
      })}
    </>
  );
}

function InlineFormatted({ text }: { text: string }) {
  // Handle **bold** and `code` inline formatting
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="font-mono text-xs bg-surface-3 px-1.5 py-0.5 rounded text-text-2"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        // Preserve newlines within paragraphs
        return part.split("\n").map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ));
      })}
    </>
  );
}
