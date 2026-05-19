"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AgentConfig } from "@/types";
import { usePersonas } from "@/hooks/usePersonas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentAdapterConfigProps {
  agent: AgentConfig;
  onInstrumentsChange?: (instruments: string[]) => void;
  onAdapterConfigChange?: (config: Record<string, unknown>) => void;
}

export function AgentAdapterConfig({ agent, onInstrumentsChange, onAdapterConfigChange }: AgentAdapterConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adapter Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {agent.desk === "DATA_DESK" && <DataDeskConfig agent={agent} onInstrumentsChange={onInstrumentsChange} />}
        {agent.desk === "CONTENT_DESK" && agent.name.includes("Writer") && (
          <WriterConfig agent={agent} />
        )}
        {agent.desk === "ENGAGEMENT_DESK" && agent.role === "competitor_tracking" && (
          <CompetitorMonitorConfig agent={agent} onAdapterConfigChange={onAdapterConfigChange} />
        )}
        {agent.desk === "ENGAGEMENT_DESK" && agent.role === "trend_surfacing" && (
          <TrendWatcherConfig />
        )}
        {agent.desk === "ENGAGEMENT_DESK" && agent.role === "auto_reply" && (
          <ReplyAgentConfig />
        )}
        {agent.desk === "EIC" && <EicConfig agent={agent} />}
      </CardContent>
    </Card>
  );
}

function DataDeskConfig({ agent, onInstrumentsChange }: { agent: AgentConfig; onInstrumentsChange?: (instruments: string[]) => void }) {
  const [instruments, setInstruments] = useState<string[]>(
    agent.instruments_watched
  );
  const [newInstrument, setNewInstrument] = useState("");

  const addInstrument = () => {
    const trimmed = newInstrument.trim();
    if (trimmed && !instruments.includes(trimmed)) {
      const next = [...instruments, trimmed];
      setInstruments(next);
      onInstrumentsChange?.(next);
      setNewInstrument("");
    }
  };

  const removeInstrument = (instrument: string) => {
    const next = instruments.filter((i) => i !== instrument);
    setInstruments(next);
    onInstrumentsChange?.(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Instruments watched</Label>
        <div className="flex flex-wrap gap-1.5">
          {instruments.map((inst) => (
            <span
              key={inst}
              className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px]"
            >
              {inst}
              <button
                type="button"
                onClick={() => removeInstrument(inst)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          value={newInstrument}
          onChange={(e) => setNewInstrument(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addInstrument();
          }}
          placeholder="Add instrument..."
          className="text-[13px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Scan interval</Label>
        <Select defaultValue="5min">
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1min">1 min</SelectItem>
            <SelectItem value="5min">5 min</SelectItem>
            <SelectItem value="15min">15 min</SelectItem>
            <SelectItem value="30min">30 min</SelectItem>
            <SelectItem value="1hr">1 hr</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Min confidence</Label>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            50
          </span>
        </div>
        <Slider defaultValue={[50]} min={0} max={100} />
      </div>

      <div className="space-y-2">
        <Label>Signal sources</Label>
        <div className="space-y-2">
          {(["PRICE", "NEWS", "SOCIAL_TREND"] as const).map((source) => (
            <label key={source} className="flex items-center gap-2 text-[13px]">
              <Checkbox defaultChecked />
              {source}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function WriterConfig({ agent }: { agent: AgentConfig }) {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Assigned persona</Label>
        <Select defaultValue={agent.assigned_persona ?? undefined}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personasList.map((p) => (
              <SelectItem key={p.persona_id} value={p.persona_id}>
                {p.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Temperature</Label>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            0.7
          </span>
        </div>
        <Slider defaultValue={[0.7]} min={0} max={1} step={0.1} />
      </div>

      <div className="flex items-center justify-between">
        <Label>Max drafts per hour</Label>
        <Input
          type="number"
          defaultValue={4}
          className="w-[80px] text-[13px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Revision limit</Label>
        <Select defaultValue="2">
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

type SocialPlatform = "X" | "INSTAGRAM" | "LINKEDIN";

interface CompetitorHandle {
  platform: SocialPlatform;
  handle: string;
}

interface CompetitorEntry {
  name: string;
  handles: CompetitorHandle[];
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  X: "X",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
};

function CompetitorMonitorConfig({
  agent,
  onAdapterConfigChange,
}: {
  agent: AgentConfig;
  onAdapterConfigChange?: (config: Record<string, unknown>) => void;
}) {
  const raw = agent.adapter_config ?? {};

  // Migrate legacy flat string[] to new structured format
  const initialCompetitors: CompetitorEntry[] = (() => {
    if (Array.isArray(raw.competitors)) return raw.competitors as CompetitorEntry[];
    if (Array.isArray(raw.competitor_handles)) {
      return (raw.competitor_handles as string[]).map((h) => ({
        name: h.replace(/^@/, ""),
        handles: [{ platform: "X" as SocialPlatform, handle: h.replace(/^@/, "") }],
      }));
    }
    return [];
  })();

  const [competitors, setCompetitors] = useState<CompetitorEntry[]>(initialCompetitors);

  // Add-form state
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("X");
  const [newHandle, setNewHandle] = useState("");
  // Extra platform rows for the add form
  const [extraHandles, setExtraHandles] = useState<CompetitorHandle[]>([]);

  const commit = (next: CompetitorEntry[]) => {
    setCompetitors(next);
    onAdapterConfigChange?.({ ...raw, competitors: next, competitor_handles: undefined });
  };

  const removeCompetitor = (index: number) => {
    commit(competitors.filter((_, i) => i !== index));
  };

  const removePlatformHandle = (compIndex: number, handleIndex: number) => {
    const next = competitors.map((c, i) =>
      i === compIndex
        ? { ...c, handles: c.handles.filter((_, j) => j !== handleIndex) }
        : c,
    );
    commit(next.filter((c) => c.handles.length > 0));
  };

  const addExtraHandle = () => {
    setExtraHandles([...extraHandles, { platform: "INSTAGRAM", handle: "" }]);
  };

  const updateExtraHandle = (i: number, field: keyof CompetitorHandle, value: string) => {
    setExtraHandles(extraHandles.map((h, idx) =>
      idx === i ? { ...h, [field]: value } : h,
    ));
  };

  const removeExtraHandle = (i: number) => {
    setExtraHandles(extraHandles.filter((_, idx) => idx !== i));
  };

  const addCompetitor = () => {
    const name = newName.trim();
    const handle = newHandle.trim().replace(/^@/, "");
    if (!name || !handle) return;

    const allHandles: CompetitorHandle[] = [
      { platform: newPlatform, handle },
      ...extraHandles
        .filter((h) => h.handle.trim())
        .map((h) => ({ ...h, handle: h.handle.trim().replace(/^@/, "") })),
    ];

    commit([...competitors, { name, handles: allHandles }]);
    setNewName("");
    setNewHandle("");
    setNewPlatform("X");
    setExtraHandles([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Competitors to monitor</Label>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Each competitor can have handles across multiple platforms.
        </p>
      </div>

      {/* Existing competitors */}
      {competitors.length > 0 && (
        <div className="space-y-2">
          {competitors.map((comp, ci) => (
            <div key={ci} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium">{comp.name}</span>
                <button
                  type="button"
                  onClick={() => removeCompetitor(ci)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {comp.handles.map((h, hi) => (
                  <span
                    key={hi}
                    className="flex items-center gap-1 rounded bg-background border border-border px-2 py-0.5 text-[11px]"
                  >
                    <span className="font-medium text-muted-foreground">{PLATFORM_LABELS[h.platform]}</span>
                    <span>@{h.handle}</span>
                    <button
                      type="button"
                      onClick={() => removePlatformHandle(ci, hi)}
                      className="text-muted-foreground hover:text-foreground ml-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add competitor form */}
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Add competitor</p>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Competitor name (e.g. Exness)"
          className="text-[13px]"
        />
        {/* Primary handle row */}
        <div className="flex gap-2">
          <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v as SocialPlatform)}>
            <SelectTrigger className="w-[130px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="X">X</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
            placeholder="@handle"
            className="text-[13px] flex-1"
          />
        </div>
        {/* Extra handle rows */}
        {extraHandles.map((h, i) => (
          <div key={i} className="flex gap-2">
            <Select value={h.platform} onValueChange={(v) => updateExtraHandle(i, "platform", v)}>
              <SelectTrigger className="w-[130px] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X">X</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={h.handle}
              onChange={(e) => updateExtraHandle(i, "handle", e.target.value)}
              placeholder="@handle"
              className="text-[13px] flex-1"
            />
            <button type="button" onClick={() => removeExtraHandle(i)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={addExtraHandle}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            + another platform
          </button>
          <button
            type="button"
            onClick={addCompetitor}
            disabled={!newName.trim() || !newHandle.trim()}
            className="ml-auto text-[12px] font-medium text-primary disabled:opacity-40"
          >
            Add competitor
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendWatcherConfig() {
  const [topics, setTopics] = useState<string[]>(["AI", "Crypto", "Macro"]);
  const [newTopic, setNewTopic] = useState("");

  const addTopic = () => {
    const trimmed = newTopic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Trend sources</Label>
        <div className="space-y-2">
          {["X", "Reddit", "StockTwits"].map((source) => (
            <label key={source} className="flex items-center gap-2 text-[13px]">
              <Checkbox defaultChecked />
              {source}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Velocity threshold</Label>
        <Input
          type="number"
          defaultValue={1000}
          className="w-[100px] text-[13px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Topics watched</Label>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <span
              key={topic}
              className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px]"
            >
              {topic}
              <button
                type="button"
                onClick={() => removeTopic(topic)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTopic();
          }}
          placeholder="Add topic..."
          className="text-[13px]"
        />
      </div>
    </div>
  );
}

function ReplyAgentConfig() {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Reply rate limit</Label>
        <Input
          type="number"
          defaultValue={10}
          className="w-[80px] text-[13px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Auto-reply</Label>
        <Switch defaultChecked />
      </div>

      <div className="flex items-center justify-between">
        <Label>Persona</Label>
        <Select defaultValue={personasList[0]?.persona_id}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personasList.map((p) => (
              <SelectItem key={p.persona_id} value={p.persona_id}>
                {p.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EicConfig({ agent }: { agent: AgentConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Decision model</Label>
        <Select defaultValue={agent.model}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-4-5-sonnet">claude-4-5-sonnet</SelectItem>
            <SelectItem value="claude-sonnet-4-6">claude-sonnet-4-6</SelectItem>
            <SelectItem value="gemini-3-pro-preview">gemini-3-pro-preview</SelectItem>
            <SelectItem value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</SelectItem>
            <SelectItem value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</SelectItem>
            <SelectItem value="gpt-5.4">gpt-5.4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Queue depth limit</Label>
        <Input
          type="number"
          defaultValue={8}
          className="w-[80px] text-[13px]"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Escalation timeout (min)</Label>
        <Input
          type="number"
          defaultValue={15}
          className="w-[80px] text-[13px]"
        />
      </div>

      <div className="space-y-4">
        <Label>Strategy weights</Label>
        {[
          { name: "Urgency", defaultVal: 70 },
          { name: "Engagement", defaultVal: 50 },
          { name: "Deriv Angle", defaultVal: 40 },
        ].map((weight) => (
          <div key={weight.name} className="space-y-1">
            <div className="flex items-center justify-between text-[13px]">
              <span>{weight.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {weight.defaultVal}
              </span>
            </div>
            <Slider defaultValue={[weight.defaultVal]} min={0} max={100} />
          </div>
        ))}
      </div>
    </div>
  );
}
