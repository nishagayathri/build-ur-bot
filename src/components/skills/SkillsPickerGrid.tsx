"use client";

import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  type SkillConfig,
  type SkillDefinition,
  type ChipOption,
  type SocialPlatform,
  type CompetitorEntry,
  type CompetitorHandle,
  SKILL_DEFINITIONS,
  GROUPS,
  TIMEFRAME_OPTIONS,
  INDICATOR_OPTIONS,
  ECONOMY_OPTIONS,
  SENTIMENT_PLATFORM_OPTIONS,
} from "@/lib/skill-definitions";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MultiSelectChips({
  options,
  selected,
  onChange,
}: {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TagsInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addTag(inputValue);
        }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competitor tracking config
// ---------------------------------------------------------------------------

function CompetitorConfig({
  competitors,
  onChange,
}: {
  competitors: CompetitorEntry[];
  onChange: (next: CompetitorEntry[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("X");
  const [newHandle, setNewHandle] = useState("");
  const [extraHandles, setExtraHandles] = useState<CompetitorHandle[]>([]);

  const removeCompetitor = (i: number) => onChange(competitors.filter((_, idx) => idx !== i));

  const removePlatformHandle = (ci: number, hi: number) => {
    const next = competitors.map((c, i) =>
      i === ci ? { ...c, handles: c.handles.filter((_, j) => j !== hi) } : c,
    );
    onChange(next.filter((c) => c.handles.length > 0));
  };

  const addCompetitor = () => {
    const name = newName.trim();
    const handle = newHandle.trim().replace(/^@/, "");
    if (!name || !handle) return;
    const allHandles: CompetitorHandle[] = [
      { platform: newPlatform, handle },
      ...extraHandles.filter((h) => h.handle.trim()).map((h) => ({ ...h, handle: h.handle.trim().replace(/^@/, "") })),
    ];
    onChange([...competitors, { name, handles: allHandles }]);
    setNewName("");
    setNewHandle("");
    setNewPlatform("X");
    setExtraHandles([]);
  };

  return (
    <div className="space-y-3">
      {competitors.map((comp, ci) => (
        <div key={ci} className="rounded-lg border border-border bg-background px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-medium">{comp.name}</span>
            <button type="button" onClick={() => removeCompetitor(ci)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {comp.handles.map((h, hi) => (
              <span key={hi} className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-[11px]">
                <span className="font-medium text-muted-foreground">{h.platform}</span>
                <span>@{h.handle}</span>
                <button type="button" onClick={() => removePlatformHandle(ci, hi)} className="text-muted-foreground hover:text-foreground ml-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Add competitor</p>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Competitor name (e.g. Exness)"
          className="text-xs h-8"
        />
        <div className="flex gap-2">
          <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v as SocialPlatform)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
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
            className="text-xs h-8 flex-1"
          />
        </div>
        {extraHandles.map((h, i) => (
          <div key={i} className="flex gap-2">
            <Select value={h.platform} onValueChange={(v) => setExtraHandles(extraHandles.map((x, j) => j === i ? { ...x, platform: v as SocialPlatform } : x))}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
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
              onChange={(e) => setExtraHandles(extraHandles.map((x, j) => j === i ? { ...x, handle: e.target.value } : x))}
              placeholder="@handle"
              className="text-xs h-8 flex-1"
            />
            <button type="button" onClick={() => setExtraHandles(extraHandles.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-0.5">
          <button type="button" onClick={() => setExtraHandles([...extraHandles, { platform: "INSTAGRAM", handle: "" }])} className="text-[11px] text-muted-foreground hover:text-foreground">
            + another platform
          </button>
          <button
            type="button"
            onClick={addCompetitor}
            disabled={!newName.trim() || !newHandle.trim()}
            className="ml-auto text-[12px] font-medium text-primary disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config panels per skill type
// ---------------------------------------------------------------------------

function SkillConfigPanel({
  skill,
  config,
  onConfigChange,
}: {
  skill: SkillDefinition;
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}) {
  switch (skill.skill_type) {
    case "technical_analysis":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Timeframes</Label>
            <MultiSelectChips
              options={TIMEFRAME_OPTIONS}
              selected={(config.timeframes as string[]) ?? []}
              onChange={(v) => onConfigChange("timeframes", v)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Indicators</Label>
            <MultiSelectChips
              options={INDICATOR_OPTIONS}
              selected={(config.indicators as string[]) ?? []}
              onChange={(v) => onConfigChange("indicators", v)}
            />
          </div>
        </div>
      );

    case "news_monitoring":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sources</Label>
            <TagsInput
              tags={(config.sources as string[]) ?? []}
              onChange={(v) => onConfigChange("sources", v)}
              placeholder="Reuters, Bloomberg, CoinDesk..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Keyword filters</Label>
            <TagsInput
              tags={(config.keywords as string[]) ?? []}
              onChange={(v) => onConfigChange("keywords", v)}
              placeholder="Add keyword and press Enter"
            />
          </div>
        </div>
      );

    case "economic_calendar":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Economies</Label>
            <MultiSelectChips
              options={ECONOMY_OPTIONS}
              selected={(config.economies as string[]) ?? []}
              onChange={(v) => onConfigChange("economies", v)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Minimum impact level</Label>
            <Select
              value={config.min_impact as string}
              onValueChange={(v) => onConfigChange("min_impact", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select impact level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "earnings_calendar":
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Sectors</Label>
          <TagsInput
            tags={(config.sectors as string[]) ?? []}
            onChange={(v) => onConfigChange("sectors", v)}
            placeholder="Technology, Finance, Healthcare, Energy..."
          />
        </div>
      );

    case "social_sentiment":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Platforms</Label>
            <div className="flex flex-wrap gap-3">
              {SENTIMENT_PLATFORM_OPTIONS.map((opt) => {
                const platforms = (config.platforms as string[]) ?? [];
                const isChecked = platforms.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...platforms, opt.value]
                          : platforms.filter((p) => p !== opt.value);
                        onConfigChange("platforms", next);
                      }}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Keywords</Label>
            <TagsInput
              tags={(config.keywords as string[]) ?? []}
              onChange={(v) => onConfigChange("keywords", v)}
              placeholder="Add keyword and press Enter"
            />
          </div>
        </div>
      );

    case "regulatory_monitor":
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Jurisdictions</Label>
          <TagsInput
            tags={(config.jurisdictions as string[]) ?? []}
            onChange={(v) => onConfigChange("jurisdictions", v)}
            placeholder="SEC, CFTC, FCA, ESMA..."
          />
        </div>
      );

    case "auto_reply":
      return (
        <div className="flex items-center justify-between">
          <Label className="text-sm">Match account voice tone</Label>
          <Switch
            checked={config.match_voice_tone as boolean ?? true}
            onCheckedChange={(checked) =>
              onConfigChange("match_voice_tone", checked)
            }
            size="sm"
          />
        </div>
      );

    case "competitor_tracking":
      return (
        <CompetitorConfig
          competitors={(config.competitors as CompetitorEntry[]) ?? []}
          onChange={(v) => onConfigChange("competitors", v)}
        />
      );

    case "trend_surfacing":
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Minimum volume threshold</Label>
          <Input
            type="number"
            min={0}
            value={config.min_volume as number ?? 1000}
            onChange={(e) =>
              onConfigChange("min_volume", Number(e.target.value))
            }
            placeholder="1000"
          />
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Skill card
// ---------------------------------------------------------------------------

function SkillCard({
  definition,
  skillConfig,
  onToggle,
  onConfigChange,
  locked,
}: {
  definition: SkillDefinition;
  skillConfig: SkillConfig;
  onToggle: () => void;
  onConfigChange: (key: string, value: unknown) => void;
  locked?: boolean;
}) {
  const Icon = definition.icon;
  const isEnabled = skillConfig.enabled;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isEnabled
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            isEnabled
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight">
              {definition.name}
            </h4>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              size="sm"
              disabled={locked}
            />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {definition.description}
          </p>
        </div>
      </div>

      {isEnabled && definition.hasConfig && !locked && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <SkillConfigPanel
            skill={definition}
            config={skillConfig.config}
            onConfigChange={onConfigChange}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main grid component
// ---------------------------------------------------------------------------

export interface SkillsPickerGridProps {
  skills: SkillConfig[];
  onSkillsChange: (skills: SkillConfig[]) => void;
  lockedSkillTypes?: Set<string>;
}

export function SkillsPickerGrid({
  skills,
  onSkillsChange,
  lockedSkillTypes,
}: SkillsPickerGridProps) {
  function toggleSkill(skillType: string) {
    onSkillsChange(
      skills.map((s) =>
        s.skill_type === skillType ? { ...s, enabled: !s.enabled } : s
      )
    );
  }

  function updateConfig(skillType: string, key: string, value: unknown) {
    onSkillsChange(
      skills.map((s) =>
        s.skill_type === skillType
          ? { ...s, config: { ...s.config, [key]: value } }
          : s
      )
    );
  }

  return (
    <div className="space-y-10">
      {GROUPS.map((group, groupIdx) => {
        const groupSkills = SKILL_DEFINITIONS.filter(
          (d) => d.group === group.key
        );

        return (
          <div key={group.key} className="space-y-4">
            {groupIdx > 0 && <Separator />}
            <div>
              <h3 className="text-base font-semibold">{group.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {groupSkills.map((def) => {
                const skillConfig = skills.find(
                  (s) => s.skill_type === def.skill_type
                )!;
                const isLocked = lockedSkillTypes?.has(def.skill_type) ?? false;
                return (
                  <SkillCard
                    key={def.skill_type}
                    definition={def}
                    skillConfig={skillConfig}
                    onToggle={() => toggleSkill(def.skill_type)}
                    onConfigChange={(key, value) =>
                      updateConfig(def.skill_type, key, value)
                    }
                    locked={isLocked}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
