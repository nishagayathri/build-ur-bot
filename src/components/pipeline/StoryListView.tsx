"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { StoryRow } from "@/components/pipeline/StoryRow";
import { Button } from "@/components/ui/button";
import type { StoryObject } from "@/types";

interface StoryListViewProps {
  stories: StoryObject[];
}

type SortColumn =
  | "priority"
  | "entity"
  | "headline"
  | "status"
  | "signals"
  | "virality"
  | "created";

type SortDirection = "asc" | "desc";

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function StoryListView({ stories }: StoryListViewProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;

    return [...stories].sort((a, b) => {
      switch (sortColumn) {
        case "priority":
          return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
        case "entity":
          return a.entity.localeCompare(b.entity) * dir;
        case "headline":
          return a.headline.localeCompare(b.headline) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "signals":
          return (a.signals_stacked.length - b.signals_stacked.length) * dir;
        case "virality":
          return ((a.virality_score ?? 0) - (b.virality_score ?? 0)) * dir;
        case "created":
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            dir
          );
        default:
          return 0;
      }
    });
  }, [stories, sortColumn, sortDirection]);

  const headers: { label: string; column: SortColumn }[] = [
    { label: "Priority", column: "priority" },
    { label: "Entity", column: "entity" },
    { label: "Headline", column: "headline" },
    { label: "Status", column: "status" },
    { label: "Persona", column: "created" },
    { label: "Signals", column: "signals" },
    { label: "Virality", column: "virality" },
    { label: "Created", column: "created" },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((h) => (
            <TableHead key={h.label}>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs font-medium hover:bg-transparent"
                onClick={() => handleSort(h.column)}
              >
                {h.label}
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((story) => (
          <StoryRow key={story.story_id} story={story} />
        ))}
      </TableBody>
    </Table>
  );
}
