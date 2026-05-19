"use client";

import { useMemo } from "react";
import type { StoryObject } from "@/types";
import { CalendarSlot } from "@/components/calendar/CalendarSlot";
import { usePersonas } from "@/hooks/usePersonas";

interface CalendarWeekViewProps {
  stories: StoryObject[];
  weekStart: Date;
  selectedPersonas: string[];
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const HOUR_HEIGHT = 48;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayColumn(date: Date, weekStart: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.floor((date.getTime() - weekStart.getTime()) / dayMs);
  return diff;
}

function formatDayHeader(weekStart: Date, dayIndex: number): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  return `${DAY_NAMES[dayIndex]} ${date.getDate()}`;
}

export function CalendarWeekView({
  stories,
  weekStart,
  selectedPersonas,
}: CalendarWeekViewProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const storiesByDay = useMemo(() => {
    const days: StoryObject[][] = Array.from({ length: 7 }, () => []);

    for (const story of stories) {
      if (!story.scheduled_time) continue;
      const date = new Date(story.scheduled_time);
      const col = getDayColumn(date, weekStart);
      if (col >= 0 && col < 7) {
        days[col].push(story);
      }
    }

    return days;
  }, [stories, weekStart]);

  return (
    <div className="flex overflow-auto border border-border rounded-lg">
      <div className="shrink-0 w-14 border-r border-border">
        <div className="h-10 border-b border-border" />
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="border-b border-border text-[11px] text-muted-foreground text-right pr-2 flex items-start justify-end"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {Array.from({ length: 7 }).map((_, dayIndex) => {
        const dayStories = storiesByDay[dayIndex];

        return (
          <div
            key={dayIndex}
            className="flex-1 min-w-[140px] border-r border-border last:border-r-0"
          >
            <div className="h-10 border-b border-border flex items-center justify-center text-xs font-medium">
              {formatDayHeader(weekStart, dayIndex)}
            </div>

            <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}

              {dayStories.map((story) => {
                if (!story.scheduled_time) return null;
                const date = new Date(story.scheduled_time);
                const hour = date.getHours();
                const minute = date.getMinutes();
                const top = (hour - 6) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
                const persona = story.assigned_persona
                  ? personasList.find((p) => p.account_handle === story.assigned_persona)
                  : undefined;

                return (
                  <div
                    key={story.story_id}
                    className="absolute left-1 right-1"
                    style={{ top: `${top}px` }}
                  >
                    <CalendarSlot story={story} persona={persona} />
                  </div>
                );
              })}

            </div>
          </div>
        );
      })}
    </div>
  );
}
