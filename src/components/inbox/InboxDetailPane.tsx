"use client";

import { useState } from "react";
import type { StoryObject } from "@/types";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EntityChip } from "@/components/shared/EntityChip";
import { SignalStack } from "@/components/shared/SignalStack";
import { AuditTrail } from "@/components/shared/AuditTrail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface InboxDetailPaneProps {
  story: StoryObject;
  onApprove: (scheduledTime: string) => void;
  onRevision: () => void;
  onKill: () => void;
  loading?: boolean;
}

export function InboxDetailPane({
  story,
  onApprove,
  onRevision,
  onKill,
  loading,
}: InboxDetailPaneProps) {
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <h2 className="text-xl font-semibold">{story.headline}</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={story.priority} />
          <StatusBadge status={story.status} />
          <EntityChip entity={story.entity} entityType={story.entity_type} />
        </div>

        {story.draft_content && (
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Draft Preview</h4>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
              {story.draft_content}
            </p>
          </div>
        )}

        <SignalStack
          signals={story.signals_stacked}
          stackingScore={story.stacking_score}
        />

        <AuditTrail entries={story.audit_trail} />
      </div>

      <div className="flex items-center gap-3 p-4 border-t border-border bg-background sticky bottom-0">
        <Button
          disabled={loading}
          onClick={() => setScheduleDialogOpen(true)}
          className="bg-primary"
        >
          Approve → Schedule
        </Button>
        <Button
          variant="outline"
          className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          disabled={loading}
          onClick={onRevision}
        >
          Request Revision
        </Button>
        <Button
          variant="destructive"
          disabled={loading}
          onClick={() => setKillDialogOpen(true)}
        >
          Kill Story
        </Button>
      </div>

      {/* Schedule dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Publication</DialogTitle>
            <DialogDescription>
              Pick a date and time to publish this story.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="inbox-schedule-time">Publish at</Label>
            <Input
              id="inbox-schedule-time"
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScheduleDialogOpen(false);
                setScheduledTime("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={loading || !scheduledTime}
              onClick={() => {
                onApprove(new Date(scheduledTime).toISOString());
                setScheduleDialogOpen(false);
                setScheduledTime("");
              }}
            >
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kill confirmation dialog */}
      <Dialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Kill</DialogTitle>
            <DialogDescription>
              This will permanently kill the story &quot;{story.headline}&quot;.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKillDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => {
                setKillDialogOpen(false);
                onKill();
              }}
            >
              Kill Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
