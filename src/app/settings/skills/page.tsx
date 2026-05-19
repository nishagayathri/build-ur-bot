"use client";

import { useAccountContext } from "@/context/AccountContext";

export default function SkillsSettingsPage() {
  const { activeAccount } = useAccountContext();

  if (!activeAccount) {
    return <div className="text-muted-foreground">No account selected.</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Skills & tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure which AI capabilities your newsroom uses. Changing skills
          may add or remove agents.
        </p>
      </div>

      {/* TODO: Embed SkillsConfigStep in edit mode */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Skills configuration editor will be available here. For now, your
          skills were configured during onboarding.
        </p>
      </div>
    </div>
  );
}
