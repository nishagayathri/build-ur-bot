import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { EngagementSignal } from "@/types";

const ENGAGEMENT_EVENT_TYPES = [
  "HYPE_ALERT",
  "SENTIMENT_ARBITRAGE_DETECTED",
  "TREND_ALERT",
] as const;

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

    const membership = await prisma.accountMember.findFirst({
      where: { userId },
      select: { accountId: true },
    });

    if (!membership) {
      return NextResponse.json([]);
    }

    const busEvents = await prisma.busEvent.findMany({
      where: {
        accountId: membership.accountId,
        type: { in: [...ENGAGEMENT_EVENT_TYPES] },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const signals: EngagementSignal[] = busEvents.map((event) => ({
      signal_id: event.id,
      platform: "X" as const,
      type: event.type === "HYPE_ALERT"
        ? "HYPE_ALERT"
        : event.type === "SENTIMENT_ARBITRAGE_DETECTED"
        ? "RISK_FLAGGED"
        : "MENTION",
      handle: `@${event.agent.toLowerCase().replace(/\s+/g, "_")}`,
      content: event.message,
      urgency: event.priority === "HIGH" ? "HIGH" : event.priority === "LOW" ? "LOW" : "MEDIUM",
      agent_action: null,
      timestamp: event.timestamp.toISOString(),
    }));

    return NextResponse.json(signals);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
