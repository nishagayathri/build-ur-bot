import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { CompetitorReport } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = request.nextUrl;

    const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);
    const lookbackDays = Math.min(Number(searchParams.get("lookback_days") ?? 7), 30);
    const reportType = searchParams.get("report_type");
    const urgency = searchParams.get("urgency");

    // Resolve accountId from user's membership
    const membership = await prisma.accountMember.findFirst({
      where: { userId },
      select: { accountId: true },
    });

    if (!membership) {
      return NextResponse.json([] as CompetitorReport[]);
    }

    const since = new Date(Date.now() - lookbackDays * 86_400_000);

    const reports = await prisma.competitorReport.findMany({
      where: {
        accountId: membership.accountId,
        createdAt: { gte: since },
        ...(reportType ? { reportType } : {}),
        ...(urgency ? { urgency } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        reportType: true,
        source: true,
        observation: true,
        editorialOpportunity: true,
        urgency: true,
        recommendedAction: true,
        complianceNote: true,
        topics: true,
        engagementSummary: true,
        createdAt: true,
        agentId: true,
      },
    });

    const serialized: CompetitorReport[] = reports.map((r) => ({
      id: r.id,
      report_type: r.reportType as CompetitorReport["report_type"],
      source: r.source,
      observation: r.observation,
      editorial_opportunity: r.editorialOpportunity,
      urgency: r.urgency as CompetitorReport["urgency"],
      recommended_action: r.recommendedAction as CompetitorReport["recommended_action"],
      compliance_note: r.complianceNote,
      topics: r.topics,
      engagement_summary: (r.engagementSummary as CompetitorReport["engagement_summary"]) ?? null,
      created_at: r.createdAt.toISOString(),
      agent_id: r.agentId,
    }));

    // Sort: HIGH first, then MEDIUM, then LOW, preserving recency within each group
    const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    serialized.sort(
      (a, b) =>
        (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2),
    );

    return NextResponse.json(serialized);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
