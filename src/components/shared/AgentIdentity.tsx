"use client";

import type { AgentDesk, AgentStatus } from "@/types";
import { agentStatusConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

interface AgentIdentityProps {
  name: string;
  desk: AgentDesk;
  status: AgentStatus;
  showDesk?: boolean;
  className?: string;
}

const deskLabels: Record<AgentDesk, string> = {
  DATA_DESK: "Data Desk",
  CONTENT_DESK: "Content Desk",
  ENGAGEMENT_DESK: "Engagement Desk",
  EIC: "Editor-in-Chief",
};

export function AgentIdentity({
  name,
  desk,
  status,
  showDesk = false,
  className,
}: AgentIdentityProps) {
  const config = agentStatusConfig[status];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          config.dotColor,
          status === "BUSY" && "animate-pulse"
        )}
      />
      <span className="text-[13px] font-medium text-text-1">{name}</span>
      {showDesk && (
        <span className="text-[11px] text-text-3">
          {deskLabels[desk]}
        </span>
      )}
    </div>
  );
}
