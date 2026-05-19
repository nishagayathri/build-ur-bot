"use client";

import { SignalStack } from "@/components/shared/SignalStack";
import { AuditTrail } from "@/components/shared/AuditTrail";
import { Separator } from "@/components/ui/separator";
import { PipelineStepper } from "@/components/story/PipelineStepper";
import { EICActionBar } from "@/components/story/EICActionBar";
import { LiveAgentRunCard } from "@/components/story/LiveAgentRunCard";
import { DraftPostPreview } from "@/components/story/DraftPostPreview";
import { usePersonas } from "@/hooks/usePersonas";
import type { StoryObject } from "@/types";

interface StoryDetailProps {
  story: StoryObject;
}

const EIC_EDITABLE_STATUSES = new Set(["DETECTED", "RANKED", "EIC_APPROVED"]);

export function StoryDetail({ story }: StoryDetailProps) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const persona = story.assigned_persona
    ? personasList.find((p) => p.account_handle === story.assigned_persona)
    : undefined;

  const showEICActionBar = EIC_EDITABLE_STATUSES.has(story.status);
  const agentRunning =
    (story.status === "WRITING" || story.status === "REVISION") &&
    story.agent_run_status === "RUNNING";
  const showAgentCard = agentRunning;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{story.headline}</h1>

        <PipelineStepper status={story.status} />

      </div>

      <Separator />

      {/* EIC Action Bar — shown for DETECTED / RANKED / EIC_APPROVED */}
      {showEICActionBar && (
        <>
          <EICActionBar story={story} />
          <Separator />
        </>
      )}

      {/* Live agent card — shown while WRITING */}
      {showAgentCard && (
        <>
          <LiveAgentRunCard story={story} />
          <Separator />
        </>
      )}

      {/* Draft preview — shown once draft_content is populated */}
      {story.draft_content && (
        <>
          <DraftPostPreview content={story.draft_content} persona={persona} />
          <Separator />
        </>
      )}

      {/* Published link */}
      {story.status === "PUBLISHED" && story.published_url && (
        <>
          <div className="space-y-1">
            <span className="text-[11px] uppercase text-muted-foreground font-semibold tracking-[0.06em]">
              Published
            </span>
            <a
              href={story.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[13px] text-blue-400 hover:underline"
            >
              {story.published_url}
            </a>
          </div>
          <Separator />
        </>
      )}

      {/* Signals */}
      <SignalStack
        signals={story.signals_stacked}
        stackingScore={story.stacking_score}
      />

      <Separator />

      {/* Audit trail */}
      <AuditTrail entries={story.audit_trail} />
    </div>
  );
}
