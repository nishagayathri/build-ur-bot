import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/chat/threads?accountId=xxx
 *
 * Returns a list of chat threads for an account, each with a derived
 * title (first user message), message count, and last activity time.
 * Only returns threads that have an explicit threadId (i.e. not the
 * legacy flat-history messages).
 */
export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const groups = await prisma.chatMessage.groupBy({
    by: ["threadId"],
    where: { accountId, threadId: { not: null } },
    _count: { id: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
  });

  if (groups.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch the first user message for each thread to use as the title
  const threadIds = groups.map((g) => g.threadId as string);
  const firstMessages = await prisma.chatMessage.findMany({
    where: { accountId, threadId: { in: threadIds }, role: "user" },
    orderBy: { createdAt: "asc" },
    select: { threadId: true, content: true },
  });

  const firstByThread = new Map<string, string>();
  for (const m of firstMessages) {
    if (m.threadId && !firstByThread.has(m.threadId)) {
      firstByThread.set(m.threadId, m.content);
    }
  }

  const threads = groups.map((g) => {
    const tid = g.threadId as string;
    const firstContent = firstByThread.get(tid);
    const title = firstContent
      ? firstContent.replace(/\n/g, " ").trim().slice(0, 50) +
        (firstContent.length > 50 ? "..." : "")
      : "New chat";
    return {
      threadId: tid,
      title,
      messageCount: g._count.id,
      lastMessageAt: g._max.createdAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(threads);
}
