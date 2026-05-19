"use client";

import { Button } from "@/components/ui/button";

interface SuggestedCommandsProps {
  onCommandClick: (command: string) => void;
}

const COMMANDS = [
  "What's the most important story right now?",
  "What's trending in crypto?",
  "Show me the pipeline status",
  "Draft a post about the top story",
  "Why did you schedule that for 2pm?",
  "Pause all crypto content",
  "What did we post today?",
  "Show budget status",
  "Are we hitting posting targets?",
];

export function SuggestedCommands({ onCommandClick }: SuggestedCommandsProps) {
  return (
    <div className="w-full h-full border-r border-border bg-card p-3">
      <p className="text-[11px] uppercase text-muted-foreground font-semibold mb-3">
        Ask EIC
      </p>
      <div className="flex flex-col gap-0.5">
        {COMMANDS.map((command) => (
          <Button
            key={command}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => onCommandClick(command)}
          >
            {command}
          </Button>
        ))}
      </div>
    </div>
  );
}
