import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { buildEICChatGraph } from "@/agents/graphs/eic-chat";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/chat/send
 *
 * Runs the EIC agent and streams back SSE events:
 *   { type: "token",      text: "..." }
 *   { type: "tool_start", id: "...", name: "...", input: {...} }
 *   { type: "tool_end",   id: "...", name: "...", output: "..." }
 *   { type: "done" }
 *   { type: "error",      message: "..." }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, accountId, threadId } = body as {
    message: string;
    accountId: string;
    threadId?: string;
  };

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!accountId) {
    return new Response(JSON.stringify({ error: "accountId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await prisma.chatMessage.create({
    data: { accountId, threadId: threadId ?? null, role: "user", content: message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { accountId, ...(threadId ? { threadId } : {}) },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const messages = history.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );
  messages.push(new HumanMessage(message));

  const graph = await buildEICChatGraph(accountId);
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        const eventStream = graph.streamEvents({ messages }, { version: "v2" });

        for await (const event of eventStream) {
          if (event.event === "on_chat_model_stream") {
            const chunk = event.data?.chunk;
            if (chunk?.content && typeof chunk.content === "string") {
              fullResponse += chunk.content;
              emit({ type: "token", text: chunk.content });
            }
          } else if (event.event === "on_tool_start") {
            emit({
              type: "tool_start",
              id: event.run_id,
              name: event.name,
              input: event.data?.input ?? {},
            });
          } else if (event.event === "on_tool_end") {
            const raw = event.data?.output;
            const output =
              typeof raw === "string"
                ? raw
                : (raw?.content as string | undefined) ?? JSON.stringify(raw);
            emit({ type: "tool_end", id: event.run_id, name: event.name, output });
          }
        }

        if (fullResponse) {
          await prisma.chatMessage.create({
            data: { accountId, threadId: threadId ?? null, role: "eic", content: fullResponse },
          });
        }

        emit({ type: "done" });
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Agent error";
        console.error("[chat/send]", msg);
        emit({ type: "error", message: msg });
        controller.close();
      }
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
