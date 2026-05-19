"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { AccountPersona } from "@/types";

interface DraftPostPreviewProps {
  content: string;
  persona?: AccountPersona;
}

export function DraftPostPreview({ content, persona }: DraftPostPreviewProps) {
  const engagement = useMemo(
    () => ({
      likes: Math.floor(Math.random() * 500) + 50,
      retweets: Math.floor(Math.random() * 200) + 10,
      views: Math.floor(Math.random() * 50000) + 5000,
    }),
    []
  );

  return (
    <div className="bg-muted/20 rounded-xl p-4 border border-border space-y-3">
      {persona && (
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: persona.avatar_color }}
          >
            {persona.display_name.charAt(0)}
          </span>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium">
              {persona.display_name}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {persona.account_handle}
              </span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                {persona.platform}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <p className="text-[13px] whitespace-pre-wrap">{content}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span>♡ {engagement.likes}</span>
        <span>🔁 {engagement.retweets}</span>
        <span>👁 {engagement.views.toLocaleString()}</span>
      </div>
    </div>
  );
}
