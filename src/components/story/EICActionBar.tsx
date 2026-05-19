"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersonas } from "@/hooks/usePersonas";
import type { StoryObject } from "@/types";

interface EICActionBarProps {
  story: StoryObject;
}

export function EICActionBar({ story }: EICActionBarProps) {
  const queryClient = useQueryClient();
  const { data: personas = [] } = usePersonas();

  const [directive, setDirective] = useState(story.eic_directive ?? "");
  const [persona, setPersona] = useState(story.assigned_persona ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!story.eic_directive);

  const isReadOnly = !editing && !!story.eic_directive;

  async function handleApprove() {
    setSaving(true);
    try {
      await fetch(`/api/stories/${story.story_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "EIC_APPROVED",
          eicDirective: directive || null,
          assignedPersona: persona || null,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["stories", story.story_id] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDirective() {
    setSaving(true);
    try {
      await fetch(`/api/stories/${story.story_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eicDirective: directive || null,
          assignedPersona: persona || null,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["stories", story.story_id] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (isReadOnly) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase text-muted-foreground font-semibold tracking-[0.06em]">
            EIC Directive
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-muted-foreground hover:text-text-1 underline"
          >
            Edit
          </button>
        </div>
        <div className="bg-muted/30 border-l-2 border-purple-500 p-4 rounded-r-lg">
          <p className="italic text-[13px]">{story.eic_directive}</p>
        </div>
        {story.assigned_persona && (
          <p className="text-[12px] text-muted-foreground">
            Assigned to{" "}
            <span className="text-text-1 font-medium">@{story.assigned_persona}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <span className="text-[11px] uppercase text-muted-foreground font-semibold tracking-[0.06em]">
        EIC Brief
      </span>

      <Textarea
        placeholder="Write the editorial directive for this story — angle, tone, key points, hook..."
        value={directive}
        onChange={(e) => setDirective(e.target.value)}
        className="min-h-[80px] text-[13px] resize-none"
      />

      <div className="flex items-center gap-2">
        <Select value={persona} onValueChange={setPersona}>
          <SelectTrigger className="flex-1 text-[13px] h-8">
            <SelectValue placeholder="Assign persona..." />
          </SelectTrigger>
          <SelectContent>
            {personas.map((p) => (
              <SelectItem key={p.account_handle} value={p.account_handle}>
                @{p.account_handle} — {p.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {story.status === "EIC_APPROVED" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={handleSaveDirective}
            className="shrink-0"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={saving}
            onClick={handleApprove}
            className="shrink-0"
          >
            {saving ? "Approving…" : "EIC Approve →"}
          </Button>
        )}
      </div>
    </div>
  );
}
