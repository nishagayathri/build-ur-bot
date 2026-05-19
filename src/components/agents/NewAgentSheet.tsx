"use client";

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { SkillsPickerGrid } from "@/components/skills/SkillsPickerGrid";
import { useAccountContext } from "@/context/AccountContext";
import {
  type SkillConfig,
  SKILL_DEFINITIONS,
  SKILL_TYPE_TO_ENUM,
} from "@/lib/skill-definitions";

interface NewAgentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAgentSheet({ open, onOpenChange }: NewAgentSheetProps) {
  const { activeAccount } = useAccountContext();
  const accountId = activeAccount?.id ?? null;
  const queryClient = useQueryClient();

  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [lockedSkillTypes, setLockedSkillTypes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch existing skill configs when sheet opens
  useEffect(() => {
    if (!open || !accountId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/accounts/${accountId}/skills`);
        const existing: { skill_type: string; enabled: boolean; config: Record<string, unknown> }[] =
          res.ok ? await res.json() : [];

        // Build a map of existing enabled skills (using enum values as keys)
        const existingMap = new Map(
          existing.map((s) => [s.skill_type, s]),
        );

        // Build the skills state: merge existing configs with defaults
        const locked = new Set<string>();
        const merged = SKILL_DEFINITIONS.map((def) => {
          const enumKey = SKILL_TYPE_TO_ENUM[def.skill_type];
          const existing = existingMap.get(enumKey);
          if (existing?.enabled) {
            locked.add(def.skill_type);
            return {
              skill_type: def.skill_type,
              enabled: true,
              config: (existing.config as Record<string, unknown>) ?? { ...def.defaultConfig },
            };
          }
          return {
            skill_type: def.skill_type,
            enabled: false,
            config: { ...def.defaultConfig },
          };
        });

        if (!cancelled) {
          setSkills(merged);
          setLockedSkillTypes(locked);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, accountId]);

  const handleSkillsChange = useCallback((next: SkillConfig[]) => {
    setSkills(next);
  }, []);

  const newlyEnabledCount = skills.filter(
    (s) => s.enabled && !lockedSkillTypes.has(s.skill_type),
  ).length;

  async function handleSave() {
    if (!accountId || newlyEnabledCount === 0) return;

    setSaving(true);
    try {
      const payload = skills.map((s) => ({
        ...s,
        skill_type: SKILL_TYPE_TO_ENUM[s.skill_type] ?? s.skill_type,
      }));

      const res = await fetch(`/api/accounts/${accountId}/agents-from-skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error || "Failed to create agents");
        setSaving(false);
        return;
      }

      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      toast.success(
        `${result.agents_created} agent${result.agents_created !== 1 ? "s" : ""} created`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Failed to create agents");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Skills &amp; Agents</SheetTitle>
          <SheetDescription>
            Enable new skills to create their corresponding agents. Already-active skills are locked.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SkillsPickerGrid
              skills={skills}
              onSkillsChange={handleSkillsChange}
              lockedSkillTypes={lockedSkillTypes}
            />
          )}
        </div>

        <SheetFooter>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={newlyEnabledCount === 0 || saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Add {newlyEnabledCount > 0 ? newlyEnabledCount : ""} Agent{newlyEnabledCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            {newlyEnabledCount === 0 && (
              <p className="text-xs text-muted-foreground">
                Enable at least 1 new skill
              </p>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
