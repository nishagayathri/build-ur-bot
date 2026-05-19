/**
 * EIC-authored agent prompt initialization.
 *
 * Instead of filling in templates, this calls the EIC LLM with the full
 * onboarding context and asks it to author a personalized system prompt
 * for every agent on the team. The EIC sees the whole picture — brand,
 * markets, voice, compliance, the full roster — and makes editorial
 * decisions about emphasis, priorities, and inter-agent differentiation
 * that a template can't capture.
 *
 * Called automatically after launch, and available as the EIC's
 * `reinitialize_prompts` chat tool.
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AgentBrief {
  id: string;
  name: string;
  desk: string;
  role: string;
  instrumentsWatched: string[];
  assignedPersona: string | null;
  personaHandle?: string;
  personaPlatform?: string;
}

// ─── Tone label helpers ─────────────────────────────────────────────────────

function toneLabel(value: number, low: string, high: string): string {
  if (value <= 3) return low;
  if (value >= 8) return high;
  return `balanced (${value}/10)`;
}

// ─── Build the meta-prompt ──────────────────────────────────────────────────

const EIC_META_SYSTEM = `You are the Editor-in-Chief of an AI-powered financial content newsroom. You have just finished onboarding and your newsroom is being launched.

Your task: write a personalized system prompt for EVERY agent on your team. Each prompt will be saved and used as that agent's permanent instructions. You are the only one who decides what each agent's priorities, voice, and constraints should be — you're briefing your team.

Think like a real editor-in-chief:
- Differentiate agents. The Market Agent and News Agent should NOT have identical prompts — one watches price action, the other watches headlines.
- For writers, encode the persona's unique voice and character. If you have multiple writers, make them sound DIFFERENT from each other while staying on-brand.
- For data agents, be specific about what signals matter for their domain and what to ignore.
- For engagement agents, be clear about what's on-brand and what crosses the line.
- Bake compliance rules into every prompt where relevant — don't just append them, integrate them into the agent's worldview.
- Your own EIC prompt should reflect how YOU want to run this specific newsroom — your editorial priorities, your decision-making style, your quality bar.

IMPORTANT RULES FOR ALL PROMPTS:
- Every prompt must include the tools available to that agent
- Every prompt must include compliance constraints relevant to the agent's role
- Writer prompts MUST include platform-specific constraints (character limits, format)
- Data desk prompts MUST specify the instruments to watch and signal output format
- The EIC prompt must include the decision framework and approval workflow

OUTPUT FORMAT:
Return a JSON object where keys are agent IDs and values are the full system prompt string for that agent.
Return ONLY the JSON object, no markdown fences, no explanation before or after.

Example structure:
{"agent-eic-acme": "You are the Editor-in-Chief of Acme Markets...", "agent-market-acme": "You are the Market Agent..."}`;

function buildHumanMessage(
  profile: {
    brandName: string | null;
    brandOneLiner: string | null;
    markets: string[];
    targetAudience: string;
    editorialAngle: string;
    voicePersonality: string;
    secondaryVoice: string | null;
    toneFormal: number;
    toneSeriousness: number;
    toneProvocativeness: number;
    toneTechnical: number;
    alwaysUseTerms: string[];
    neverUseTerms: string[];
    contentGoals: unknown;
    contentMix: unknown;
    reactionSpeed: string;
    isRegulated: boolean;
    regulatoryJurisdiction: string | null;
    requiredDisclaimers: string[];
    offLimitsTopics: string[];
    predictionSensitivity: string;
    approvalRequirement: string;
    triggerThresholds: unknown;
    prepositionEnabled: boolean;
    sentimentArbEnabled: boolean;
  },
  agents: AgentBrief[],
): string {
  const sections: string[] = [];

  // ── Brand & Identity ──
  sections.push(`## BRAND PROFILE
Brand: ${profile.brandName ?? "Unnamed newsroom"}${profile.brandOneLiner ? ` — ${profile.brandOneLiner}` : ""}
Editorial Angle: ${profile.editorialAngle}
Markets: ${profile.markets.join(", ")}
Target Audience: ${profile.targetAudience}`);

  // ── Voice & Tone ──
  sections.push(`## VOICE & TONE
Primary Voice: ${profile.voicePersonality}${profile.secondaryVoice ? `\nSecondary Voice: ${profile.secondaryVoice}` : ""}
Formality: ${toneLabel(profile.toneFormal, "formal/professional", "casual/conversational")}
Seriousness: ${toneLabel(profile.toneSeriousness, "serious/measured", "playful/witty")}
Risk Appetite: ${toneLabel(profile.toneProvocativeness, "conservative/safe", "provocative/bold")}
Technical Depth: ${toneLabel(profile.toneTechnical, "technical/jargon-heavy", "accessible/general audience")}
${profile.alwaysUseTerms.length > 0 ? `Required Terms: ${profile.alwaysUseTerms.join(", ")}` : ""}
${profile.neverUseTerms.length > 0 ? `Banned Terms: ${profile.neverUseTerms.join(", ")}` : ""}`);

  // ── Content Strategy ──
  const goals = Array.isArray(profile.contentGoals)
    ? (profile.contentGoals as string[]).map((g, i) => `  ${i + 1}. ${g}`).join("\n")
    : "  1. Build brand awareness";

  sections.push(`## CONTENT STRATEGY
Goals (ranked):
${goals}
Content Mix: ${JSON.stringify(profile.contentMix)}
Reaction Speed: ${profile.reactionSpeed}
Pre-positioning: ${profile.prepositionEnabled ? "ENABLED" : "disabled"}
Sentiment Arbitrage: ${profile.sentimentArbEnabled ? "ENABLED" : "disabled"}`);

  // ── Compliance ──
  sections.push(`## COMPLIANCE & GUARDRAILS
Prediction Sensitivity: ${profile.predictionSensitivity}
Approval Requirement: ${profile.approvalRequirement}
Regulated Entity: ${profile.isRegulated ? `YES — ${profile.regulatoryJurisdiction ?? "jurisdiction unspecified"}` : "No"}
${profile.requiredDisclaimers.length > 0 ? `Required Disclaimers:\n${profile.requiredDisclaimers.map((d) => `  - "${d}"`).join("\n")}` : ""}
${profile.offLimitsTopics.length > 0 ? `Off-Limits Topics:\n${profile.offLimitsTopics.map((t) => `  - ${t}`).join("\n")}` : ""}
Trigger Thresholds: ${JSON.stringify(profile.triggerThresholds)}`);

  // ── Agent Roster ──
  const rosterLines = agents.map((a) => {
    let line = `- ${a.id} | ${a.name} | Desk: ${a.desk} | Role: ${a.role}`;
    if (a.instrumentsWatched.length > 0) {
      line += ` | Instruments: ${a.instrumentsWatched.join(", ")}`;
    }
    if (a.personaHandle) {
      line += ` | Persona: ${a.personaHandle} on ${a.personaPlatform}`;
    }
    return line;
  });

  sections.push(`## AGENT ROSTER (generate a prompt for each)
${rosterLines.join("\n")}`);

  // ── Tool reference ──
  sections.push(`## AVAILABLE TOOLS BY DESK
EIC: pipelineQuery, pipelineMutate, signalStacking, personaLookup, budgetCheck, reinitialize_prompts
DATA_DESK: pipelineQuery, marketQuote, stockNews, economicCalendar, marketMovers, budgetCheck
CONTENT_DESK: pipelineQuery, contentGenerate, personaLookup, budgetCheck
ENGAGEMENT_DESK: pipelineQuery, budgetCheck`);

  // ── Platform constraints ──
  sections.push(`## PLATFORM CONSTRAINTS (for writer prompts)
X: Max 280 characters per post, threads OK for longer pieces
INSTAGRAM: Visual-first, captions under 500 characters
LINKEDIN: Professional tone, up to 1300 characters
TIKTOK: Short-form video scripts, under 60 seconds spoken word
YOUTUBE: Long-form video scripts, structured with intro/body/CTA
THREADS: Up to 500 characters, conversational tone
REDDIT: Community-native, longer posts OK, cite sources
TELEGRAM: Direct and concise, channel-post format`);

  sections.push(
    "Now generate the JSON object with a system prompt for each agent in the roster. Remember: return ONLY raw JSON, no markdown fences."
  );

  return sections.join("\n\n");
}

// ─── JSON extraction ────────────────────────────────────────────────────────

function extractJSON(text: string): Record<string, string> {
  // Try parsing raw text first
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown code fences if present
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim());
    }
    // Try finding the first { ... } block
    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      return JSON.parse(text.slice(braceStart, braceEnd + 1));
    }
    throw new Error("Could not extract JSON from EIC response");
  }
}

// ─── Main initialization function ───────────────────────────────────────────

export async function initializeAgentPrompts(
  accountId: string,
): Promise<{ updated: number; skipped: number }> {
  const [profile, agents, personas] = await Promise.all([
    prisma.accountProfile.findUnique({ where: { accountId } }),
    prisma.agent.findMany({ where: { accountId } }),
    prisma.persona.findMany({ where: { accountId } }),
  ]);

  if (!profile) {
    return { updated: 0, skipped: agents.length };
  }

  if (agents.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  // Build the agent briefs with persona info attached
  const personaById = new Map(personas.map((p) => [p.id, p]));
  const agentBriefs: AgentBrief[] = agents.map((a) => {
    const persona = a.assignedPersona ? personaById.get(a.assignedPersona) : null;
    return {
      id: a.id,
      name: a.name,
      desk: a.desk,
      role: a.role,
      instrumentsWatched: a.instrumentsWatched,
      assignedPersona: a.assignedPersona,
      personaHandle: persona ? `@${persona.accountHandle}` : undefined,
      personaPlatform: persona?.platform,
    };
  });

  // Call the EIC LLM
  const model = new ChatOpenAI({
    model: "claude-sonnet-4-6",
    temperature: 0.4,
    maxTokens: 16384,
    configuration: {
      baseURL: process.env.LITELLM_BASE_URL || "https://litellmprod.deriv.ai/v1",
      apiKey: process.env.LITELLM_API_KEY,
    },
  });

  const response = await model.invoke([
    new SystemMessage(EIC_META_SYSTEM),
    new HumanMessage(buildHumanMessage(profile, agentBriefs)),
  ]);

  const content = typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);

  // Parse the EIC's authored prompts
  const promptMap = extractJSON(content);

  // Save to DB
  let updated = 0;
  let skipped = 0;
  const agentIds = new Set(agents.map((a) => a.id));

  for (const [agentId, prompt] of Object.entries(promptMap)) {
    if (!agentIds.has(agentId) || typeof prompt !== "string" || !prompt.trim()) {
      skipped++;
      continue;
    }

    await prisma.agent.update({
      where: { id: agentId },
      data: { systemPromptOverride: prompt },
    });
    updated++;
  }

  // Count agents that the EIC didn't generate prompts for
  skipped += agents.length - updated - skipped;

  return { updated, skipped };
}
