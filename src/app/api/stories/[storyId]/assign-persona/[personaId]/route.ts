import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { serializeStory } from "@/lib/api/serializers";
import type { AuditEntry } from "@/types";

export async function PUT(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ storyId: string; personaId: string }> },
) {
  try {
    const { storyId, personaId } = await params;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 },
      );
    }

    const currentTrail = (story.auditTrail as unknown as AuditEntry[]) ?? [];
    const updatedTrail: AuditEntry[] = [
      ...currentTrail,
      {
        timestamp: new Date().toISOString(),
        agent: "Human",
        action: `ASSIGNED_PERSONA to ${personaId}`,
      },
    ];

    const updated = await prisma.story.update({
      where: { id: storyId },
      data: {
        assignedPersona: personaId,
        auditTrail: updatedTrail as unknown as Prisma.InputJsonValue[],
      },
    });

    return NextResponse.json(serializeStory(updated));
  } catch (error) {
    console.error(
      `PUT /api/stories/[storyId]/assign-persona/[personaId] error:`,
      error,
    );
    return NextResponse.json(
      { error: "Failed to assign persona" },
      { status: 500 },
    );
  }
}
