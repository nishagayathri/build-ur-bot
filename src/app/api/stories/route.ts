import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, StoryStatus, StoryPriority, EntityType } from "@/generated/prisma";
import { serializeStory } from "@/lib/api/serializers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const accountId = searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const where: Prisma.StoryWhereInput = { accountId };

    const status = searchParams.get("status");
    if (status) {
      const values = status.split(",") as StoryStatus[];
      where.status = { in: values };
    }

    const entityType = searchParams.get("entityType");
    if (entityType) {
      const values = entityType.split(",") as EntityType[];
      where.entityType = { in: values };
    }

    const persona = searchParams.get("persona");
    if (persona) {
      const values = persona.split(",");
      where.assignedPersona = { in: values };
    }

    const priority = searchParams.get("priority");
    if (priority) {
      const values = priority.split(",") as StoryPriority[];
      where.priority = { in: values };
    }

    const isPrepositioned = searchParams.get("isPrepositioned");
    if (isPrepositioned !== null) {
      where.isPrepositioned = isPrepositioned === "true";
    }

    const sentimentArbitrage = searchParams.get("sentimentArbitrage");
    if (sentimentArbitrage !== null) {
      where.sentimentArbitrage = sentimentArbitrage === "true";
    }

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { headline: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
      ];
    }

    const stories = await prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(stories.map(serializeStory));
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const story = await prisma.story.create({
      data: {
        id: body.id,
        accountId: body.accountId,
        status: body.status,
        priority: body.priority,
        entity: body.entity,
        entityType: body.entityType,
        headline: body.headline,
        signalsStacked: body.signalsStacked ?? [],
        stackingScore: body.stackingScore ?? 0,
        eicDirective: body.eicDirective ?? null,
        assignedPersona: body.assignedPersona ?? null,
        draftContent: body.draftContent ?? null,
        scheduledTime: body.scheduledTime
          ? new Date(body.scheduledTime)
          : null,
        publishedUrl: body.publishedUrl ?? null,
        performance: body.performance ?? undefined,
        auditTrail: body.auditTrail ?? [
          {
            timestamp: new Date().toISOString(),
            agent: "Human",
            action: "STORY_CREATED",
          },
        ],
        isPrepositioned: body.isPrepositioned ?? false,
        sentimentArbitrage: body.sentimentArbitrage ?? false,
        viralityScore: body.viralityScore ?? null,
      },
    });

    return NextResponse.json(serializeStory(story), { status: 201 });
  } catch (error) {
    console.error("POST /api/stories error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 },
    );
  }
}
