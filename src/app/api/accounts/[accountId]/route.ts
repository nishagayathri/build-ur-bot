import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** DELETE /api/accounts/:accountId — Permanently delete account and all data */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    // Only OWNER can delete
    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || membership.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.account.delete({ where: { id: accountId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/accounts/:accountId]", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

/** GET /api/accounts/:accountId — Get full account details */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    // Verify membership
    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        socialConnections: true,
        profile: true,
        skillConfigs: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: account.id,
      name: account.name,
      slug: account.slug,
      description: account.description,
      color: account.color,
      onboarding_step: account.onboardingStep,
      onboarding_complete: account.onboardingComplete,
      created_at: account.createdAt.toISOString(),
      members: account.members.map((m) => ({
        id: m.id,
        user_id: m.user.id,
        user_email: m.user.email,
        user_name: m.user.name,
        role: m.role,
        accepted_at: m.acceptedAt?.toISOString() ?? null,
      })),
      social_connections: account.socialConnections.map((c) => ({
        id: c.id,
        platform: c.platform,
        handle: c.handle,
        display_name: c.displayName,
        connected: c.connected,
        connected_at: c.connectedAt?.toISOString() ?? null,
      })),
      profile: account.profile
        ? {
            markets: account.profile.markets,
            target_audience: account.profile.targetAudience,
            secondary_audience: account.profile.secondaryAudience,
            editorial_angle: account.profile.editorialAngle,
            brand_name: account.profile.brandName,
            brand_website: account.profile.brandWebsite,
            brand_one_liner: account.profile.brandOneLiner,
            voice_personality: account.profile.voicePersonality,
            secondary_voice: account.profile.secondaryVoice,
            tone_formal: account.profile.toneFormal,
            tone_seriousness: account.profile.toneSeriousness,
            tone_provocativeness: account.profile.toneProvocativeness,
            tone_technical: account.profile.toneTechnical,
            admired_accounts: account.profile.admiredAccounts,
            always_use_terms: account.profile.alwaysUseTerms,
            never_use_terms: account.profile.neverUseTerms,
            content_goals: account.profile.contentGoals,
            content_mix: account.profile.contentMix,
            reaction_speed: account.profile.reactionSpeed,
            preposition_enabled: account.profile.prepositionEnabled,
            sentiment_arb_enabled: account.profile.sentimentArbEnabled,
            is_regulated: account.profile.isRegulated,
            regulatory_jurisdiction: account.profile.regulatoryJurisdiction,
            required_disclaimers: account.profile.requiredDisclaimers,
            off_limits_topics: account.profile.offLimitsTopics,
            prediction_sensitivity: account.profile.predictionSensitivity,
            approval_requirement: account.profile.approvalRequirement,
            trigger_thresholds: account.profile.triggerThresholds,
          }
        : null,
      skill_configs: account.skillConfigs.map((s) => ({
        id: s.id,
        skill_type: s.skillType,
        enabled: s.enabled,
        config: s.config,
      })),
    });
  } catch (err) {
    console.error("[GET /api/accounts/:accountId]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** PATCH /api/accounts/:accountId — Update account details */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    // Verify OWNER or ADMIN
    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.onboardingStep !== undefined) updateData.onboardingStep = body.onboardingStep;
    if (body.onboardingComplete !== undefined) updateData.onboardingComplete = body.onboardingComplete;

    const account = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    });

    return NextResponse.json({
      id: account.id,
      name: account.name,
      slug: account.slug,
      description: account.description,
      color: account.color,
      onboardingStep: account.onboardingStep,
      onboardingComplete: account.onboardingComplete,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
