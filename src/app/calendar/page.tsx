"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { useStories } from "@/hooks/useStories";
import { usePersonas } from "@/hooks/usePersonas";
import { CalendarWeekView } from "@/components/calendar/CalendarWeekView";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { Button } from "@/components/ui/button";
import type { StoryObject } from "@/types";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${fmt.format(start)} – ${fmt.format(end)}, ${end.getFullYear()}`;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function CalendarPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();
  const { data: allStories } = useStories();
  const { data: personas } = usePersonas();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Calendar" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (personas && selectedPersonas.length === 0) {
      setSelectedPersonas(personas.map((p) => p.persona_id));
    }
  }, [personas, selectedPersonas.length]);

  const selectedHandles = useMemo(() => {
    if (!personas) return new Set<string>();
    return new Set(
      personas
        .filter((p) => selectedPersonas.includes(p.persona_id))
        .map((p) => p.account_handle)
    );
  }, [personas, selectedPersonas]);

  const filteredStories = useMemo<StoryObject[]>(() => {
    if (!allStories) return [];
    return allStories.filter((s) => {
      if (s.status !== "SCHEDULED" && s.status !== "PUBLISHED") return false;
      if (!s.scheduled_time) return false;
      if (
        selectedHandles.size > 0 &&
        s.assigned_persona &&
        !selectedHandles.has(s.assigned_persona)
      ) {
        return false;
      }
      return true;
    });
  }, [allStories, selectedHandles]);

  const handleTogglePersona = useCallback((id: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(getMonday(new Date()));
  }, []);

  const goToPrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return getMonday(next);
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return getMonday(next);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={viewMode === "week" ? goToPrevWeek : goToPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={viewMode === "week" ? goToNextWeek : goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <span className="text-sm font-medium ml-2">
            {viewMode === "week"
              ? formatWeekRange(currentWeekStart)
              : formatMonthLabel(currentWeekStart)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {personas && (
            <CalendarFilters
              personas={personas}
              selectedPersonas={selectedPersonas}
              onToggle={handleTogglePersona}
            />
          )}

          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === "week" ? (
          <CalendarWeekView
            stories={filteredStories}
            weekStart={currentWeekStart}
            selectedPersonas={selectedPersonas}
          />
        ) : (
          <CalendarMonthView
            stories={filteredStories}
            currentMonth={currentWeekStart}
            onDayClick={(day) => {
              setCurrentWeekStart(getMonday(day));
              setViewMode("week");
            }}
          />
        )}
      </div>
    </div>
  );
}
