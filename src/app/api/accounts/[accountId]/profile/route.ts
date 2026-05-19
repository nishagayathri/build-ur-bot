import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** PUT /api/accounts/:accountId/profile — Create or update the account profile */
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

    const body = await request.json();

    const profile = await prisma.accountProfile.upsert({
      where: { accountId },
      create: {
        accountId,
        // Identity & Positioning
        markets: body.markets ?? [],
        targetAudience: body.target_audience ?? "",
        secondaryAudience: body.secondary_audience ?? null,
        editorialAngle: body.editorial_angle ?? "",
        brandName: body.brand_name ?? null,
        brandWebsite: body.brand_website ?? null,
        brandOneLiner: body.brand_one_liner ?? null,
        // Voice & Tone
        voicePersonality: body.voice_personality ?? "",
        secondaryVoice: body.secondary_voice ?? null,
        toneFormal: body.tone_formal ?? 5,
        toneSeriousness: body.tone_seriousness ?? 5,
        toneProvocativeness: body.tone_provocativeness ?? 3,
        toneTechnical: body.tone_technical ?? 5,
        admiredAccounts: body.admired_accounts ?? [],
        alwaysUseTerms: body.always_use_terms ?? [],
        neverUseTerms: body.never_use_terms ?? [],
        // Content Strategy
        contentGoals: body.content_goals ?? [],
        contentMix: body.content_mix ?? {},
        reactionSpeed: body.reaction_speed ?? "FAST",
        prepositionEnabled: body.preposition_enabled ?? false,
        sentimentArbEnabled: body.sentiment_arb_enabled ?? false,
        // Compliance & Guardrails
        isRegulated: body.is_regulated ?? false,
        regulatoryJurisdiction: body.regulatory_jurisdiction ?? null,
        requiredDisclaimers: body.required_disclaimers ?? [],
        offLimitsTopics: body.off_limits_topics ?? [],
        predictionSensitivity: body.prediction_sensitivity ?? "MODERATE",
        approvalRequirement: body.approval_requirement ?? "ALL",
        // Intelligence Triggers
        triggerThresholds: body.trigger_thresholds ?? {},
      },
      update: {
        markets: body.markets,
        targetAudience: body.target_audience,
        secondaryAudience: body.secondary_audience,
        editorialAngle: body.editorial_angle,
        brandName: body.brand_name,
        brandWebsite: body.brand_website,
        brandOneLiner: body.brand_one_liner,
        voicePersonality: body.voice_personality,
        secondaryVoice: body.secondary_voice,
        toneFormal: body.tone_formal,
        toneSeriousness: body.tone_seriousness,
        toneProvocativeness: body.tone_provocativeness,
        toneTechnical: body.tone_technical,
        admiredAccounts: body.admired_accounts,
        alwaysUseTerms: body.always_use_terms,
        neverUseTerms: body.never_use_terms,
        contentGoals: body.content_goals,
        contentMix: body.content_mix,
        reactionSpeed: body.reaction_speed,
        prepositionEnabled: body.preposition_enabled,
        sentimentArbEnabled: body.sentiment_arb_enabled,
        isRegulated: body.is_regulated,
        regulatoryJurisdiction: body.regulatory_jurisdiction,
        requiredDisclaimers: body.required_disclaimers,
        offLimitsTopics: body.off_limits_topics,
        predictionSensitivity: body.prediction_sensitivity,
        approvalRequirement: body.approval_requirement,
        triggerThresholds: body.trigger_thresholds,
      },
    });

    return NextResponse.json({ id: profile.id, accountId: profile.accountId });
  } catch {
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
