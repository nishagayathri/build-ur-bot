"use client";

import type { StoryObject } from "@/types";
import { EntityChip } from "@/components/shared/EntityChip";
import { PersonaChip } from "@/components/shared/PersonaChip";
import { timeAgo } from "@/lib/format";
import { priorityConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import { usePersonas } from "@/hooks/usePersonas";

interface InboxStoryRowProps {
  story: StoryObject;
  isSelected: boolean;
  onClick: () => void;
}

export function InboxStoryRow({ story, isSelected, onClick }: InboxStoryRowProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const persona = story.assigned_persona
    ? personasList.find((p) => p.account_handle === story.assigned_persona)
    : undefined;

  const priorityDotColor = priorityConfig[story.priority].className.includes("red")
    ? "bg-red-500"
    : priorityConfig[story.priority].className.includes("orange")
      ? "bg-orange-500"
      : priorityConfig[story.priority].className.includes("blue")
        ? "bg-blue-500"
        : "bg-muted-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border border-l-2 border-l-amber-500 w-full text-left",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", priorityDotColor)} />
      <EntityChip entity={story.entity} entityType={story.entity_type} />
      <span className="text-[13px] truncate flex-1">{story.headline}</span>
      {persona && (
        <PersonaChip
          handle={persona.account_handle}
          avatarColor={persona.avatar_color}
        />
      )}
      <span className="text-xs text-muted-foreground shrink-0">
        {timeAgo(story.created_at)}
      </span>
    </button>
  );
}
