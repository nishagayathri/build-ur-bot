"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AgentConfig, AgentDesk } from "@/types";
import { agentStatusConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

interface DeskTreeProps {
  agents: AgentConfig[];
}

/* ── Layout ───────────────────────────────────────── */
const CARD_W = 220;
const CARD_H = 72;
const EIC_W = 240;
const EIC_H = 64;
const DESK_W = 160;
const DESK_H = 36;
const GAP_X = 48;
const GAP_Y = 100;
const PADDING = 80;

const GRID_DOT_SPACING = 24;
const GRID_DOT_R = 0.75;

const deskOrder: AgentDesk[] = ["DATA_DESK", "CONTENT_DESK", "ENGAGEMENT_DESK"];

const deskLabels: Record<AgentDesk, string> = {
  DATA_DESK: "Data Desk",
  CONTENT_DESK: "Content Desk",
  ENGAGEMENT_DESK: "Engagement Desk",
  EIC: "Editor-in-Chief",
};

interface DeskPosition {
  desk: AgentDesk;
  agents: AgentConfig[];
  x: number;
  width: number;
  centerX: number;
}

interface AgentNode {
  agent: AgentConfig;
  x: number;
  y: number;
  deskCenterX: number;
}

export function DeskTree({ agents }: DeskTreeProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

  /* ── Layout computation ─────────────────────────── */
  const layout = useMemo(() => {
    const eicAgent = agents.find((a) => a.desk === "EIC") ?? null;
    const deskGroups = deskOrder.map((desk) => ({
      desk,
      agents: agents.filter((a) => a.desk === desk),
    }));

    const deskWidths = deskGroups.map((g) =>
      Math.max(CARD_W, g.agents.length * CARD_W + Math.max(0, g.agents.length - 1) * GAP_X)
    );

    const totalAgentWidth =
      deskWidths.reduce((sum, w) => sum + w, 0) +
      (deskGroups.length - 1) * GAP_X * 2;

    const svgWidth = Math.max(totalAgentWidth + 2 * PADDING, CARD_W * 3);

    const y1 = PADDING;
    const y2 = y1 + EIC_H + GAP_Y;
    const y3 = y2 + DESK_H + GAP_Y;
    const svgHeight = y3 + CARD_H + PADDING;

    const eicCenterX = svgWidth / 2;
    const eicX = eicCenterX - EIC_W / 2;

    let xCursor = PADDING;
    const deskPositions: DeskPosition[] = deskGroups.map((g, i) => {
      const x = xCursor;
      const width = deskWidths[i];
      const centerX = x + width / 2;
      xCursor += width + GAP_X * 2;
      return { ...g, x, width, centerX };
    });

    const agentNodes: AgentNode[] = deskPositions.flatMap((dp) =>
      dp.agents.map((agent, j) => ({
        agent,
        x: dp.x + j * (CARD_W + GAP_X),
        y: y3,
        deskCenterX: dp.centerX,
      }))
    );

    return {
      eicAgent,
      eicX,
      eicCenterX,
      deskPositions,
      agentNodes,
      svgWidth,
      svgHeight,
      y1,
      y2,
      y3,
    };
  }, [agents]);

  /* ── Drag-to-pan ────────────────────────────────── */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollX: containerRef.current?.scrollLeft ?? 0,
      scrollY: containerRef.current?.scrollTop ?? 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    containerRef.current.scrollLeft = dragRef.current.scrollX - dx;
    containerRef.current.scrollTop = dragRef.current.scrollY - dy;
  };

  const handleMouseUp = () => setIsDragging(false);

  const {
    eicAgent,
    eicX,
    eicCenterX,
    deskPositions,
    agentNodes,
    svgWidth,
    svgHeight,
    y1,
    y2,
    y3,
  } = layout;

  /* ── Bezier helper ──────────────────────────────── */
  const bezier = (x1: number, y1s: number, x2: number, y2e: number) => {
    const mid = (y1s + y2e) / 2;
    return `M ${x1} ${y1s} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2e}`;
  };

  /* ── Render ─────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-12rem)] overflow-auto rounded-xl border border-border/60 bg-surface-1 genesis-scrollbar"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg width={svgWidth} height={svgHeight} className="min-h-full select-none">
        {/* ── Dot-grid background ── */}
        <defs>
          <pattern
            id="desk-tree-grid"
            width={GRID_DOT_SPACING}
            height={GRID_DOT_SPACING}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={GRID_DOT_SPACING / 2}
              cy={GRID_DOT_SPACING / 2}
              r={GRID_DOT_R}
              fill="var(--text-4)"
              opacity={0.35}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#desk-tree-grid)" />

        {/* ── Connectors: EIC → Desks ── */}
        {deskPositions.map((dp) => (
          <path
            key={`eic-${dp.desk}`}
            d={bezier(eicCenterX, y1 + EIC_H, dp.centerX, y2)}
            stroke="var(--border)"
            strokeWidth={1}
            fill="none"
            opacity={0.6}
          />
        ))}

        {/* ── Connectors: Desks → Agents ── */}
        {agentNodes.map((node) => (
          <path
            key={`desk-${node.agent.agent_id}`}
            d={bezier(node.deskCenterX, y2 + DESK_H, node.x + CARD_W / 2, y3)}
            stroke="var(--border)"
            strokeWidth={1}
            fill="none"
            opacity={0.5}
          />
        ))}

        {/* ── Junction dots on desk pills ── */}
        {deskPositions.map((dp) => (
          <g key={`dots-${dp.desk}`}>
            <circle cx={dp.centerX} cy={y2} r={2.5} fill="var(--surface-3)" />
            <circle cx={dp.centerX} cy={y2 + DESK_H} r={2.5} fill="var(--surface-3)" />
          </g>
        ))}

        {/* ── EIC card ── */}
        {eicAgent && (
          <foreignObject x={eicX} y={y1} width={EIC_W} height={EIC_H}>
            <div
              className={cn(
                "flex h-full cursor-pointer items-center gap-3 rounded-xl px-5",
                "bg-surface-1 border border-border/80",
                "transition-all duration-300 ease-in-out",
                "hover:shadow-[0_6px_24px_rgba(30,29,38,0.08)]",
                "active:scale-[0.98]"
              )}
              style={{ boxShadow: "0 2px 12px rgba(30,29,38,0.06)" }}
              onClick={() => router.push(`/agents/${eicAgent.agent_id}`)}
            >
              <div
                className="h-8 w-[3px] shrink-0 rounded-full"
                style={{ backgroundColor: "var(--genesis-accent)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-text-1 truncate font-heading">
                    {eicAgent.name}
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      agentStatusConfig[eicAgent.status].dotColor,
                      eicAgent.status === "BUSY" && "animate-pulse"
                    )}
                  />
                </div>
                <div className="text-[11px] text-text-3 truncate">
                  {eicAgent.role}
                </div>
              </div>
            </div>
          </foreignObject>
        )}

        {/* ── Desk label pills ── */}
        {deskPositions.map((dp) => (
          <foreignObject
            key={dp.desk}
            x={dp.centerX - DESK_W / 2}
            y={y2}
            width={DESK_W}
            height={DESK_H}
          >
            <div className="flex h-full items-center justify-center rounded-full bg-surface-2/60 px-4">
              <span className="text-[11px] font-medium tracking-wide text-text-3">
                {deskLabels[dp.desk]}
              </span>
            </div>
          </foreignObject>
        ))}

        {/* ── Agent cards ── */}
        {agentNodes.map((node) => (
          <foreignObject
            key={node.agent.agent_id}
            x={node.x}
            y={node.y}
            width={CARD_W}
            height={CARD_H}
          >
            <div
              className={cn(
                "group flex h-full cursor-pointer flex-col justify-center rounded-xl px-4 py-3",
                "bg-surface-1 border border-border/60",
                "transition-all duration-300 ease-in-out",
                "hover:border-border hover:shadow-[0_2px_12px_rgba(30,29,38,0.06)]",
                "active:scale-[0.98]"
              )}
              style={
                node.agent.status === "BUSY"
                  ? { borderColor: "color-mix(in srgb, var(--genesis-accent) 30%, transparent)" }
                  : undefined
              }
              onClick={() => router.push(`/agents/${node.agent.agent_id}`)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    agentStatusConfig[node.agent.status].dotColor,
                    node.agent.status === "BUSY" && "animate-pulse"
                  )}
                />
                <span className="text-[13px] font-medium text-text-1 truncate">
                  {node.agent.name}
                </span>
              </div>
              <div className="mt-1 pl-[14px] text-[11px] text-text-3 truncate">
                {node.agent.role}
              </div>
            </div>
          </foreignObject>
        ))}
      </svg>
    </div>
  );
}
