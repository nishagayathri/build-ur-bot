import { randomUUID } from "node:crypto";
import { prisma } from "../db";

interface AuditEntry {
  timestamp: string;
  agent: string;
  action: string;
  metadata?: Record<string, string>;
}

/**
 * Publication processor — runs on a recurring schedule.
 * Finds stories with status SCHEDULED whose scheduledTime has passed,
 * publishes them, and creates a POST_PUBLISHED bus event.
 */
export async function processPublication(): Promise<void> {
  console.log("[publication] Checking for scheduled stories ready to publish");

  const now = new Date();

  const readyStories = await prisma.story.findMany({
    where: {
      status: "SCHEDULED",
      scheduledTime: { lte: now },
    },
  });

  if (readyStories.length === 0) {
    console.log("[publication] No stories ready for publication");
    return;
  }

  console.log(
    `[publication] Found ${readyStories.length} story(ies) to publish`,
  );

  for (const story of readyStories) {
    // Build the new audit entry
    const existingTrail = (story.auditTrail as unknown as AuditEntry[]) ?? [];
    const auditEntry: AuditEntry = {
      timestamp: now.toISOString(),
      agent: "worker:publication",
      action: "PUBLISHED",
      metadata: { storyId: story.id },
    };
    const updatedTrail = [...existingTrail, auditEntry];

    // Generate a mock published URL
    const slug = story.headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const publishedUrl = `https://marketary.app/stories/${slug}-${story.id.slice(0, 8)}`;

    // Update the story
    await prisma.story.update({
      where: { id: story.id },
      data: {
        status: "PUBLISHED",
        publishedUrl,
        auditTrail: JSON.parse(JSON.stringify(updatedTrail)),
      },
    });

    // Create a POST_PUBLISHED bus event
    await prisma.busEvent.create({
      data: {
        id: randomUUID(),
        accountId: story.accountId,
        type: "POST_PUBLISHED",
        agent: "worker:publication",
        message: `Story "${story.headline}" published to ${publishedUrl}`,
        storyId: story.id,
        priority: "NORMAL",
      },
    });

    console.log(`[publication] Published story ${story.id}: ${story.headline}`);
  }

  console.log("[publication] Publication cycle complete");
}
