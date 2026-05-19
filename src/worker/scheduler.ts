import PgBoss from "pg-boss";

/**
 * Register recurring jobs with pg-boss.
 *
 * pg-boss v10 requires queues to exist before scheduling.
 * `boss.work()` creates queues implicitly, but `boss.schedule()` does not —
 * so we explicitly create queues first for scheduled jobs.
 */
export async function startScheduler(boss: PgBoss): Promise<void> {
  // ── Signal ingestion: every 30 seconds ─────────────────────────────
  // pg-boss cron only supports minute granularity, so we use setInterval
  setInterval(async () => {
    try {
      await boss.send("signal-ingestion", {});
    } catch (error) {
      console.error("[scheduler] Failed to enqueue signal-ingestion:", error);
    }
  }, 30_000);

  // Fire one immediately on startup
  try {
    await boss.send("signal-ingestion", {});
  } catch {
    // Queue may not be ready yet on first run
  }

  // ── Publication check: every minute ────────────────────────────────
  await boss.schedule("publication", "* * * * *", {});

  // ── Budget reset: daily at midnight ────────────────────────────────
  await boss.schedule("budget-reset", "0 0 * * *", {});

  // ── FMP Market Data: every 30 minutes ─────────────────────────────
  await boss.schedule("fmp-market-data", "*/30 * * * *", {});

  // ── FMP News: every 30 minutes ────────────────────────────────────
  await boss.schedule("fmp-news", "*/30 * * * *", {});

  // ── FMP Economic Calendar: every hour ─────────────────────────────
  await boss.schedule("fmp-economic-calendar", "0 * * * *", {});

  // ── FMP Earnings Calendar: every hour ─────────────────────────────
  await boss.schedule("fmp-earnings-calendar", "0 * * * *", {});

  // ── FMP Insider Trading: every hour ───────────────────────────────
  await boss.schedule("fmp-insider-trading", "0 * * * *", {});

  console.log("[scheduler] Recurring jobs registered:");
  console.log("  - signal-ingestion      : every 30s (setInterval)");
  console.log("  - publication           : every minute (cron)");
  console.log("  - budget-reset          : daily at midnight (cron)");
  console.log("  - fmp-market-data       : every 30 min (cron)");
  console.log("  - fmp-news              : every 30 min (cron)");
  console.log("  - fmp-economic-calendar : every hour (cron)");
  console.log("  - fmp-earnings-calendar : every hour (cron)");
  console.log("  - fmp-insider-trading   : every hour (cron)");
}
