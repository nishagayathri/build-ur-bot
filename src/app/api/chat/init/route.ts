import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { initializeAgentPrompts } from "@/lib/prompt-initialization";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/chat/init
 *
 * Called once after launch. Streams the EIC welcome greeting via SSE
 * so the user sees tokens arrive in real-time. Prompt initialization
 * runs in the background (non-blocking).
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accountId, threadId } = body as { accountId: string; threadId?: string };

  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json(
      { error: "accountId is required" },
      { status: 400 },
    );
  }

  // Verify the account exists
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Skip if this thread (or the legacy account chat) already has messages
  const existing = await prisma.chatMessage.findFirst({
    where: { accountId, ...(threadId ? { threadId } : {}) },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ skip: true });
  }

  // Load account context for the greeting
  const [profile, agents, personas] = await Promise.all([
    prisma.accountProfile.findUnique({ where: { accountId } }),
    prisma.agent.findMany({ where: { accountId }, select: { name: true, desk: true } }),
    prisma.persona.findMany({ where: { accountId }, select: { accountHandle: true, platform: true } }),
  ]);

  // Fire prompt initialization only on the very first thread for the account
  const anyExisting = threadId
    ? await prisma.chatMessage.findFirst({ where: { accountId }, select: { id: true } })
    : null;
  if (!anyExisting) {
    initializeAgentPrompts(accountId).catch((err) =>
      console.error("[EIC init] prompt initialization failed:", err),
    );
  }

  const deskSummary = agents
    .map((a) => `${a.name} (${a.desk.replace(/_/g, " ")})`)
    .join(", ");
  const personaSummary = personas
    .map((p) => `@${p.accountHandle} on ${p.platform}`)
    .join(", ");

  const model = new ChatOpenAI({
    model: "claude-sonnet-4-6",
    temperature: 0.5,
    maxTokens: 512,
    streaming: true,
    configuration: {
      baseURL: process.env.LITELLM_BASE_URL || "https://litellmprod.deriv.ai/v1",
      apiKey: process.env.LITELLM_API_KEY,
    },
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const markets = profile?.markets ?? [];
        const suspiciousMarkets = markets.filter((m) => {
          // Heuristic: flag anything that doesn't look like a real market name.
          // Real market names tend to contain recognisable words or currency/ticker patterns.
          const isLikelyReal =
            /^[a-z]{2,}\/[a-z]{2,}$/i.test(m) || // currency pair e.g. EUR/USD
            /^[A-Z]{1,5}$/.test(m) ||             // short ticker e.g. AAPL, BTC
            /forex|crypto|equit|stock|commodit|index|indic|bond|future|option|etf|cfd|fx|gold|silver|oil|bitcoin|ethereum|nasdaq|ftse|s&p|dow/i.test(m);
          return !isLikelyReal;
        });

        const systemNote =
          suspiciousMarkets.length > 0
            ? " If you notice any market names in the list that don't look like real financial instruments or asset classes, flag them clearly and ask the user to update them — your data agents won't be able to monitor anything they can't query. Frame this as an editorial heads-up, not a technical error."
            : " Everything is configured correctly — be positive and confident.";

        const responseStream = await model.stream([
          new SystemMessage(
            "You are the Editor-in-Chief of an AI-powered financial content newsroom. " +
              "You've just finished setting up. Be warm, professional, and concise. " +
              "FORMATTING RULES: Do NOT use markdown headings (#). Do NOT use emojis. " +
              "Use **bold** for emphasis and bullet lists with - for structure." +
              systemNote,
          ),
          new HumanMessage(
            `You've just launched this newsroom. Here's what was set up:\n` +
              `- Brand: ${profile?.brandName ?? "the newsroom"}\n` +
              `- Markets configured: ${markets.length > 0 ? markets.join(", ") : "none"}\n` +
              `- Team: ${deskSummary || "no agents yet"}\n` +
              `- Personas: ${personaSummary || "none yet"}\n\n` +
              `Introduce yourself briefly and welcome the user. Mention the team you've assembled and what they can ask you about.` +
              (suspiciousMarkets.length > 0
                ? ` Note: the following markets look unrecognised and should be flagged: ${suspiciousMarkets.join(", ")}.`
                : "") +
              ` Keep it under 180 words.`,
          ),
        ]);

        for await (const chunk of responseStream) {
          const raw =
            typeof chunk.content === "string" ? chunk.content : "";
          // Strip emojis and markdown headings
          const token = raw
            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
            .replace(/^#{1,6}\s+/gm, "");
          if (token) {
            fullResponse += token;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token })}\n\n`),
            );
          }
        }

        // Persist the full greeting
        if (fullResponse) {
          await prisma.chatMessage.create({
            data: { accountId, threadId: threadId ?? null, role: "eic", content: fullResponse },
          });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Greeting failed";
        console.error("[EIC init] stream error:", errMsg);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errMsg })}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
