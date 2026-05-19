import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAgentRun } from "@/lib/api/serializers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string; runId: string }> },
) {
  const { agentId, runId } = await params;

  const run = await prisma.agentRun.findUnique({
    where: { id: runId, agentId },
    include: { steps: true, tools: true },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json(serializeAgentRun(run));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string; runId: string }> },
) {
  const { agentId, runId } = await params;

  const run = await prisma.agentRun.update({
    where: { id: runId, agentId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(serializeAgentRun(run));
}
