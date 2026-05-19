"use client";

import Link from "next/link";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { EntityChip } from "@/components/shared/EntityChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PersonaChip } from "@/components/shared/PersonaChip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { timeAgo } from "@/lib/format";
import { usePersonas } from "@/hooks/usePersonas";
import type { StoryObject } from "@/types";

interface StoryCardProps {
  story: StoryObject;
}

export function StoryCard({ story }: StoryCardProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const persona = story.assigned_persona
    ? personasList.find((p) => p.account_handle === story.assigned_persona)
    : null;

  return (
    <Link href={`/story/${story.story_id}`}>
      <div className="rounded-xl border border-border p-3 bg-card hover:bg-accent/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={story.priority} />
          <EntityChip entity={story.entity} entityType={story.entity_type} />
          <span className="text-xs text-muted-foreground ml-auto">
            {timeAgo(story.created_at)}
          </span>
        </div>

        <p className="text-[13px] font-medium line-clamp-2 mt-2">
          {story.headline}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {story.signals_stacked.length > 1 && (
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-[11px] text-muted-foreground">
                ⚡ {story.signals_stacked.length} signals
              </span>
              <div className="flex-1">
                <Progress value={story.stacking_score} max={100} />
              </div>
            </div>
          )}

          {story.is_prepositioned && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-amber-500/20 text-amber-400"
            >
              PRE-POSITIONED
            </Badge>
          )}

          {story.sentiment_arbitrage && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-pink-500/20 text-pink-400"
            >
              ARBITRAGE
            </Badge>
          )}

          {story.virality_score !== null && story.virality_score > 80 && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-orange-500/20 text-orange-400"
            >
              🔥 High virality
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {persona ? (
            <PersonaChip
              handle={persona.account_handle}
              avatarColor={persona.avatar_color}
            />
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Unassigned
            </span>
          )}
          <StatusBadge status={story.status} />
        </div>
      </div>
    </Link>
  );
}
