"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoryPatch } from "@/hooks/useStoryPatch";
import type { StoryObject, StoryStatus } from "@/types";

interface StoryActionButtonsProps {
  story: StoryObject;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  variant,
  trigger,
  onConfirm,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "destructive" | "default";
  trigger: React.ReactElement;
  onConfirm: () => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant={variant}
            disabled={loading}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StoryActionButtons({ story }: StoryActionButtonsProps) {
  const { patch, loading } = useStoryPatch(story.story_id);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  function moveTo(status: StoryStatus) {
    return () => patch({ status });
  }

  if (story.status === "HUMAN_REVIEW") {
    return (
      <div className="space-y-2">
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger render={<Button className="w-full" disabled={loading} />}>
            Approve → Schedule
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Publication</DialogTitle>
              <DialogDescription>
                Pick a date and time to publish this story.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="schedule-time">Publish at</Label>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                disabled={loading || !scheduledTime}
                onClick={() => {
                  patch({
                    status: "SCHEDULED",
                    scheduledTime: new Date(scheduledTime).toISOString(),
                  });
                  setScheduleOpen(false);
                  setScheduledTime("");
                }}
              >
                Confirm Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          disabled={loading}
          onClick={moveTo("REVISION")}
        >
          Request Revision
        </Button>

        <ConfirmDialog
          title="Kill this story?"
          description="This will permanently stop all work on this story. This action cannot be undone."
          confirmLabel="Kill Story"
          variant="destructive"
          loading={loading}
          trigger={
            <Button variant="destructive" className="w-full">
              Kill Story
            </Button>
          }
          onConfirm={moveTo("KILLED")}
        />
      </div>
    );
  }

  if (story.status === "REVISION") {
    return (
      <div className="space-y-2">
        <Button
          className="w-full"
          disabled={loading}
          onClick={moveTo("WRITING")}
        >
          Back to Writing
        </Button>

        <ConfirmDialog
          title="Kill this story?"
          description="This will cancel the revision and stop all work on this story."
          confirmLabel="Kill Story"
          variant="destructive"
          loading={loading}
          trigger={
            <Button variant="destructive" className="w-full">
              Kill Story
            </Button>
          }
          onConfirm={moveTo("KILLED")}
        />
      </div>
    );
  }

  if (story.status === "SCHEDULED") {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={moveTo("HUMAN_REVIEW")}
        >
          Unschedule
        </Button>

        <ConfirmDialog
          title="Kill this story?"
          description="This will cancel the scheduled publication and stop all work on this story."
          confirmLabel="Kill Story"
          variant="destructive"
          loading={loading}
          trigger={
            <Button variant="destructive" className="w-full">
              Kill Story
            </Button>
          }
          onConfirm={moveTo("KILLED")}
        />
      </div>
    );
  }

  if (story.status === "KILLED" || story.status === "REJECTED") {
    return (
      <Button
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={moveTo("DETECTED")}
      >
        Reactivate
      </Button>
    );
  }

  if (story.status === "WRITING") {
    return (
      <Button
        variant="outline"
        className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        disabled={loading}
        onClick={moveTo("HUMAN_REVIEW")}
      >
        Force Human Review
      </Button>
    );
  }

  if (story.status === "PUBLISHED") {
    return story.published_url ? (
      <a href={story.published_url} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full">
          View Published ↗
        </Button>
      </a>
    ) : null;
  }

  return null;
}
