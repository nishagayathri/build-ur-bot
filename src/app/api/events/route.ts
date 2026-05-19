import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBusEvent } from "@/lib/api/serializers";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const after = searchParams.get("after");

  let cursorTimestamp: Date | undefined;

  if (after) {
    const cursorEvent = await prisma.busEvent.findUnique({
      where: { id: after },
      select: { timestamp: true },
    });
    if (cursorEvent) {
      cursorTimestamp = cursorEvent.timestamp;
    }
  }

  const events = await prisma.busEvent.findMany({
    where: cursorTimestamp
      ? { timestamp: { gt: cursorTimestamp } }
      : undefined,
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json(events.map(serializeBusEvent));
}
