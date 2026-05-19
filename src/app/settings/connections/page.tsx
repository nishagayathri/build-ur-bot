"use client";

import { useAccountContext } from "@/context/AccountContext";
import { useAccount } from "@/hooks/useAccounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";

export default function ConnectionsSettingsPage() {
  const { activeAccount } = useAccountContext();
  const { data: account } = useAccount(activeAccount?.id ?? null);

  if (!activeAccount) {
    return <div className="text-muted-foreground">No account selected.</div>;
  }

  const connections = account?.social_connections ?? [];

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Social connections</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your linked social media platforms.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Connect platform
        </Button>
      </div>

      <div className="space-y-2">
        {connections.map(
          (conn: {
            id: string;
            platform: string;
            handle: string;
            connected: boolean;
          }) => (
            <div
              key={conn.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline">{conn.platform}</Badge>
                <span className="text-sm font-medium">@{conn.handle}</span>
              </div>
              {conn.connected && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 text-emerald-500"
                >
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
              )}
            </div>
          )
        )}
        {connections.length === 0 && (
          <p className="text-sm text-muted-foreground">No platforms connected yet.</p>
        )}
      </div>
    </div>
  );
}
