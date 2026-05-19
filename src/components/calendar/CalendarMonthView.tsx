"use client";

import { useMemo } from "react";
import type { StoryObject } from "@/types";
import { storyStatusConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  stories: StoryObject[];
  currentMonth: Date;
  onDayClick: (day: Date) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const totalDays = lastDay.getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function CalendarMonthView({ stories, currentMonth, onDayClick }: CalendarMonthViewProps) {

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const storiesByDay = useMemo(() => {
    const map = new Map<number, StoryObject[]>();
    for (const story of stories) {
      if (!story.scheduled_time) continue;
      const date = new Date(story.scheduled_time);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(story);
      }
    }
    return map;
  }, [stories, year, month]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="border-b border-border py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const dayStories = day ? storiesByDay.get(day) ?? [] : [];
          const today = new Date();
          const isToday =
            day !== null &&
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;

          const statusCounts = new Map<string, number>();
          for (const s of dayStories) {
            const dotColor = storyStatusConfig[s.status].dotColor;
            statusCounts.set(dotColor, (statusCounts.get(dotColor) ?? 0) + 1);
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (day !== null) {
                  onDayClick(new Date(year, month, day));
                }
              }}
              disabled={day === null}
              className={cn(
                "min-h-[80px] border-b border-r border-border p-2 text-left transition-colors",
                day === null && "bg-muted/20",
                day !== null && "hover:bg-accent/50 cursor-pointer",
                isToday && "bg-primary/5"
              )}
            >
              {day !== null && (
                <>
                  <span className="text-xs font-medium">{day}</span>
                  {dayStories.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {Array.from(statusCounts.entries()).map(([dotColor, count]) => (
                        <span
                          key={dotColor}
                          className={cn(
                            "inline-flex items-center justify-center h-4 min-w-[16px] rounded-full text-[10px] text-white font-medium px-1",
                            dotColor
                          )}
                        >
                          {count}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
