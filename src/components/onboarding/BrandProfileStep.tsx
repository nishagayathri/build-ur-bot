"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Instrument resolution types
// ---------------------------------------------------------------------------

type ResolutionStatus = "checking" | "known" | "unrecognized";

interface MarketTag {
  raw: string;
  status: ResolutionStatus;
  canonical: string | null;
}
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface BrandProfileStepProps {
  accountId: string;
  onNext: () => void;
}

const VOICE_PERSONALITIES = [
  {
    id: "authoritative_expert",
    label: "Authoritative Expert",
    description: "Deep analysis, institutional-grade insight",
  },
  {
    id: "approachable_educator",
    label: "Approachable Educator",
    description: "Making complex markets accessible",
  },
  {
    id: "bold_contrarian",
    label: "Bold Contrarian",
    description: "Challenging consensus with data-backed takes",
  },
  {
    id: "data_driven_analyst",
    label: "Data-Driven Analyst",
    description: "Numbers first, opinion second",
  },
  {
    id: "community_insider",
    label: "Community Insider",
    description: "In the trenches with traders",
  },
  {
    id: "breaking_news_reporter",
    label: "Breaking News Reporter",
    description: "First to report, fastest to update",
  },
] as const;

type VoicePersonalityId = (typeof VOICE_PERSONALITIES)[number]["id"];

const CONTENT_GOALS = [
  "Brand awareness & thought leadership",
  "Drive traffic to website/platform",
  "Grow community & engagement",
  "Generate leads/signups",
  "Educate audience",
  "Promote products/services",
  "Real-time market commentary",
] as const;

const REACTION_SPEEDS = [
  { id: "immediate", label: "Immediate", description: "Publish within minutes" },
  { id: "fast", label: "Fast", description: "Review & publish within an hour" },
  { id: "measured", label: "Measured", description: "Thoughtful turnaround, 2-4 hrs" },
  { id: "next_window", label: "Next Window", description: "Queued for next scheduled slot" },
] as const;

type ReactionSpeed = (typeof REACTION_SPEEDS)[number]["id"];

const PREDICTION_SENSITIVITY_OPTIONS = [
  {
    id: "conservative",
    label: "Conservative",
    description: "Avoid directional language. Stick to factual reporting only.",
  },
  {
    id: "moderate",
    label: "Moderate",
    description: "Allow hedged outlooks (\"may\", \"could\") backed by data.",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    description: "Allow confident directional calls when data supports it.",
  },
] as const;

type PredictionSensitivity = (typeof PREDICTION_SENSITIVITY_OPTIONS)[number]["id"];

const APPROVAL_MODES = [
  {
    id: "all",
    label: "All content",
    description: "Every piece of content requires human approval before publishing.",
  },
  {
    id: "high_critical",
    label: "HIGH/CRITICAL only",
    description: "Auto-publish routine content. Flag sensitive or market-moving pieces.",
  },
  {
    id: "trust_agents",
    label: "Trust the agents",
    description: "Fully autonomous publishing. Agents handle scheduling & compliance.",
  },
] as const;

type ApprovalMode = (typeof APPROVAL_MODES)[number]["id"];

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface FormState {
  // Section A — markets are tracked separately via marketTags state
  target_audience: string;
  editorial_angle: string;
  brand_name: string;
  website_url: string;
  one_liner: string;
  // Section B
  voice_personality: VoicePersonalityId | null;
  secondary_voice: VoicePersonalityId | null;
  admired_accounts: string[];
  // Section C
  content_goals: string[];
  content_goals_ranking: Record<string, number>;
  reaction_speed: ReactionSpeed | null;
  // Section D
  is_regulated: boolean;
  jurisdiction: string;
  required_disclaimers: string[];
  off_limits_topics: string[];
  prediction_sensitivity: PredictionSensitivity | null;
  approval_mode: ApprovalMode | null;
}

function initialState(): FormState {
  return {
    target_audience: "",
    editorial_angle: "",
    brand_name: "",
    website_url: "",
    one_liner: "",
    voice_personality: null,
    secondary_voice: null,
    admired_accounts: [],
    content_goals: [],
    content_goals_ranking: {},
    reaction_speed: null,
    is_regulated: false,
    jurisdiction: "",
    required_disclaimers: [],
    off_limits_topics: [],
    prediction_sensitivity: null,
    approval_mode: null,
  };
}

type SectionId = "A" | "B" | "C" | "D";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "A", label: "Identity & Positioning" },
  { id: "B", label: "Voice & Tone" },
  { id: "C", label: "Content Strategy" },
  { id: "D", label: "Compliance & Guardrails" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components for tag inputs
// ---------------------------------------------------------------------------

function TagInput({
  tags,
  onChange,
  placeholder,
  max,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  max?: number;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      if (max && tags.length >= max) return;
      if (tags.includes(trimmed)) return;
      onChange([...tags, trimmed]);
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={max !== undefined && tags.length >= max}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BrandProfileStep({ accountId, onNext }: BrandProfileStepProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(["A"])
  );
  const [showBrandInfo, setShowBrandInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marketTags, setMarketTags] = useState<MarketTag[]>([]);
  const [marketInput, setMarketInput] = useState("");

  // Updater helper
  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Market tag resolution
  // ---------------------------------------------------------------------------

  // marketTags is the single source of truth for the markets field.
  // form.markets is derived from it in handleSave — no separate sync needed.

  const addMarketTag = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (marketTags.some((t) => t.raw.toLowerCase() === trimmed.toLowerCase()))
        return;

      setMarketTags((prev) => [
        ...prev,
        { raw: trimmed, status: "checking", canonical: null },
      ]);

      try {
        const res = await fetch("/api/instruments/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markets: [trimmed] }),
        });
        const data = await res.json();
        const result = data.results?.[0];
        setMarketTags((prev) =>
          prev.map((t) =>
            t.raw === trimmed
              ? {
                  raw: trimmed,
                  status: result?.status === "KNOWN" ? "known" : "unrecognized",
                  canonical: result?.canonical ?? null,
                }
              : t
          )
        );
      } catch {
        // Fail open — keep the tag, mark as unrecognized
        setMarketTags((prev) =>
          prev.map((t) =>
            t.raw === trimmed ? { ...t, status: "unrecognized" } : t
          )
        );
      }
    },
    [marketTags]
  );

  const removeMarketTag = useCallback((raw: string) => {
    setMarketTags((prev) => prev.filter((t) => t.raw !== raw));
  }, []);

  // ---------------------------------------------------------------------------
  // Section completeness checks
  // ---------------------------------------------------------------------------

  function isSectionComplete(id: SectionId): boolean {
    switch (id) {
      case "A":
        return (
          marketTags.length > 0 &&
          form.target_audience.trim().length > 0 &&
          form.editorial_angle.trim().length > 0
        );
      case "B":
        return form.voice_personality !== null;
      case "C":
        return form.content_goals.length > 0 && form.reaction_speed !== null;
      case "D":
        return (
          form.prediction_sensitivity !== null && form.approval_mode !== null
        );
      default:
        return false;
    }
  }

  function toggleSection(id: SectionId) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Content goals toggle + ranking
  // ---------------------------------------------------------------------------

  function toggleGoal(goal: string) {
    setForm((prev) => {
      const exists = prev.content_goals.includes(goal);
      let goals: string[];
      let ranking = { ...prev.content_goals_ranking };

      if (exists) {
        goals = prev.content_goals.filter((g) => g !== goal);
        delete ranking[goal];
        // Re-rank remaining
        const sorted = goals
          .map((g) => ({ goal: g, rank: ranking[g] ?? 999 }))
          .sort((a, b) => a.rank - b.rank);
        ranking = {};
        sorted.forEach((item, i) => {
          ranking[item.goal] = i + 1;
        });
      } else {
        if (prev.content_goals.length >= 3) return prev;
        goals = [...prev.content_goals, goal];
        ranking[goal] = goals.length;
      }

      return { ...prev, content_goals: goals, content_goals_ranking: ranking };
    });
  }

  function setGoalRank(goal: string, rank: number) {
    setForm((prev) => ({
      ...prev,
      content_goals_ranking: { ...prev.content_goals_ranking, [goal]: rank },
    }));
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const canSubmit =
    marketTags.length > 0 &&
    form.target_audience.trim().length > 0 &&
    form.editorial_angle.trim().length > 0 &&
    form.voice_personality !== null;

  async function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload = {
        // Identity & Positioning
        // Use canonical name when resolved, fall back to raw input
        markets: marketTags.map((t) => t.canonical ?? t.raw),
        target_audience: form.target_audience,
        editorial_angle: form.editorial_angle,
        brand_name: form.brand_name || null,
        brand_website: form.website_url || null,
        brand_one_liner: form.one_liner || null,
        // Voice & Tone
        voice_personality: form.voice_personality,
        secondary_voice: form.secondary_voice,
        admired_accounts: form.admired_accounts,
        // Content Strategy
        content_goals: form.content_goals,
        content_goals_ranking: form.content_goals_ranking,
        reaction_speed: form.reaction_speed ?? "FAST",
        // Compliance & Guardrails
        is_regulated: form.is_regulated,
        regulatory_jurisdiction: form.jurisdiction || null,
        required_disclaimers: form.required_disclaimers,
        off_limits_topics: form.off_limits_topics,
        prediction_sensitivity: form.prediction_sensitivity ?? "MODERATE",
        approval_requirement: form.approval_mode ?? "ALL",
      };
      const res = await fetch(`/api/accounts/${accountId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      onNext();
    } catch {
      // Allow retry
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderSectionHeader(section: { id: SectionId; label: string }) {
    const isOpen = openSections.has(section.id);
    const complete = isSectionComplete(section.id);
    return (
      <button
        type="button"
        onClick={() => toggleSection(section.id)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <Badge
          variant={complete ? "default" : "outline"}
          className="h-6 w-6 shrink-0 justify-center rounded-md p-0 text-xs"
        >
          {complete ? <Check className="h-3 w-3" /> : section.id}
        </Badge>
        <span className="flex-1 text-lg font-medium">{section.label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION A: Identity & Positioning
  // ---------------------------------------------------------------------------

  function renderSectionA() {
    return (
      <div className="space-y-8 pb-2">
        {/* Markets */}
        <div className="space-y-2">
          <Label htmlFor="markets">Markets you cover *</Label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 min-h-[42px]">
            {marketTags.map((tag) => (
              <span
                key={tag.raw}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                  tag.status === "checking" && "bg-muted text-muted-foreground",
                  tag.status === "known" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
                  tag.status === "unrecognized" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                )}
                title={
                  tag.status === "unrecognized"
                    ? "Not recognised as a financial instrument — agents may not be able to query this"
                    : tag.canonical
                    ? `Resolved: ${tag.canonical}`
                    : undefined
                }
              >
                {tag.status === "checking" && (
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                )}
                {tag.status === "unrecognized" && (
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                )}
                {tag.canonical ?? tag.raw}
                <button
                  type="button"
                  onClick={() => removeMarketTag(tag.raw)}
                  className="ml-0.5 rounded-full hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              id="markets"
              type="text"
              value={marketInput}
              onChange={(e) => setMarketInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const val = marketInput.replace(/,$/, "").trim();
                  if (val) {
                    addMarketTag(val);
                    setMarketInput("");
                  }
                }
                if (e.key === "Backspace" && !marketInput && marketTags.length > 0) {
                  const last = marketTags[marketTags.length - 1];
                  removeMarketTag(last.raw);
                }
              }}
              onBlur={() => {
                const val = marketInput.trim();
                if (val) {
                  addMarketTag(val);
                  setMarketInput("");
                }
              }}
              placeholder={marketTags.length === 0 ? "e.g. Forex, BTC/USD, S&P 500 — press Enter to add" : ""}
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {marketTags.some((t) => t.status === "unrecognized") && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Some entries weren&apos;t recognised as financial instruments. Your agents won&apos;t be able to query them — update or remove them before launching.
            </p>
          )}
          {marketTags.every((t) => t.status !== "unrecognized") && marketTags.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add more markets.
            </p>
          )}
          {marketTags.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Type a market or instrument name and press Enter.
            </p>
          )}
        </div>

        <Separator />

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="target-audience">Primary target audience *</Label>
          <Input
            id="target-audience"
            value={form.target_audience}
            onChange={(e) => set("target_audience", e.target.value)}
            placeholder="e.g., Retail traders, Institutional investors, Crypto beginners"
          />
          <p className="text-xs text-muted-foreground">
            Describe who your content is primarily for.
          </p>
        </div>

        <Separator />

        {/* Editorial Angle */}
        <div className="space-y-2">
          <Label htmlFor="editorial-angle">Editorial angle *</Label>
          <Textarea
            id="editorial-angle"
            value={form.editorial_angle}
            onChange={(e) => set("editorial_angle", e.target.value)}
            placeholder="e.g., We cover forex from a macro perspective, focusing on emerging market currencies and central bank policy divergence"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Describe your editorial focus and what makes your perspective unique.
          </p>
        </div>

        <Separator />

        {/* Brand Info (optional collapsible) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowBrandInfo(!showBrandInfo)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {showBrandInfo ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Brand information (optional)
          </button>
          {showBrandInfo && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand name</Label>
                <Input
                  id="brand-name"
                  value={form.brand_name}
                  onChange={(e) => set("brand_name", e.target.value)}
                  placeholder="e.g., Deriv Markets"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  type="url"
                  value={form.website_url}
                  onChange={(e) => set("website_url", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="one-liner">One-liner</Label>
                <Input
                  id="one-liner"
                  value={form.one_liner}
                  onChange={(e) => set("one_liner", e.target.value)}
                  placeholder="A brief description of what you do"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION B: Voice & Tone
  // ---------------------------------------------------------------------------

  function renderSectionB() {
    return (
      <div className="space-y-8 pb-2">
        {/* Voice Personality */}
        <div className="space-y-3">
          <Label>Primary voice personality *</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {VOICE_PERSONALITIES.map((vp) => (
              <button
                key={vp.id}
                type="button"
                onClick={() => set("voice_personality", vp.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  form.voice_personality === vp.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <div className="text-sm font-medium">{vp.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {vp.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {form.voice_personality && (
          <div className="space-y-3">
            <Label>Secondary voice (optional)</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VOICE_PERSONALITIES.filter(
                (vp) => vp.id !== form.voice_personality
              ).map((vp) => (
                <button
                  key={vp.id}
                  type="button"
                  onClick={() =>
                    set(
                      "secondary_voice",
                      form.secondary_voice === vp.id ? null : vp.id
                    )
                  }
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    form.secondary_voice === vp.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <div className="text-sm font-medium">{vp.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {vp.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Admired Accounts */}
        <div className="space-y-2">
          <Label>Admired accounts</Label>
          <p className="text-xs text-muted-foreground">
            Accounts whose voice or content you admire. Max 5.
          </p>
          <TagInput
            tags={form.admired_accounts}
            onChange={(tags) => set("admired_accounts", tags)}
            placeholder="@handle — press Enter to add"
            max={5}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION C: Content Strategy
  // ---------------------------------------------------------------------------

  function renderSectionC() {
    return (
      <div className="space-y-8 pb-2">
        {/* Content Goals */}
        <div className="space-y-3">
          <Label>Content goals (pick up to 3 and rank them)</Label>
          <div className="space-y-2">
            {CONTENT_GOALS.map((goal) => {
              const isSelected = form.content_goals.includes(goal);
              const rank = form.content_goals_ranking[goal];
              return (
                <div
                  key={goal}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                  <span className="flex-1 text-sm">{goal}</span>
                  {isSelected && rank != null && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {rank}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Reaction Speed */}
        <div className="space-y-3">
          <Label>Reaction speed</Label>
          <div className="grid grid-cols-2 gap-3">
            {REACTION_SPEEDS.map((speed) => (
              <button
                key={speed.id}
                type="button"
                onClick={() => set("reaction_speed", speed.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  form.reaction_speed === speed.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <div className="text-sm font-medium">{speed.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {speed.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION D: Compliance & Guardrails
  // ---------------------------------------------------------------------------

  function renderSectionD() {
    return (
      <div className="space-y-8 pb-2">
        {/* Regulated Entity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Regulated entity</Label>
            <Switch
              checked={form.is_regulated}
              onCheckedChange={(checked) => set("is_regulated", checked)}
            />
          </div>
          {form.is_regulated && (
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                value={form.jurisdiction}
                onChange={(e) => set("jurisdiction", e.target.value)}
                placeholder="e.g., SEC (US), FCA (UK), CySEC (EU)"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Required Disclaimers */}
        <div className="space-y-2">
          <Label>Required disclaimers</Label>
          <TagInput
            tags={form.required_disclaimers}
            onChange={(tags) => set("required_disclaimers", tags)}
            placeholder="Type disclaimer text, press Enter to add"
          />
        </div>

        <Separator />

        {/* Off-limits Topics */}
        <div className="space-y-2">
          <Label>Off-limits topics</Label>
          <TagInput
            tags={form.off_limits_topics}
            onChange={(tags) => set("off_limits_topics", tags)}
            placeholder="e.g., specific tickers, competitors — press Enter"
          />
        </div>

        <Separator />

        {/* Prediction Sensitivity */}
        <div className="space-y-3">
          <Label>Prediction sensitivity</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PREDICTION_SENSITIVITY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set("prediction_sensitivity", option.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  form.prediction_sensitivity === option.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Human Approval */}
        <div className="space-y-3">
          <Label>Human approval mode</Label>
          <div className="space-y-2">
            {APPROVAL_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => set("approval_mode", mode.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  form.approval_mode === mode.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    form.approval_mode === mode.id
                      ? "border-primary bg-primary"
                      : "border-input"
                  )}
                >
                  {form.approval_mode === mode.id && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{mode.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {mode.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }


  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Brand profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This questionnaire configures your AI agents. The more detail you
          provide, the better they perform.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div
              key={section.id}
              className="rounded-lg border border-border bg-background"
            >
              <div className="px-4">{renderSectionHeader(section)}</div>
              {isOpen && (
                <>
                  <Separator />
                  <div className="px-4 pt-4 pb-5">
                    {section.id === "A" && renderSectionA()}
                    {section.id === "B" && renderSectionB()}
                    {section.id === "C" && renderSectionC()}
                    {section.id === "D" && renderSectionD()}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2 pb-8">
        <Button
          onClick={handleSave}
          disabled={!canSubmit || saving}
          className="min-w-[160px]"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
