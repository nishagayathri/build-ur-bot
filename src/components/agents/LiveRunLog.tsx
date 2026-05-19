"use client";

import { useState, useEffect, useRef } from "react";
import type { AgentConfig, AgentRunResult } from "@/types";
import { AGENT_TASK_POOLS } from "@/lib/constants";
import { usePauseAgent } from "@/hooks/useAgentActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LiveRunLogProps {
  agent: AgentConfig;
  runData?: AgentRunResult | null;
  isPending?: boolean;
}

function formatTs(iso: string) {
  const d = new Date(iso);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function runDataToLines(data: AgentRunResult): string[] {
  const lines: string[] = [];
  for (const step of data.steps) {
    lines.push(`[${formatTs(step.started_at)}] Step: ${step.node_name}`);
  }
  for (const tool of data.tool_invocations) {
    const status = tool.error ? `ERROR: ${tool.error}` : "ok";
    lines.push(`[${formatTs(tool.started_at)}] Tool: ${tool.tool_name} → ${status}`);
  }
  if (data.output) {
    const out = typeof data.output === "string" ? data.output : JSON.stringify(data.output);
    lines.push(`[${formatTs(data.completed_at ?? data.started_at)}] Output: ${out.slice(0, 120)}`);
  }
  return lines;
}

export function LiveRunLog({ agent, runData, isPending }: LiveRunLogProps) {
  const [mockLines, setMockLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const pauseAgent = usePauseAgent(agent.agent_id);

  // Mock log lines while waiting for the synchronous run to complete
  useEffect(() => {
    if (!isPending || runData) return;

    const pool = AGENT_TASK_POOLS[agent.name];
    if (!pool || pool.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
      const now = new Date();
      const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
      setMockLines((prev) => [...prev, `[${ts}] ${pool[idx % pool.length]}`]);
      idx++;
    }, 800);

    return () => clearInterval(interval);
  }, [agent.name, isPending, runData]);

  // Clear mock lines when a new run starts
  useEffect(() => {
    if (isPending && !runData) setMockLines([]);
  }, [isPending, runData]);

  const displayLines = runData ? runDataToLines(runData) : mockLines;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [displayLines]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              {runData ? "Completed" : "Running"}
            </CardTitle>
            {!runData && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          {!runData && (
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                Cancel run
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel current run?</DialogTitle>
                  <DialogDescription>
                    This will pause the agent after the current run completes.
                    The in-flight execution cannot be aborted server-side.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Keep running
                  </DialogClose>
                  <DialogClose
                    render={
                      <Button
                        variant="destructive"
                        onClick={() => pauseAgent.mutate()}
                      />
                    }
                  >
                    Confirm cancel
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={logRef}
          className="rounded-lg bg-muted/30 p-3 max-h-48 overflow-auto"
        >
          <div className="space-y-0.5 font-mono text-xs text-muted-foreground">
            {displayLines.map((line, i) => (
              <div key={`${agent.name}-log-${i}`}>{line}</div>
            ))}
            {displayLines.length === 0 && (
              <div className="text-text-4">Waiting for output…</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
