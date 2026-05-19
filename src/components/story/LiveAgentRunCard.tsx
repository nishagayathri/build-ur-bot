"use client";

import { useState, useEffect, useRef } from "react";
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
import type { StoryObject } from "@/types";

interface LiveAgentRunCardProps {
  story: StoryObject;
}

const LOG_LINES = [
  "Analyzing stacked signals...",
  "Applying voice profile...",
  "Drafting opening hook...",
  "Checking regulatory compliance...",
  "Optimizing for engagement...",
  "Computing virality estimate...",
  "Finalizing draft structure...",
];

export function LiveAgentRunCard({ story }: LiveAgentRunCardProps) {
  const [logs, setLogs] = useState<string[]>([LOG_LINES[0]]);
  const [cancelled, setCancelled] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cancelled) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const next = LOG_LINES[prev.length % LOG_LINES.length];
        return [...prev, next];
      });
    }, 800);

    return () => clearInterval(interval);
  }, [cancelled]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const agentLabel = "Writer Agent";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
          </span>
          <span className="text-sm font-medium">
            {agentLabel} is working...
          </span>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={cancelled}
              >
                {cancelled ? "Cancelled" : "Cancel"}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel agent run?</DialogTitle>
              <DialogDescription>
                This will stop the {agentLabel.toLowerCase()} from completing its
                current task on &ldquo;{story.headline}&rdquo;. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Keep running
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  setCancelled(true);
                  setConfirmOpen(false);
                }}
              >
                Cancel run
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div
        ref={scrollRef}
        className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-auto font-mono text-xs text-muted-foreground space-y-1"
      >
        {logs.map((line, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-muted-foreground/50 select-none">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
