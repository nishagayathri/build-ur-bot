"use client";

import { Cpu, Play, Loader2 } from "lucide-react";
import type { AgentConfig } from "@/types";
import { cn } from "@/lib/utils";
import { useRunAgent } from "@/hooks/useAgentActions";
import { Button } from "@/components/ui/button";

const statusMap: Record<
  string,
  { dot: string; badge: string; badgeBg: string; label: string }
> = {
  ACTIVE: {
    dot: "bg-[#5B9A6F]",
    badge: "bg-[#5B9A6F]/10 text-[#5B9A6F]",
    badgeBg: "active",
    label: "Active",
  },
  BUSY: {
    dot: "bg-[#9074A1]",
    badge: "bg-[#9074A1]/10 text-[#9074A1]",
    badgeBg: "running",
    label: "Running",
  },
  PAUSED: {
    dot: "bg-warning",
    badge: "bg-warning/10 text-warning",
    badgeBg: "paused",
    label: "Paused",
  },
  IDLE: {
    dot: "bg-text-4",
    badge: "bg-surface-3 text-text-3",
    badgeBg: "idle",
    label: "Idle",
  },
  ERROR: {
    dot: "bg-error",
    badge: "bg-error/10 text-error",
    badgeBg: "failed",
    label: "Failed",
  },
};

const deskStages: Record<string, string> = {
  DATA_DESK: "Enrichment",
  CONTENT_DESK: "Drafting",
  ENGAGEMENT_DESK: "Sending",
  EIC: "Reviewing",
};

function ActiveAgentRow({
  agent,
  isLast,
}: {
  agent: AgentConfig;
  isLast: boolean;
}) {
  const config = statusMap[agent.status] ?? statusMap.IDLE;
  const stage = deskStages[agent.desk] ?? config.label;
  const runAgent = useRunAgent(agent.agent_id);
  const canRun = agent.status !== "BUSY" && agent.status !== "PAUSED" && !runAgent.isPending;

  return (
    <li
      className={cn(
        "flex items-center gap-3 py-[9px] group",
        !isLast && "border-b border-border"
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full shrink-0", config.dot)}
      />
      <span className="text-[14px] font-medium text-text-1 flex-1 min-w-0 truncate">
        {agent.name}
      </span>
      <span className="text-[11px] font-medium text-text-3 whitespace-nowrap flex items-center gap-1.5">
        {stage}
        {agent.status === "BUSY" && (
          <Loader2 className="h-3 w-3 animate-spin text-[#9074A1]" />
        )}
      </span>
      {agent.status !== "BUSY" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={!canRun}
          onClick={() => runAgent.mutate()}
        >
          {runAgent.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
      <span
        className={cn(
          "text-[10px] font-semibold px-1.5 py-[3px] rounded-full whitespace-nowrap",
          config.badge
        )}
      >
        {config.label}
      </span>
    </li>
  );
}

interface ActiveAgentsListProps {
  agents: AgentConfig[];
}

export function ActiveAgentsList({ agents }: ActiveAgentsListProps) {
  return (
    <div className="h-full rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-1)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 mb-4 flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5 text-text-4" />
        Active Agents
      </p>
      <ul className="flex flex-col overflow-y-auto max-h-[calc(7*45px)] pr-2 genesis-scrollbar">
        {agents.map((agent, i) => (
          <ActiveAgentRow
            key={agent.agent_id}
            agent={agent}
            isLast={i === agents.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}
