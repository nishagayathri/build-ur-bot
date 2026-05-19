"use client";

import { usePersonaContext } from "@/context/PersonaContext";
import { Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PersonaRail() {
  const { personas, activePersona, setActivePersona } = usePersonaContext();

  return (
    <div className="w-14 border-r border-border bg-surface-1 flex flex-col items-center py-4 gap-3">
      {personas.map((persona) => (
        <button
          key={persona.persona_id}
          onClick={() => setActivePersona(persona)}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold transition-all duration-150 ease-out",
            activePersona?.persona_id === persona.persona_id &&
              "ring-2 ring-genesis-accent ring-offset-2 ring-offset-background"
          )}
          style={{ backgroundColor: persona.avatar_color }}
        >
          {persona.display_name.charAt(0)}
        </button>
      ))}
      <Link
        href="/settings"
        className="mt-auto flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] text-text-3 hover:text-text-1 hover:bg-surface-2 transition-all duration-150 ease-out"
      >
        <Settings className="h-4 w-4" />
      </Link>
    </div>
  );
}
