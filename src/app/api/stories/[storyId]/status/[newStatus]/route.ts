import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, StoryStatus } from "@/generated/prisma";
import { serializeStory } from "@/lib/api/serializers";
import { isValidTransition } from "@/lib/api/story-transitions";
import type { AuditEntry } from "@/types";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string; newStatus: string }> },
) {
  try {
    const { storyId, newStatus } = await params;

    const validStatuses = Object.values(StoryStatus) as string[];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status: ${newStatus}` },
        { status: 400 },
      );
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 },
      );
    }

    const targetStatus = newStatus as StoryStatus;

    if (!isValidTransition(story.status, targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition from ${story.status} to ${targetStatus}`,
        },
        { status: 400 },
      );
    }

    const currentTrail = (story.auditTrail as unknown as AuditEntry[]) ?? [];
    const updatedTrail: AuditEntry[] = [
      ...currentTrail,
      {
        timestamp: new Date().toISOString(),
        agent: "Human",
        action: `STATUS_CHANGED to ${targetStatus}`,
      },
    ];

    const updated = await prisma.story.update({
      where: { id: storyId },
      data: {
        status: targetStatus,
        auditTrail: updatedTrail as unknown as Prisma.InputJsonValue[],
      },
    });

    return NextResponse.json(serializeStory(updated));
  } catch (error) {
    console.error(
      `PUT /api/stories/[storyId]/status/[newStatus] error:`,
      error,
    );
    return NextResponse.json(
      { error: "Failed to update story status" },
      { status: 500 },
    );
  }
}
