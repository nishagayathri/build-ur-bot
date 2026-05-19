"use client";

import type { AccountPersona } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

interface CalendarFiltersProps {
  personas: AccountPersona[];
  selectedPersonas: string[];
  onToggle: (id: string) => void;
}

export function CalendarFilters({
  personas,
  selectedPersonas,
  onToggle,
}: CalendarFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {personas.map((persona) => (
        <label
          key={persona.persona_id}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <Checkbox
            checked={selectedPersonas.includes(persona.persona_id)}
            onCheckedChange={() => onToggle(persona.persona_id)}
          />
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: persona.avatar_color }}
          />
          <span className="text-xs">{persona.account_handle}</span>
        </label>
      ))}
    </div>
  );
}
