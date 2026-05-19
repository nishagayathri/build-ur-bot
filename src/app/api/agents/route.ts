import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAgent } from "@/lib/api/serializers";
import { AgentDesk, AgentStatus } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("accountId");
  const desk = searchParams.get("desk") as AgentDesk | null;
  const status = searchParams.get("status") as AgentStatus | null;

  const where: { accountId?: string; desk?: AgentDesk; status?: AgentStatus } = {};
  if (accountId) where.accountId = accountId;
  if (desk) where.desk = desk;
  if (status) where.status = status;

  const agents = await prisma.agent.findMany({ where });

  return NextResponse.json(agents.map(serializeAgent));
}
