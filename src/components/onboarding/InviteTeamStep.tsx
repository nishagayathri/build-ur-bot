"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Users, ArrowRight, Shield, PenLine, Eye } from "lucide-react";

interface Invite {
  email: string;
  role: string;
}

interface InviteTeamStepProps {
  accountId: string;
  onNext: () => void;
}

export function InviteTeamStep({ accountId, onNext }: InviteTeamStepProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function handleAdd() {
    if (!email) return;
    if (invites.some((inv) => inv.email === email)) {
      setError("This email is already in the list");
      return;
    }
    setInvites([...invites, { email, role }]);
    setEmail("");
    setError("");
  }

  function handleRemove(emailToRemove: string) {
    setInvites(invites.filter((inv) => inv.email !== emailToRemove));
  }

  async function handleSendInvites() {
    if (invites.length === 0) {
      onNext();
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invites }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send invites");
        setSending(false);
        return;
      }

      onNext();
    } catch {
      setError("Failed to send invites");
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Invite your team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add team members who will collaborate on content. You can always invite
          more people later.
        </p>
      </div>

      {/* Add invite form */}
      <div className="space-y-3">
        <Label>Add team member</Label>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Select value={role} onValueChange={(val) => { if (val) setRole(val); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleAdd}
            disabled={!email}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Role reference cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, name: "Admin", desc: "Manage team, agents, settings" },
            { icon: PenLine, name: "Editor", desc: "Create and edit content" },
            { icon: Eye, name: "Viewer", desc: "Read-only dashboard access" },
          ].map(({ icon: Icon, name, desc }) => (
            <div
              key={name}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-genesis-accent-subtle">
                <Icon className="h-4 w-4 text-genesis-accent" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">{name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite list */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <Label>Pending invites ({invites.length})</Label>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.email}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{inv.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {inv.role}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleRemove(inv.email)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSendInvites}
          disabled={sending}
          className="gap-2"
        >
          {invites.length > 0
            ? sending
              ? "Sending invites..."
              : `Send ${invites.length} invite${invites.length > 1 ? "s" : ""} & continue`
            : "Skip for now"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        {invites.length > 0 && (
          <Button variant="ghost" onClick={onNext}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
