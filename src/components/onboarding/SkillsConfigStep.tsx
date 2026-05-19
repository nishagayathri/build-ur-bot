"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  type SkillConfig,
  SKILL_DEFINITIONS,
  SKILL_TYPE_TO_ENUM,
} from "@/lib/skill-definitions";
import { SkillsPickerGrid } from "@/components/skills/SkillsPickerGrid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillsConfigStepProps {
  accountId: string;
  onNext: () => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SkillsConfigStep({ accountId, onNext }: SkillsConfigStepProps) {
  const [skills, setSkills] = useState<SkillConfig[]>(() =>
    SKILL_DEFINITIONS.map((def) => ({
      skill_type: def.skill_type,
      enabled: false,
      config: { ...def.defaultConfig },
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const enabledCount = skills.filter((s) => s.enabled).length;

  const handleSkillsChange = useCallback((next: SkillConfig[]) => {
    setSkills(next);
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const payload = skills.map((s) => ({
        ...s,
        skill_type: SKILL_TYPE_TO_ENUM[s.skill_type] ?? s.skill_type,
      }));
      const res = await fetch(`/api/accounts/${accountId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error || "Failed to save skill configuration"
        );
        setSaving(false);
        return;
      }

      onNext();
    } catch {
      setError("Failed to save skill configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Skills &amp; Tools
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which AI capabilities your newsroom should have. You can always
          change these later.
        </p>
      </div>

      {/* Skills grid */}
      <SkillsPickerGrid
        skills={skills}
        onSkillsChange={handleSkillsChange}
      />

      {/* Footer */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={enabledCount === 0 || saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save &amp; Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        {enabledCount === 0 && (
          <p className="text-xs text-muted-foreground">
            Enable at least 1 skill to continue
          </p>
        )}
        {enabledCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {enabledCount} skill{enabledCount !== 1 ? "s" : ""} enabled
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
