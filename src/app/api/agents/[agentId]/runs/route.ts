import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAgentRun } from "@/lib/api/serializers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  const runs = await prisma.agentRun.findMany({
    where: { agentId },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: { steps: true, tools: true },
  });

  return NextResponse.json(runs.map(serializeAgentRun));
}
