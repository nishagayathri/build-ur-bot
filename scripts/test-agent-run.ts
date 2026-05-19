/**
 * Direct test of the agent executor — bypasses API auth.
 * Usage: npx tsx scripts/test-agent-run.ts
 */
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { executeAgent } = await import("../src/agents/runtime/executor");

  const agentId = process.argv[2] || "agent-eic-test-newsroom";
  const task = process.argv[3] || "Review the current pipeline. Query all stories, check your budget, and report your assessment.";

  console.log(`\n--- Executing agent: ${agentId} ---`);
  console.log(`Task: ${task}\n`);

  const start = Date.now();

  try {
    const run = await executeAgent(agentId, { task });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n--- Run completed in ${elapsed}s ---`);
    console.log(`Run ID: ${run.id}`);
    console.log(`Status: ${run.status}`);
    console.log(`Tokens: ${run.tokenCount}`);
    console.log(`Cost: $${run.costUsd}`);
    console.log(`Steps: ${run.steps.length}`);
    console.log(`Tool invocations: ${run.tools.length}`);

    for (const t of run.tools) {
      console.log(`  - ${t.toolName}: ${JSON.stringify(t.input).slice(0, 100)}`);
    }

    const output = run.output as { content?: string } | null;
    console.log(`\n--- Agent output ---`);
    console.log(output?.content ?? JSON.stringify(run.output));
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\n--- Run FAILED after ${elapsed}s ---`);
    console.error(error);
  }

  process.exit(0);
}

main();
