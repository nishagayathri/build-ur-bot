import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAgent } from "@/lib/api/serializers";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json(serializeAgent(agent));
}
