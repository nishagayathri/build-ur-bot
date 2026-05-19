"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StoryStatus, EntityType, StoryPriority } from "@/types";
import { usePersonas } from "@/hooks/usePersonas";

interface PipelineFiltersState {
  status: StoryStatus[];
  entityType: EntityType[];
  priority: StoryPriority[];
  persona: string[];
  isPrepositioned: boolean | undefined;
  sentimentArbitrage: boolean | undefined;
  search: string;
}

interface PipelineFiltersProps {
  filters: PipelineFiltersState;
  onFiltersChange: (filters: PipelineFiltersState) => void;
}

const ALL_STATUSES: StoryStatus[] = [
  "DETECTED",
  "RANKED",
  "EIC_APPROVED",
  "WRITING",
  "REVISION",
  "HUMAN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "KILLED",
];

const ALL_ENTITY_TYPES: EntityType[] = [
  "FOREX",
  "CRYPTO",
  "INDEX",
  "EQUITY",
  "COMMODITY",
];

const ALL_PRIORITIES: StoryPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function PipelineFilters({
  filters,
  onFiltersChange,
}: PipelineFiltersProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  function handleStatusChange(status: StoryStatus) {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: next });
  }

  function handleEntityTypeChange(entityType: EntityType) {
    const next = filters.entityType.includes(entityType)
      ? filters.entityType.filter((e) => e !== entityType)
      : [...filters.entityType, entityType];
    onFiltersChange({ ...filters, entityType: next });
  }

  function handlePriorityChange(priority: StoryPriority) {
    const next = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: next });
  }

  function handlePersonaChange(personaId: string) {
    if (personaId === "all") {
      onFiltersChange({ ...filters, persona: [] });
      return;
    }
    const next = filters.persona.includes(personaId)
      ? filters.persona.filter((p) => p !== personaId)
      : [...filters.persona, personaId];
    onFiltersChange({ ...filters, persona: next });
  }

  function clearAll() {
    onFiltersChange({
      status: [],
      entityType: [],
      priority: [],
      persona: [],
      isPrepositioned: undefined,
      sentimentArbitrage: undefined,
      search: "",
    });
  }

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.entityType.length > 0 ||
    filters.priority.length > 0 ||
    filters.persona.length > 0 ||
    filters.isPrepositioned !== undefined ||
    filters.sentimentArbitrage !== undefined ||
    filters.search.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium">Filters</span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search headlines or entities..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <span className="text-[11px] uppercase text-muted-foreground font-semibold">
            Status
          </span>
          <Select
            value={filters.status.length === 1 ? filters.status[0] : ""}
            onValueChange={(v) => v && handleStatusChange(v as StoryStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  filters.status.length > 0
                    ? `${filters.status.length} selected`
                    : "All statuses"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase text-muted-foreground font-semibold">
            Entity Type
          </span>
          <Select
            value={filters.entityType.length === 1 ? filters.entityType[0] : ""}
            onValueChange={(v) => v && handleEntityTypeChange(v as EntityType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  filters.entityType.length > 0
                    ? `${filters.entityType.length} selected`
                    : "All types"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {ALL_ENTITY_TYPES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase text-muted-foreground font-semibold">
            Priority
          </span>
          <Select
            value={filters.priority.length === 1 ? filters.priority[0] : ""}
            onValueChange={(v) => v && handlePriorityChange(v as StoryPriority)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  filters.priority.length > 0
                    ? `${filters.priority.length} selected`
                    : "All priorities"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {ALL_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase text-muted-foreground font-semibold">
            Persona
          </span>
          <Select
            value={
              filters.persona.length === 1 ? filters.persona[0] : ""
            }
            onValueChange={(v) => v && handlePersonaChange(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  filters.persona.length > 0
                    ? `${filters.persona.length} selected`
                    : "All personas"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All personas</SelectItem>
              {personasList.map((p) => (
                <SelectItem key={p.persona_id} value={p.persona_id}>
                  {p.account_handle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-[13px]">
          <Checkbox
            checked={filters.isPrepositioned === true}
            onCheckedChange={(checked) =>
              onFiltersChange({
                ...filters,
                isPrepositioned: checked ? true : undefined,
              })
            }
          />
          Pre-positioned only
        </label>

        <label className="flex items-center gap-2 text-[13px]">
          <Checkbox
            checked={filters.sentimentArbitrage === true}
            onCheckedChange={(checked) =>
              onFiltersChange({
                ...filters,
                sentimentArbitrage: checked ? true : undefined,
              })
            }
          />
          Sentiment arbitrage only
        </label>
      </div>
    </div>
  );
}
