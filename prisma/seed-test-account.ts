/**
 * Seeds a test account with agents and personas for E2E testing.
 *
 * Usage:
 *   1. Sign up at http://localhost:3000/auth/signin
 *   2. Run: npx tsx prisma/seed-test-account.ts
 *
 * The script auto-detects the first user in the DB (from your sign-up).
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find the first user (from sign-up)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found. Sign up at http://localhost:3000/auth/signin first.");
    process.exit(1);
  }
  console.log(`Found user: ${user.email} (${user.id})`);

  const ACCOUNT_ID = "acct-test-newsroom";
  const SLUG = "test-newsroom";

  // Create account
  await prisma.account.upsert({
    where: { id: ACCOUNT_ID },
    create: {
      id: ACCOUNT_ID,
      name: "Test Newsroom",
      slug: SLUG,
      description: "Test account for agent runtime E2E testing",
      color: "#6366f1",
      onboardingComplete: true,
      onboardingStep: 6,
    },
    update: {},
  });
  console.log("Account created: Test Newsroom");

  // Link user as OWNER
  await prisma.accountMember.upsert({
    where: { userId_accountId: { userId: user.id, accountId: ACCOUNT_ID } },
    create: {
      userId: user.id,
      accountId: ACCOUNT_ID,
      role: "OWNER",
      acceptedAt: new Date(),
    },
    update: {},
  });
  console.log(`User ${user.email} linked as OWNER`);

  // Create account profile
  await prisma.accountProfile.upsert({
    where: { accountId: ACCOUNT_ID },
    create: {
      accountId: ACCOUNT_ID,
      markets: ["EUR/USD", "BTC/USD", "GOLD", "S&P 500"],
      targetAudience: "Retail traders and financial enthusiasts",
      editorialAngle: "Data-driven market analysis with actionable trading insights",
      voicePersonality: "Authoritative Expert",
      toneFormal: 7,
      toneSeriousness: 6,
      toneProvocativeness: 3,
      toneTechnical: 7,
      contentGoals: { education: 40, analysis: 40, engagement: 20 },
      contentMix: { analysis: 40, promo: 20, commentary: 25, engagement: 15 },
      reactionSpeed: "FAST",
      predictionSensitivity: "MODERATE",
      offLimitsTopics: ["guaranteed returns", "insider tips"],
    },
    update: {},
  });
  console.log("Account profile created");

  // Create a social connection (X/Twitter)
  await prisma.socialConnection.upsert({
    where: {
      accountId_platform_handle: {
        accountId: ACCOUNT_ID,
        platform: "X",
        handle: "testnewsroom",
      },
    },
    create: {
      accountId: ACCOUNT_ID,
      platform: "X",
      handle: "testnewsroom",
      displayName: "Test Newsroom",
      connected: true,
      accessToken: "test-token",
      connectedAt: new Date(),
    },
    update: {},
  });
  console.log("Social connection created: @testnewsroom on X");

  // ── Agents ──────────────────────────────────────────────────────────────

  const agents = [
    {
      id: `agent-eic-${SLUG}`,
      name: "EIC Agent",
      desk: "EIC" as const,
      role: "editor_in_chief",
      model: "claude-sonnet-4-6",
      budgetMonthlyUsd: 50,
      costPerOutput: 0.03,
      instrumentsWatched: ["EUR/USD", "BTC/USD", "GOLD", "S&P 500"],
      status: "ACTIVE" as const,
    },
    {
      id: `agent-technical-analysis-${SLUG}`,
      name: "Market Agent",
      desk: "DATA_DESK" as const,
      role: "technical_analysis",
      model: "gemini-3.1-flash-lite-preview",
      budgetMonthlyUsd: 10,
      costPerOutput: 0.005,
      instrumentsWatched: ["EUR/USD", "BTC/USD", "GOLD", "S&P 500"],
    },
    {
      id: `agent-news-monitoring-${SLUG}`,
      name: "News Agent",
      desk: "DATA_DESK" as const,
      role: "news_monitoring",
      model: "gemini-3.1-flash-lite-preview",
      budgetMonthlyUsd: 10,
      costPerOutput: 0.005,
      instrumentsWatched: ["EUR/USD", "BTC/USD", "GOLD", "S&P 500"],
    },
    {
      id: `agent-writer-x-testnewsroom`,
      name: "Writer: @testnewsroom",
      desk: "CONTENT_DESK" as const,
      role: "writer",
      model: "claude-sonnet-4-6",
      budgetMonthlyUsd: 30,
      costPerOutput: 0.03,
      instrumentsWatched: ["EUR/USD", "BTC/USD", "GOLD", "S&P 500"],
      assignedPersona: "persona-x-testnewsroom",
    },
    {
      id: `agent-trend-surfacing-${SLUG}`,
      name: "Trend Watcher",
      desk: "ENGAGEMENT_DESK" as const,
      role: "trend_surfacing",
      model: "gemini-3.1-flash-lite-preview",
      budgetMonthlyUsd: 10,
      costPerOutput: 0.005,
      instrumentsWatched: ["EUR/USD", "BTC/USD", "GOLD", "S&P 500"],
    },
  ];

  for (const a of agents) {
    await prisma.agent.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        accountId: ACCOUNT_ID,
        name: a.name,
        desk: a.desk,
        role: a.role,
        model: a.model,
        adapterType: "process",
        budgetMonthlyUsd: a.budgetMonthlyUsd,
        costPerOutput: a.costPerOutput,
        instrumentsWatched: a.instrumentsWatched,
        adapterConfig: {},
        assignedPersona: (a as { assignedPersona?: string }).assignedPersona ?? null,
        ...("status" in a && { status: a.status }),
      },
      update: {
        ...("status" in a && { status: a.status }),
      },
    });
    console.log(`Agent created: ${a.name} (${a.desk})`);
  }

  // ── Persona ─────────────────────────────────────────────────────────────

  await prisma.persona.upsert({
    where: { id: "persona-x-testnewsroom" },
    create: {
      id: "persona-x-testnewsroom",
      accountId: ACCOUNT_ID,
      accountHandle: "testnewsroom",
      platform: "X",
      displayName: "Test Newsroom",
      voice: "Authoritative Expert",
      avatarColor: "#6366f1",
      topicWeights: { market_analysis: 0.4, deriv_promo: 0.2, macro_commentary: 0.25, engagement: 0.15 },
      maxPostsPerDay: 5,
      postsToday: 0,
      performance7d: { avg_impressions: 0, avg_engagements: 0, best_post_type: "thread" },
      offLimitsTopics: ["guaranteed returns", "insider tips"],
      postingHours: { start: 8, end: 22 },
    },
    update: {},
  });
  console.log("Persona created: @testnewsroom on X");

  // ── Seed a couple of stories so agents have something to work with ─────

  const stories = [
    {
      id: `story_seed_1`,
      entity: "EUR/USD",
      entityType: "FOREX" as const,
      headline: "EUR/USD breaks above 1.14 resistance on ECB hawkish signals",
      priority: "HIGH" as const,
      status: "DETECTED" as const,
      signalsStacked: [
        { source: "PRICE", value: "EUR/USD +0.45%", confidence: 0.85, timestamp: new Date().toISOString() },
        { source: "NEWS", value: "ECB rate decision hawkish", confidence: 0.9, timestamp: new Date().toISOString() },
      ],
      stackingScore: 72,
    },
    {
      id: `story_seed_2`,
      entity: "BTC/USD",
      entityType: "CRYPTO" as const,
      headline: "Bitcoin approaches $100K as institutional inflows accelerate",
      priority: "CRITICAL" as const,
      status: "DETECTED" as const,
      signalsStacked: [
        { source: "PRICE", value: "BTC +3.2%", confidence: 0.92, timestamp: new Date().toISOString() },
        { source: "SOCIAL_TREND", value: "Bitcoin trending #1", confidence: 0.78, timestamp: new Date().toISOString() },
        { source: "NEWS", value: "BlackRock ETF inflows hit record", confidence: 0.95, timestamp: new Date().toISOString() },
      ],
      stackingScore: 88,
    },
  ];

  for (const s of stories) {
    await prisma.story.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        accountId: ACCOUNT_ID,
        entity: s.entity,
        entityType: s.entityType,
        headline: s.headline,
        priority: s.priority,
        status: s.status,
        signalsStacked: s.signalsStacked,
        stackingScore: s.stackingScore,
        auditTrail: [{ timestamp: new Date().toISOString(), agent: "system", action: "Seeded for testing" }],
      },
      update: {},
    });
    console.log(`Story seeded: ${s.headline.slice(0, 50)}...`);
  }

  console.log("\n--- Seed complete ---");
  console.log(`Account: ${ACCOUNT_ID}`);
  console.log(`Agents: ${agents.length}`);
  console.log(`Personas: 1`);
  console.log(`Stories: ${stories.length}`);
  console.log("\nNext steps:");
  console.log("  1. Sign in at http://localhost:3000/auth/signin");
  console.log("  2. Test EIC agent: POST /api/agents/agent-eic-test-newsroom/run");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
