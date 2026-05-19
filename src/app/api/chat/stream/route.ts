import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { buildEICChatGraph } from "@/agents/graphs/eic-chat";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { message, accountId } = await request.json();

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { accountId, role: "user", content: message },
  });

  // Load recent chat history scoped to this account
  const history = await prisma.chatMessage.findMany({
    where: { accountId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const messages = history.map((m) =>
    m.role === "user"
      ? new HumanMessage(m.content)
      : new AIMessage(m.content)
  );
  messages.push(new HumanMessage(message));

  // Build graph and stream
  const graph = await buildEICChatGraph(accountId);

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const eventStream = graph.streamEvents(
          { messages },
          { version: "v2" }
        );

        for await (const event of eventStream) {
          if (event.event === "on_chat_model_stream") {
            const chunk = event.data?.chunk;
            if (chunk?.content && typeof chunk.content === "string") {
              fullResponse += chunk.content;
              controller.enqueue(encoder.encode(chunk.content));
            }
          }
        }

        // Save EIC response
        if (fullResponse) {
          await prisma.chatMessage.create({
            data: { accountId, role: "eic", content: fullResponse },
          });
        }

        controller.close();
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Agent execution failed";
        controller.enqueue(
          encoder.encode(`\n\n[Error: ${errMsg}]`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
