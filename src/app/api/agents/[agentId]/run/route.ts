import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { executeAgent } from "@/agents/runtime/executor";

/** POST /api/agents/:agentId/run — Trigger a single agent execution */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    await requireAuth();
    const { agentId } = await params;

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.status === "BUSY") {
      return NextResponse.json(
        { error: "Agent is already running" },
        { status: 409 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const trigger = body.trigger ?? {};

    const completedRun = await executeAgent(agentId, trigger);

    return NextResponse.json({
      id: completedRun.id,
      agent_id: completedRun.agentId,
      story_id: completedRun.storyId,
      status: completedRun.status,
      graph_name: completedRun.graphName,
      input: completedRun.input,
      output: completedRun.output,
      error: completedRun.error,
      token_count: completedRun.tokenCount,
      cost_usd: completedRun.costUsd,
      started_at: completedRun.startedAt.toISOString(),
      completed_at: completedRun.completedAt?.toISOString() ?? null,
      steps: completedRun.steps.map((s) => ({
        id: s.id,
        node_name: s.nodeName,
        input: s.input,
        output: s.output,
        started_at: s.startedAt.toISOString(),
        ended_at: s.endedAt?.toISOString() ?? null,
      })),
      tool_invocations: completedRun.tools.map((t) => ({
        id: t.id,
        tool_name: t.toolName,
        input: t.input,
        output: t.output,
        error: t.error,
        started_at: t.startedAt.toISOString(),
        ended_at: t.endedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Agent execution failed: ${message}` },
      { status: 500 },
    );
  }
}
