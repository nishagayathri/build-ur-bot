"use client";

import Link from "next/link";
import { TableRow, TableCell } from "@/components/ui/table";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { EntityChip } from "@/components/shared/EntityChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PersonaChip } from "@/components/shared/PersonaChip";
import { timeAgo } from "@/lib/format";
import { usePersonas } from "@/hooks/usePersonas";
import type { StoryObject } from "@/types";

interface StoryRowProps {
  story: StoryObject;
}

export function StoryRow({ story }: StoryRowProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const persona = story.assigned_persona
    ? personasList.find((p) => p.account_handle === story.assigned_persona)
    : null;

  return (
    <TableRow className="cursor-pointer">
      <TableCell>
        <PriorityBadge priority={story.priority} />
      </TableCell>
      <TableCell>
        <EntityChip entity={story.entity} entityType={story.entity_type} />
      </TableCell>
      <TableCell className="max-w-[280px]">
        <Link
          href={`/story/${story.story_id}`}
          className="text-[13px] font-medium hover:underline line-clamp-1"
        >
          {story.headline}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={story.status} />
      </TableCell>
      <TableCell>
        {persona ? (
          <PersonaChip
            handle={persona.account_handle}
            avatarColor={persona.avatar_color}
          />
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-[13px]">{story.signals_stacked.length}</span>
      </TableCell>
      <TableCell>
        <span className="text-[13px]">
          {story.virality_score !== null ? story.virality_score : "—"}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {timeAgo(story.created_at)}
        </span>
      </TableCell>
    </TableRow>
  );
}
