import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { serializeMarketSignal } from "@/lib/api/serializers";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 30), 200);

    const membership = await prisma.accountMember.findFirst({
      where: { userId },
      select: { accountId: true },
    });

    if (!membership) {
      return NextResponse.json([]);
    }

    const signals = await prisma.marketSignal.findMany({
      where: { accountId: membership.accountId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json(signals.map(serializeMarketSignal));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
