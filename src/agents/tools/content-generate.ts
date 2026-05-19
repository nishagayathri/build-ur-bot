import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Content generation helper tool.
 *
 * This does NOT call an LLM directly -- it assembles a structured prompt
 * template that the agent graph can feed into the model on the next
 * ReAct cycle. This keeps tool execution deterministic and cost-free
 * while letting the agent control the creative step.
 */
export const contentGenerate = tool(
  async ({ topic, persona, maxLength }) => {
    const charLimit = maxLength ?? 280;

    const prompt = [
      `You are writing as the persona "${persona}".`,
      `Topic: ${topic}`,
      ``,
      `Requirements:`,
      `- Maximum length: ${charLimit} characters`,
      `- Stay in persona voice throughout`,
      `- Include one actionable insight or clear takeaway`,
      `- Do NOT make forward-looking performance claims`,
      `- Do NOT use phrases like "guaranteed", "risk-free", or "will go up"`,
      `- Include a relevant $TICKER or asset reference where appropriate`,
      `- Ensure the content is suitable for publication on social media`,
      ``,
      `Write the content now. Return ONLY the post text, nothing else.`,
    ].join("\n");

    return JSON.stringify({
      ok: true,
      promptTemplate: prompt,
      persona,
      topic,
      charLimit,
      note: "Feed this prompt to the model in the next step to generate the actual content.",
    });
  },
  {
    name: "contentGenerate",
    description:
      "Generate a structured prompt template for content creation. Returns a prompt that should be fed to the model to produce the actual social media content. The tool itself does not call an LLM.",
    schema: z.object({
      topic: z
        .string()
        .describe("The topic or angle for the content piece"),
      persona: z
        .string()
        .describe("The persona handle to write as (e.g. @MarketaryFX)"),
      maxLength: z
        .number()
        .int()
        .min(50)
        .max(4000)
        .optional()
        .describe("Maximum character length for the generated content (default 280)"),
    }),
  },
);
