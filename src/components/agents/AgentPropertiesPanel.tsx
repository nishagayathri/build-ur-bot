"use client";

import type { AgentConfig } from "@/types";
import { agentStatusConfig } from "@/lib/status-colors";
import { AgentIdentity } from "@/components/shared/AgentIdentity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentPropertiesPanelProps {
  agent: AgentConfig;
  onFieldChange?: (field: string, value: unknown) => void;
}

export function AgentPropertiesPanel({ agent, onFieldChange }: AgentPropertiesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <Label>Desk</Label>
          <Select defaultValue={agent.desk}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DATA_DESK">Data Desk</SelectItem>
              <SelectItem value="CONTENT_DESK">Content Desk</SelectItem>
              <SelectItem value="ENGAGEMENT_DESK">Engagement Desk</SelectItem>
              <SelectItem value="EIC">Editor-in-Chief</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <Label>Role</Label>
          <Input
            defaultValue={agent.role}
            className="max-w-[300px] text-[13px]"
            onChange={(e) => onFieldChange?.("role", e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <Label>Model</Label>
          <Select defaultValue={agent.model} onValueChange={(v) => onFieldChange?.("model", v)}>
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

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <Label>Adapter</Label>
          <Select defaultValue={agent.adapter_type}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="process">process</SelectItem>
              <SelectItem value="http">http</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <Label>Status</Label>
          <AgentIdentity
            name={agentStatusConfig[agent.status].label}
            desk={agent.desk}
            status={agent.status}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <Label>Enabled</Label>
          <Switch
            defaultChecked={agent.enabled}
            onCheckedChange={(v) => onFieldChange?.("enabled", v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
