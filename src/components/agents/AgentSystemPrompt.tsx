"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronRight, Pencil, X, RotateCcw, Save } from "lucide-react";
import type { AgentConfig } from "@/types";
import { useUpdateAgentPrompt } from "@/hooks/useAgentActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AgentSystemPromptProps {
  agent: AgentConfig;
}

function PromptSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
      </button>
      {open && (
        <div className="pb-3 text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

function parsePromptSections(prompt: string) {
  const sections: { title: string; content: string }[] = [];
  const lines = prompt.split("\n");

  let currentTitle = "Overview";
  let currentContent: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentContent.length > 0) {
        const text = currentContent.join("\n").trim();
        if (text) sections.push({ title: currentTitle, content: text });
      }
      currentTitle = h2Match[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    const text = currentContent.join("\n").trim();
    if (text) sections.push({ title: currentTitle, content: text });
  }

  return sections;
}

function formatContent(content: string) {
  return content.split("\n").map((line, i) => {
    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) {
      return (
        <div key={i} className="font-medium text-foreground mt-2 mb-1">
          {h3Match[1]}
        </div>
      );
    }

    const bulletMatch = line.match(/^(\s*)- \*\*(.+?)\*\*:?\s*(.*)$/);
    if (bulletMatch) {
      return (
        <div key={i} className={cn("flex gap-1.5", bulletMatch[1] && "pl-3")}>
          <span className="text-muted-foreground/60 shrink-0">-</span>
          <span>
            <span className="font-medium text-foreground">{bulletMatch[2]}</span>
            {bulletMatch[3] && `: ${bulletMatch[3]}`}
          </span>
        </div>
      );
    }

    const simpleBullet = line.match(/^(\s*)- (.+)$/);
    if (simpleBullet) {
      return (
        <div key={i} className={cn("flex gap-1.5", simpleBullet[1] && "pl-3")}>
          <span className="text-muted-foreground/60 shrink-0">-</span>
          <span>{simpleBullet[2]}</span>
        </div>
      );
    }

    const numberedMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*:?\s*(.*)$/);
    if (numberedMatch) {
      return (
        <div key={i} className="flex gap-1.5">
          <span className="text-muted-foreground/60 shrink-0 tabular-nums">
            {numberedMatch[1]}.
          </span>
          <span>
            <span className="font-medium text-foreground">{numberedMatch[2]}</span>
            {numberedMatch[3] && `: ${numberedMatch[3]}`}
          </span>
        </div>
      );
    }

    if (line.trim() === "") return <div key={i} className="h-2" />;

    return <div key={i}>{line}</div>;
  });
}

export function AgentSystemPrompt({ agent }: AgentSystemPromptProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(agent.system_prompt);
  const updatePrompt = useUpdateAgentPrompt(agent.agent_id);

  const sections = parsePromptSections(agent.system_prompt);

  function handleEdit() {
    setDraft(agent.system_prompt);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(agent.system_prompt);
    setEditing(false);
  }

  function handleSave() {
    updatePrompt.mutate(draft, {
      onSuccess: () => setEditing(false),
    });
  }

  function handleReset() {
    updatePrompt.mutate(null, {
      onSuccess: () => setEditing(false),
    });
  }

  return (
    <Card className="h-full flex flex-col">
      {agent.system_prompt_is_override && agent.role === "competitor_tracking" && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 flex items-start justify-between gap-3">
          <p className="text-[12px] text-amber-800 dark:text-amber-400 leading-snug">
            Custom prompt override is active — your configured competitor handles are being ignored.
          </p>
          <button
            type="button"
            onClick={() => updatePrompt.mutate(null)}
            disabled={updatePrompt.isPending}
            className="shrink-0 text-[11px] font-medium text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:opacity-70 disabled:opacity-40 whitespace-nowrap"
          >
            Reset to default
          </button>
        </div>
      )}
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          System Prompt
          {agent.system_prompt_is_override && (
            <Badge variant="secondary" className="text-[10px] ml-1">
              custom
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {editing ? (
              <>
                {agent.system_prompt_is_override && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[12px]"
                    onClick={handleReset}
                    disabled={updatePrompt.isPending}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[12px]"
                  onClick={handleCancel}
                  disabled={updatePrompt.isPending}
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-[12px]"
                  onClick={handleSave}
                  disabled={updatePrompt.isPending}
                >
                  <Save className="h-3 w-3" />
                  {updatePrompt.isPending ? "Saving…" : "Save"}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-[12px]"
                onClick={handleEdit}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        {editing ? (
          <textarea
            className="w-full h-full min-h-[400px] resize-none bg-transparent text-[13px] leading-relaxed font-mono text-foreground focus:outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
          />
        ) : (
          sections.map((section) => (
            <PromptSection key={section.title} title={section.title}>
              {formatContent(section.content)}
            </PromptSection>
          ))
        )}
      </CardContent>
    </Card>
  );
}
