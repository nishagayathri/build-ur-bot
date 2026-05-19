/**
 * One-off backfill: set toolNames for any agent whose toolNames array is empty.
 *
 * Maps agent.role → the canonical tool set defined in the launch route.
 * Safe to re-run — skips agents that already have toolNames.
 *
 * Usage: npx tsx scripts/backfill-agent-tool-names.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ROLE_TO_TOOLS: Record<string, string[]> = {
  editor_in_chief:    ["pipelineQuery", "pipelineMutate", "signalStacking", "personaLookup", "budgetCheck"],
  technical_analysis: ["marketQuote", "marketMovers", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  news_monitoring:    ["stockNews", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  economic_calendar:  ["economicCalendar", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  earnings_calendar:  ["economicCalendar", "marketQuote", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  social_sentiment:   ["stockNews", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  on_chain_analytics: ["marketQuote", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  regulatory_monitor: ["stockNews", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  writer:             ["pipelineQuery", "pipelineMutate", "contentGenerate", "personaLookup", "budgetCheck"],
  trend_surfacing:    ["pipelineQuery", "budgetCheck"],
  auto_reply:         ["pipelineQuery", "budgetCheck"],
  competitor_tracking:["pipelineQuery", "budgetCheck"],
};

async function main() {
  const agents = await prisma.agent.findMany({
    where: { toolNames: { isEmpty: true } },
    select: { id: true, name: true, role: true, desk: true },
  });

  if (agents.length === 0) {
    console.log("No agents with empty toolNames found — nothing to do.");
    return;
  }

  console.log(`Found ${agents.length} agent(s) with empty toolNames:\n`);

  let updated = 0;
  let skipped = 0;

  for (const agent of agents) {
    const tools = ROLE_TO_TOOLS[agent.role];

    if (!tools) {
      console.log(`  SKIP  ${agent.name} (${agent.id}) — unknown role "${agent.role}"`);
      skipped++;
      continue;
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { toolNames: tools },
    });

    console.log(`  SET   ${agent.name} (${agent.id}) → [${tools.join(", ")}]`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
