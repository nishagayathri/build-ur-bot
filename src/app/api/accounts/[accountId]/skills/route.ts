import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** GET /api/accounts/:accountId/skills — Get skill configurations */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const configs = await prisma.accountSkillConfig.findMany({
      where: { accountId },
      orderBy: { skillType: "asc" },
    });

    return NextResponse.json(
      configs.map((c) => ({
        id: c.id,
        skill_type: c.skillType,
        enabled: c.enabled,
        config: c.config,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** PUT /api/accounts/:accountId/skills — Bulk upsert skill configurations */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { skills } = await request.json();

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { error: "Skills array is required" },
        { status: 400 }
      );
    }

    const VALID_SKILL_TYPES = new Set([
      "TECHNICAL_ANALYSIS",
      "NEWS_MONITORING",
      "ECONOMIC_CALENDAR",
      "EARNINGS_CALENDAR",
      "SOCIAL_SENTIMENT",
      "REGULATORY_MONITOR",
      "THREAD_CREATION",
      "CHART_GENERATION",
      "MEME_CONTENT",
      "AUTO_REPLY",
      "COMPETITOR_TRACKING",
      "TREND_SURFACING",
    ]);

    const validSkills = skills.filter(
      (s: { skill_type: string }) => VALID_SKILL_TYPES.has(s.skill_type)
    );

    // Upsert each skill config
    const results = await prisma.$transaction(
      validSkills.map(
        (s: { skill_type: string; enabled: boolean; config?: Record<string, unknown> }) =>
          prisma.accountSkillConfig.upsert({
            where: {
              accountId_skillType: {
                accountId,
                skillType: s.skill_type as never,
              },
            },
            create: {
              accountId,
              skillType: s.skill_type as never,
              enabled: s.enabled,
              config: (s.config ?? {}) as Record<string, unknown> as never,
            },
            update: {
              enabled: s.enabled,
              config: (s.config ?? {}) as Record<string, unknown> as never,
            },
          })
      )
    );

    return NextResponse.json(
      results.map((c) => ({
        id: c.id,
        skill_type: c.skillType,
        enabled: c.enabled,
        config: c.config,
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to save skills" },
      { status: 500 }
    );
  }
}
