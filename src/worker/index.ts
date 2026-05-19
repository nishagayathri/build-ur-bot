import dotenv from "dotenv";
dotenv.config({ override: true });

import { getQueue } from "./queue";
import { startScheduler } from "./scheduler";
import { processAgentLoop } from "./processors/agent-loop";
import { processSignalIngestion } from "./processors/signal-ingestion";
import { processPublication } from "./processors/publication";
import { processBudgetReset } from "./processors/budget-reset";
import {
  processFmpMarketData,
  processFmpNews,
  processFmpEconomicCalendar,
  processFmpEarningsCalendar,
  processFmpInsiderTrading,
} from "./processors/fmp-ingestion";

async function main(): Promise<void> {
  console.log("[worker] Starting Marketary worker service...");

  const boss = await getQueue();
  console.log("[worker] pg-boss queue connected");

  // ── Create queues and register processors ───────────────────────────
  await boss.createQueue("agent-loop");
  await boss.createQueue("signal-ingestion");
  await boss.createQueue("publication");
  await boss.createQueue("budget-reset");
  await boss.createQueue("fmp-market-data");
  await boss.createQueue("fmp-news");
  await boss.createQueue("fmp-economic-calendar");
  await boss.createQueue("fmp-earnings-calendar");
  await boss.createQueue("fmp-insider-trading");
  console.log("[worker] Queues created");

  await boss.work("agent-loop", processAgentLoop);
  console.log("[worker] Registered processor: agent-loop");

  await boss.work("signal-ingestion", async () => {
    await processSignalIngestion();
  });
  console.log("[worker] Registered processor: signal-ingestion");

  await boss.work("publication", async () => {
    await processPublication();
  });
  console.log("[worker] Registered processor: publication");

  await boss.work("budget-reset", async () => {
    await processBudgetReset();
  });
  console.log("[worker] Registered processor: budget-reset");

  await boss.work("fmp-market-data", async () => {
    await processFmpMarketData();
  });
  console.log("[worker] Registered processor: fmp-market-data");

  await boss.work("fmp-news", async () => {
    await processFmpNews();
  });
  console.log("[worker] Registered processor: fmp-news");

  await boss.work("fmp-economic-calendar", async () => {
    await processFmpEconomicCalendar();
  });
  console.log("[worker] Registered processor: fmp-economic-calendar");

  await boss.work("fmp-earnings-calendar", async () => {
    await processFmpEarningsCalendar();
  });
  console.log("[worker] Registered processor: fmp-earnings-calendar");

  await boss.work("fmp-insider-trading", async () => {
    await processFmpInsiderTrading();
  });
  console.log("[worker] Registered processor: fmp-insider-trading");

  // ── Start the scheduler ────────────────────────────────────────────
  await startScheduler(boss);

  console.log("[worker] Marketary worker service is running");
  console.log("[worker] Press Ctrl+C to stop");

  // ── Graceful shutdown ──────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[worker] Received ${signal}, shutting down gracefully...`);
    try {
      await boss.stop({ graceful: true, timeout: 10_000 });
      console.log("[worker] pg-boss stopped");
    } catch (error) {
      console.error("[worker] Error during shutdown:", error);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("[worker] Fatal error:", error);
  process.exit(1);
});
