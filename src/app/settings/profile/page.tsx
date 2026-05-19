"use client";

import { useAccountContext } from "@/context/AccountContext";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const { activeAccount } = useAccountContext();

  if (!activeAccount) {
    return <div className="text-muted-foreground">No account selected.</div>;
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Brand profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit your brand identity, voice, content strategy, compliance rules,
          and intelligence triggers. Changes will update your agent
          configurations.
        </p>
      </div>

      {/* TODO: Embed BrandProfileStep in edit mode */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Brand profile editor will be available here. For now, your profile was
          configured during onboarding.
        </p>
      </div>
    </div>
  );
}
