import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeStory } from "@/lib/api/serializers";
import { executeAgent } from "@/agents/runtime/executor";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> },
) {
  try {
    const { storyId } = await params;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 },
      );
    }

    const serialized = serializeStory(story);

    // Attach the latest agent run status when the story is in an active-agent state
    if (story.status === "WRITING" || story.status === "REVISION") {
      const latestRun = await prisma.agentRun.findFirst({
        where: { storyId },
        orderBy: { startedAt: "desc" },
        select: { status: true },
      });
      serialized.agent_run_status =
        (latestRun?.status as "RUNNING" | "COMPLETED" | "FAILED") ?? null;
    }

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(`GET /api/stories/[storyId] error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> },
) {
  try {
    const { storyId } = await params;
    const body = await request.json();

    const existing = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 },
      );
    }

    const data: Record<string, unknown> = {};

    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.entity !== undefined) data.entity = body.entity;
    if (body.entityType !== undefined) data.entityType = body.entityType;
    if (body.headline !== undefined) data.headline = body.headline;
    if (body.signalsStacked !== undefined)
      data.signalsStacked = body.signalsStacked;
    if (body.stackingScore !== undefined)
      data.stackingScore = body.stackingScore;
    if (body.eicDirective !== undefined) data.eicDirective = body.eicDirective;
    if (body.assignedPersona !== undefined)
      data.assignedPersona = body.assignedPersona;
    if (body.draftContent !== undefined) data.draftContent = body.draftContent;
    if (body.scheduledTime !== undefined)
      data.scheduledTime = body.scheduledTime
        ? new Date(body.scheduledTime)
        : null;
    if (body.publishedUrl !== undefined) data.publishedUrl = body.publishedUrl;
    if (body.performance !== undefined) data.performance = body.performance;
    if (body.auditTrail !== undefined) data.auditTrail = body.auditTrail;
    if (body.isPrepositioned !== undefined)
      data.isPrepositioned = body.isPrepositioned;
    if (body.sentimentArbitrage !== undefined)
      data.sentimentArbitrage = body.sentimentArbitrage;
    if (body.viralityScore !== undefined)
      data.viralityScore = body.viralityScore;

    const story = await prisma.story.update({
      where: { id: storyId },
      data,
    });

    // Wake the writer agent when EIC approves or schedules a story with a persona
    const becomingApproved =
      body.status === "EIC_APPROVED" &&
      existing.status !== "EIC_APPROVED" &&
      story.assignedPersona;

    const becomingScheduled =
      body.status === "SCHEDULED" &&
      existing.status !== "SCHEDULED" &&
      story.assignedPersona &&
      !story.draftContent;

    if (becomingApproved || becomingScheduled) {
      // Resolve the persona by handle (strip @ prefix) to find the writer agent
      const personaHandle = story.assignedPersona!.replace(/^@/, '');
      const persona = await prisma.persona.findFirst({
        where: { accountId: existing.accountId, accountHandle: personaHandle },
      });

      const writerAgent = persona
        ? await prisma.agent.findFirst({
            where: {
              accountId: existing.accountId,
              desk: "CONTENT_DESK",
              assignedPersona: persona.id,
              enabled: true,
            },
          })
        : null;

      if (writerAgent && writerAgent.status !== "BUSY") {
        const directive = story.eicDirective
          ? `EIC directive: ${story.eicDirective}\n\n`
          : "";
        const trigger = {
          storyId: story.id,
          task: `Write content for story ${story.id}`,
          message:
            `You have been assigned a story approved by the EIC. Produce content for it now in your persona's format.\n\n` +
            `Story ID: ${story.id}\n` +
            `Headline: ${story.headline}\n` +
            `Asset: ${story.entity} (${story.entityType})\n` +
            `${directive}` +
            `Use your tools to research, draft, and update the pipeline when done.`,
        };

        // Fire-and-forget — don't block the HTTP response
        executeAgent(writerAgent.id, trigger).catch((err) => {
          console.error(`[WRITER_WAKE] Failed to wake writer ${writerAgent.id}:`, err);
        });
      }
    }

    return NextResponse.json(serializeStory(story));
  } catch (error) {
    console.error(`PATCH /api/stories/[storyId] error:`, error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 },
    );
  }
}
