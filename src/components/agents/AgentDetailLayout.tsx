"use client";

import { useState } from "react";
import Link from "next/link";
import { Pause, Play, Save, ArrowRight, Zap, Loader2 } from "lucide-react";
import type { AgentConfig } from "@/types";
import { agentStatusConfig } from "@/lib/status-colors";
import { useRunAgent, usePauseAgent, useResumeAgent, useUpdateAgent } from "@/hooks/useAgentActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentPropertiesPanel } from "@/components/agents/AgentPropertiesPanel";
import { AgentAdapterConfig } from "@/components/agents/AgentAdapterConfig";
import { AgentToolbox } from "@/components/agents/AgentToolbox";
import { AgentSystemPrompt } from "@/components/agents/AgentSystemPrompt";
import { LiveRunLog } from "@/components/agents/LiveRunLog";
import { AgentRunHistory } from "@/components/agents/AgentRunHistory";

interface AgentDetailLayoutProps {
  agent: AgentConfig;
}

export function AgentDetailLayout({ agent }: AgentDetailLayoutProps) {
  const statusCfg = agentStatusConfig[agent.status];
  const isPaused = agent.status === "PAUSED";
  const isBusy = agent.status === "BUSY";

  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});

  const handleFieldChange = (field: string, value: unknown) => {
    setPendingChanges((prev) => ({ ...prev, [field]: value }));
  };

  const runAgent = useRunAgent(agent.agent_id);
  const pauseAgent = usePauseAgent(agent.agent_id);
  const resumeAgent = useResumeAgent(agent.agent_id);
  const updateAgent = useUpdateAgent(agent.agent_id);

  const lifecyclePending = pauseAgent.isPending || resumeAgent.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{agent.name}</h1>
        <Badge variant="outline" className="gap-1.5">
          <span
            className={cn("h-2 w-2 rounded-full", statusCfg.dotColor)}
          />
          {statusCfg.label}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            disabled={isBusy || runAgent.isPending || isPaused}
            onClick={() => runAgent.mutate()}
          >
            {runAgent.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Run Now
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy || lifecyclePending}
            onClick={() => isPaused ? resumeAgent.mutate() : pauseAgent.mutate()}
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {(isBusy || runAgent.isPending) && (
        <LiveRunLog agent={agent} runData={runAgent.data} isPending={runAgent.isPending} />
      )}

      <AgentRunHistory agent={agent} />

      <div className="grid gap-6 lg:grid-cols-5 items-start">
        <div className="lg:col-span-2 space-y-6">
          <AgentPropertiesPanel agent={agent} onFieldChange={handleFieldChange} />
          <AgentToolbox agent={agent} />
          <AgentAdapterConfig
            agent={agent}
            onInstrumentsChange={(instruments) => handleFieldChange("instrumentsWatched", instruments)}
            onAdapterConfigChange={(config) => handleFieldChange("adapterConfig", config)}
          />
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              disabled={updateAgent.isPending || Object.keys(pendingChanges).length === 0}
              onClick={() => updateAgent.mutate(pendingChanges, { onSuccess: () => setPendingChanges({}) })}
            >
              {updateAgent.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy || lifecyclePending}
              onClick={() => isPaused ? resumeAgent.mutate() : pauseAgent.mutate()}
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Resume agent
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause agent
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/agents?view=tree" />}>
              View in Desk Tree
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="lg:col-span-3">
          <AgentSystemPrompt agent={agent} />
        </div>
      </div>
    </div>
  );
}
