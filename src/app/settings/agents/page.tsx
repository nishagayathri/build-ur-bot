"use client";

import { useAccountContext } from "@/context/AccountContext";

export default function AgentsSettingsPage() {
  const { activeAccount } = useAccountContext();

  if (!activeAccount) {
    return <div className="text-muted-foreground">No account selected.</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Agent configuration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fine-tune individual agents: model selection, heartbeat scheduling,
          system prompts, and budget allocation.
        </p>
      </div>

      {/* TODO: Advanced agent config (model, heartbeat, prompts, budget) */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Advanced agent configuration will be available here. For now, manage
          agents from the Agents page.
        </p>
      </div>
    </div>
  );
}
