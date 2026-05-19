import { prisma } from "@/lib/prisma";
import { serializeAgent } from "@/lib/api/serializers";
import type { AgentStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let lastStatuses: Record<string, AgentStatus> = {};

  const stream = new ReadableStream({
    async start(controller) {
      const poll = async () => {
        try {
          const agents = await prisma.agent.findMany();

          for (const agent of agents) {
            const prev = lastStatuses[agent.id];
            if (prev !== agent.status) {
              const data = JSON.stringify(serializeAgent(agent));
              controller.enqueue(
                encoder.encode(`data: ${data}\n\n`)
              );
            }
          }

          lastStatuses = Object.fromEntries(
            agents.map((a) => [a.id, a.status])
          );
        } catch {
          // DB error — skip this tick
        }
      };

      controller.enqueue(encoder.encode(": keepalive\n\n"));

      // Initial full push
      try {
        const agents = await prisma.agent.findMany();
        for (const agent of agents) {
          const data = JSON.stringify(serializeAgent(agent));
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        lastStatuses = Object.fromEntries(
          agents.map((a) => [a.id, a.status])
        );
      } catch {
        // ignore
      }

      const interval = setInterval(poll, 2000);
      request.signal.addEventListener("abort", () => clearInterval(interval));
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
