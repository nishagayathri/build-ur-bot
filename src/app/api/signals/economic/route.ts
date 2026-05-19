import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { serializeEconomicEvent } from "@/lib/api/serializers";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const membership = await prisma.accountMember.findFirst({
      where: { userId },
      select: { accountId: true },
    });

    if (!membership) {
      return NextResponse.json([]);
    }

    const events = await prisma.economicEvent.findMany({
      where: { accountId: membership.accountId },
      orderBy: { time: "asc" },
      take: limit,
    });

    return NextResponse.json(events.map(serializeEconomicEvent));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
