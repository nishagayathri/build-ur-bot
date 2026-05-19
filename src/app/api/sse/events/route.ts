import { prisma } from "@/lib/prisma";
import { serializeBusEvent } from "@/lib/api/serializers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let lastEventId = request.headers.get("Last-Event-ID") || null;

  const stream = new ReadableStream({
    async start(controller) {
      const poll = async () => {
        try {
          const where = lastEventId
            ? { id: { gt: lastEventId } }
            : { timestamp: { gte: new Date(Date.now() - 60_000) } };

          const events = await prisma.busEvent.findMany({
            where,
            orderBy: { timestamp: "asc" },
            take: 50,
          });

          for (const event of events) {
            const data = JSON.stringify(serializeBusEvent(event));
            controller.enqueue(
              encoder.encode(`id: ${event.id}\ndata: ${data}\n\n`)
            );
            lastEventId = event.id;
          }
        } catch {
          // DB error — skip this tick
        }
      };

      // Send initial keep-alive
      controller.enqueue(encoder.encode(": keepalive\n\n"));

      const interval = setInterval(poll, 1000);
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
