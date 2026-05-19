"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { StoryObject } from "@/types";
import { PersonaChip } from "@/components/shared/PersonaChip";
import { formatTime } from "@/lib/format";
import { usePersonas } from "@/hooks/usePersonas";

interface TodayCalendarStripProps {
  stories: StoryObject[];
}

export function TodayCalendarStrip({ stories }: TodayCalendarStripProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const scheduled = useMemo(
    () =>
      stories
        .filter(
          (s) =>
            (s.status === "SCHEDULED" || s.status === "PUBLISHED") &&
            s.scheduled_time !== null
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_time!).getTime() -
            new Date(b.scheduled_time!).getTime()
        ),
    [stories]
  );

  return (
    <div className="rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 ease-in-out hover:shadow-[var(--shadow-1)]">
      <p className="font-heading text-[15px] font-medium text-text-1 mb-4">Today&apos;s Schedule</p>
      {scheduled.length === 0 ? (
        <p className="text-[13px] text-text-3">
          No stories scheduled today
        </p>
      ) : (
        <div className="space-y-3">
          {scheduled.map((story) => {
            const persona = personasList.find(
              (p) => p.persona_id === story.assigned_persona
            );

            return (
              <div key={story.story_id} className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-text-3 w-12">
                  {formatTime(story.scheduled_time!)}
                </span>
                {story.status === "PUBLISHED" && (
                  <span className="h-2 w-2 rounded-full bg-[#5B9A6F] shrink-0" />
                )}
                {persona && (
                  <PersonaChip
                    handle={persona.account_handle}
                    avatarColor={persona.avatar_color}
                  />
                )}
                <span className="text-[13px] text-text-1 truncate flex-1">
                  {story.headline}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <Link
        href="/calendar"
        className="text-[13px] text-genesis-accent hover:underline mt-4 inline-block transition-colors duration-150"
      >
        View full calendar →
      </Link>
    </div>
  );
}
