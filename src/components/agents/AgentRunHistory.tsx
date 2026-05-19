"use client";

import { useState } from "react";
import { ChevronRight, Clock, Wrench, AlertCircle } from "lucide-react";
import type { AgentConfig, AgentRunResult, AgentToolInvocation } from "@/types";
import { useAgentRuns } from "@/hooks/useAgentActions";
import { timeAgo } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface AgentRunHistoryProps {
  agent: AgentConfig;
}

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-400",
  FAILED: "bg-red-500/10 text-red-400",
  RUNNING: "bg-blue-500/10 text-blue-400",
  CANCELLED: "bg-zinc-500/10 text-zinc-400",
};

function formatJson(value: unknown): string {
  if (value == null) return "null";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function ToolCallBlock({ tool }: { tool: AgentToolInvocation }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted/40 transition-colors">
        <ChevronRight
          className={cn(
            "h-3 w-3 text-text-3 shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <Wrench className="h-3 w-3 text-text-3 shrink-0" />
        <span className="text-xs font-medium text-text-1">{tool.tool_name}</span>
        {tool.error && (
          <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30">
            error
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-7 pr-2 pb-2">
        <div className="space-y-2 mt-1">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-3">
              Input
            </span>
            <pre className="mt-0.5 rounded bg-muted/30 p-2 text-[11px] text-text-2 overflow-x-auto max-h-40 thin-scrollbar">
              {formatJson(tool.input)}
            </pre>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-3">
              Output
            </span>
            <pre className="mt-0.5 rounded bg-muted/30 p-2 text-[11px] text-text-2 overflow-x-auto max-h-60 thin-scrollbar">
              {tool.error ? tool.error : formatJson(tool.output)}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RunCard({ run }: { run: AgentRunResult }) {
  const [open, setOpen] = useState(false);

  const outputText =
    run.output == null
      ? null
      : typeof run.output === "object" && "content" in (run.output as Record<string, unknown>)
        ? String((run.output as Record<string, unknown>).content)
        : typeof run.output === "string"
          ? run.output
          : JSON.stringify(run.output);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-muted/20 transition-colors">
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-text-3 shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn("text-[10px] shrink-0", statusStyles[run.status])}
          >
            {run.status}
          </Badge>
          <span className="text-xs text-text-3 shrink-0">
            <Clock className="inline h-3 w-3 mr-0.5 -mt-px" />
            {timeAgo(run.started_at)}
          </span>
          {run.tool_invocations.length > 0 && (
            <span className="text-xs text-text-3 shrink-0">
              <Wrench className="inline h-3 w-3 mr-0.5 -mt-px" />
              {run.tool_invocations.length} tool{run.tool_invocations.length !== 1 ? "s" : ""}
            </span>
          )}
          {run.token_count != null && run.token_count > 0 && (
            <span className="text-xs text-text-3 shrink-0">
              {run.token_count.toLocaleString()} tokens
            </span>
          )}
          {run.cost_usd != null && run.cost_usd > 0 && (
            <span className="text-xs text-text-3 shrink-0">
              ${run.cost_usd.toFixed(4)}
            </span>
          )}
        </div>
        {run.error && <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1 rounded-lg border border-border bg-card p-3 space-y-3">
        {run.tool_invocations.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-3 mb-1.5">
              Tool Calls
            </h4>
            <div className="space-y-0.5">
              {run.tool_invocations.map((tool) => (
                <ToolCallBlock key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-3 mb-1.5">
            Agent Output
          </h4>
          {outputText ? (
            <pre className="rounded bg-muted/30 p-3 text-xs text-text-2 whitespace-pre-wrap break-words max-h-96 overflow-auto thin-scrollbar">
              {outputText}
            </pre>
          ) : run.error ? (
            <pre className="rounded bg-red-500/5 p-3 text-xs text-red-400 whitespace-pre-wrap break-words">
              {run.error}
            </pre>
          ) : (
            <p className="text-xs text-text-4">No output recorded</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AgentRunHistory({ agent }: AgentRunHistoryProps) {
  const { data: runs, isLoading } = useAgentRuns(agent.agent_id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-4">Loading runs...</p>
        </CardContent>
      </Card>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-4">No runs yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Run History ({runs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
