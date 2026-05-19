import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAgent } from "@/lib/api/serializers";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  const existing = await prisma.agent.findUniqueOrThrow({
    where: { id: agentId },
    select: { desk: true },
  });

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { status: existing.desk === "EIC" ? "ACTIVE" : "IDLE" },
  });

  return NextResponse.json(serializeAgent(agent));
}
