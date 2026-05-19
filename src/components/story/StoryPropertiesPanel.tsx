"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { EntityChip } from "@/components/shared/EntityChip";
import { PersonaChip } from "@/components/shared/PersonaChip";
import { MetricCard } from "@/components/shared/MetricCard";
import { Separator } from "@/components/ui/separator";
import { StoryActionButtons } from "@/components/story/StoryActionButtons";
import { timeAgo, formatDateTime, formatNumber } from "@/lib/format";
import { usePersonas } from "@/hooks/usePersonas";
import type { StoryObject } from "@/types";

interface StoryPropertiesPanelProps {
  story: StoryObject;
}

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-[11px] text-muted-foreground uppercase font-semibold shrink-0">
        {label}
      </span>
      <div className="text-[13px] text-right">{children}</div>
    </div>
  );
}

export function StoryPropertiesPanel({ story }: StoryPropertiesPanelProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const persona = story.assigned_persona
    ? personasList.find((p) => p.account_handle === story.assigned_persona)
    : null;

  return (
    <div className="sticky top-4 w-full lg:w-72 space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-1">
        <h3 className="text-sm font-medium mb-3">Properties</h3>

        <PropertyRow label="Status">
          <StatusBadge status={story.status} />
        </PropertyRow>

        <PropertyRow label="Priority">
          <PriorityBadge priority={story.priority} />
        </PropertyRow>

        <PropertyRow label="Entity">
          <EntityChip entity={story.entity} entityType={story.entity_type} />
        </PropertyRow>

        <PropertyRow label="Persona">
          {persona ? (
            <PersonaChip
              handle={persona.account_handle}
              avatarColor={persona.avatar_color}
            />
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </PropertyRow>

        <PropertyRow label="Scheduled">
          {story.scheduled_time ? (
            <span>{formatDateTime(story.scheduled_time)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </PropertyRow>

        <PropertyRow label="Signals">
          <span>{story.signals_stacked.length}</span>
        </PropertyRow>

        <PropertyRow label="Virality">
          <span>
            {story.virality_score !== null ? story.virality_score : "—"}
          </span>
        </PropertyRow>

        {story.published_url && (
          <PropertyRow label="Published">
            <a
              href={story.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline truncate max-w-[140px] block"
            >
              View post ↗
            </a>
          </PropertyRow>
        )}

        <PropertyRow label="Created">
          <span>{timeAgo(story.created_at)}</span>
        </PropertyRow>

        <PropertyRow label="Updated">
          <span>{timeAgo(story.updated_at)}</span>
        </PropertyRow>
      </div>

      {story.status === "PUBLISHED" && story.performance && (
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Impressions"
            value={formatNumber(story.performance.impressions)}
          />
          <MetricCard
            label="Engagements"
            value={formatNumber(story.performance.engagements)}
          />
          <MetricCard
            label="Clicks"
            value={formatNumber(story.performance.clicks)}
          />
          <MetricCard
            label="Retweets"
            value={formatNumber(story.performance.retweets)}
          />
        </div>
      )}

      <Separator />

      <StoryActionButtons story={story} />
    </div>
  );
}
