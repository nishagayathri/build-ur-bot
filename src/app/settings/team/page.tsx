"use client";

import { useAccountContext } from "@/context/AccountContext";
import { useAccount } from "@/hooks/useAccounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, Mail } from "lucide-react";

export default function TeamSettingsPage() {
  const { activeAccount } = useAccountContext();
  const { data: account } = useAccount(activeAccount?.id ?? null);

  if (!activeAccount) {
    return <div className="text-muted-foreground">No account selected.</div>;
  }

  const members = account?.members ?? [];

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who has access to this newsroom.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Mail className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      <div className="space-y-2">
        {members.map(
          (member: {
            id: string;
            user_name: string | null;
            user_email: string;
            role: string;
          }) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(member.user_name ?? member.user_email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {member.user_name ?? member.user_email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.user_email}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{member.role}</Badge>
            </div>
          )
        )}
      </div>
    </div>
  );
}
