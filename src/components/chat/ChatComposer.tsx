"use client";

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp, Paperclip } from "lucide-react";

interface ChatComposerProps {
  onSend: (message: string) => void;
  initialValue?: string;
}

export function ChatComposer({ onSend, initialValue }: ChatComposerProps) {
  const [text, setText] = useState(initialValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue !== undefined) {
      setText(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="px-6 pt-4 pb-6 bg-background transition-colors duration-500">
      <div className="max-w-[720px] mx-auto relative bg-surface-1 border-[1.5px] border-border rounded-xl transition-all duration-200 focus-within:border-genesis-accent focus-within:shadow-[0_0_0_3px_var(--genesis-accent-subtle)]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Marketary..."
          rows={1}
          className="w-full min-h-[48px] max-h-[160px] resize-none border-none outline-none bg-transparent px-4 pr-24 py-3.5 text-sm leading-[1.5] font-sans text-text-1 placeholder:text-text-3"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-transparent flex items-center justify-center text-text-3 hover:bg-surface-3 hover:text-text-1 transition-colors duration-200 cursor-pointer"
          >
            <Paperclip className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-9 h-9 rounded-lg bg-genesis-accent text-white flex items-center justify-center transition-all duration-200 hover:opacity-85 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
      <div className="max-w-[720px] mx-auto mt-2 text-[11px] text-text-4 text-center">
        Marketary can make mistakes. Verify important actions.
      </div>
    </div>
  );
}
