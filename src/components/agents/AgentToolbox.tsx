"use client";

import {
  TrendingUp,
  Newspaper,
  CalendarDays,
  BarChart3,
  Search,
  Pencil,
  Layers,
  User,
  Wallet,
  FileText,
  ScanSearch,
} from "lucide-react";
import type { AgentConfig } from "@/types";
import { getToolsForNames, type ToolMeta } from "@/lib/tool-catalog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";

const TOOL_ICONS: Record<string, React.ElementType> = {
  pipelineQuery: Search,
  pipelineMutate: Pencil,
  signalStacking: Layers,
  personaLookup: User,
  budgetCheck: Wallet,
  contentGenerate: FileText,
  marketQuote: TrendingUp,
  stockNews: Newspaper,
  economicCalendar: CalendarDays,
  marketMovers: BarChart3,
  competitorScan: ScanSearch,
};

interface AgentToolboxProps {
  agent: AgentConfig;
}

export function AgentToolbox({ agent }: AgentToolboxProps) {
  const tools = agent.tool_names?.length
    ? getToolsForNames(agent.tool_names)
    : getToolsForNames(["pipelineQuery", "budgetCheck"]);
  const fmpCount = tools.filter((t) => t.source === "fmp").length;
  const apifyCount = tools.filter((t) => t.source === "scrape-creators").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toolbox</CardTitle>
        <CardAction>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5 px-2">
              {tools.length} tools
            </Badge>
            {fmpCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-2">
                {fmpCount} FMP
              </Badge>
            )}
            {apifyCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-2 text-emerald-600 dark:text-emerald-400">
                {apifyCount} Scrape Creators
              </Badge>
            )}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-0">
        {tools.map((tool) => (
          <ToolRow key={tool.name} tool={tool} />
        ))}
      </CardContent>
    </Card>
  );
}

const SOURCE_BADGE: Record<ToolMeta["source"], { label: string; className: string }> = {
  fmp: {
    label: "FMP",
    className: "text-genesis-accent bg-genesis-accent/10",
  },
  "scrape-creators": {
    label: "Scrape Creators",
    className: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  },
  internal: {
    label: "Internal",
    className: "text-text-4 bg-surface-2",
  },
};

function ToolRow({ tool }: { tool: ToolMeta }) {
  const Icon = TOOL_ICONS[tool.name] ?? Search;
  const isFmp = tool.source === "fmp";
  const badge = SOURCE_BADGE[tool.source];

  return (
    <div
      className={
        "flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0" +
        (isFmp ? " pl-2.5 border-l-2 border-l-genesis-accent/40" : "")
      }
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-2">
        <Icon className="h-3.5 w-3.5 text-text-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-text-1">
            {tool.label}
          </span>
          <span className={`text-[9px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-[11px] text-text-3 mt-0.5">{tool.description}</p>
      </div>
    </div>
  );
}
