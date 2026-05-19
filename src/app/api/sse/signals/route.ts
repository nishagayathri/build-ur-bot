import { prisma } from "@/lib/prisma";
import {
  serializeMarketSignal,
  serializeNewsSignal,
  serializeTrendSignal,
} from "@/lib/api/serializers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let lastMarketTs: Date | null = null;
  let lastNewsTs: Date | null = null;
  let lastTrendTs: Date | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const poll = async () => {
        try {
          // Market signals
          const marketWhere = lastMarketTs
            ? { timestamp: { gt: lastMarketTs } }
            : {};
          const marketSignals = await prisma.marketSignal.findMany({
            where: marketWhere,
            orderBy: { timestamp: "desc" },
            take: 5,
          });
          for (const signal of marketSignals) {
            const data = JSON.stringify(serializeMarketSignal(signal));
            controller.enqueue(
              encoder.encode(`event: market\ndata: ${data}\n\n`)
            );
            if (!lastMarketTs || signal.timestamp > lastMarketTs) {
              lastMarketTs = signal.timestamp;
            }
          }

          // News signals
          const newsWhere = lastNewsTs
            ? { timestamp: { gt: lastNewsTs } }
            : {};
          const newsSignals = await prisma.newsSignal.findMany({
            where: newsWhere,
            orderBy: { timestamp: "desc" },
            take: 5,
          });
          for (const signal of newsSignals) {
            const data = JSON.stringify(serializeNewsSignal(signal));
            controller.enqueue(
              encoder.encode(`event: news\ndata: ${data}\n\n`)
            );
            if (!lastNewsTs || signal.timestamp > lastNewsTs) {
              lastNewsTs = signal.timestamp;
            }
          }

          // Trend signals
          const trendWhere = lastTrendTs
            ? { timestamp: { gt: lastTrendTs } }
            : {};
          const trendSignals = await prisma.trendSignal.findMany({
            where: trendWhere,
            orderBy: { timestamp: "desc" },
            take: 5,
          });
          for (const signal of trendSignals) {
            const data = JSON.stringify(serializeTrendSignal(signal));
            controller.enqueue(
              encoder.encode(`event: trend\ndata: ${data}\n\n`)
            );
            if (!lastTrendTs || signal.timestamp > lastTrendTs) {
              lastTrendTs = signal.timestamp;
            }
          }
        } catch {
          // DB error — skip this tick
        }
      };

      controller.enqueue(encoder.encode(": keepalive\n\n"));

      const interval = setInterval(poll, 3000);
      request.signal.addEventListener("abort", () => clearInterval(interval));
      await poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
