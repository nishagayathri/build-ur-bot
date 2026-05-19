"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { usePersonas } from "@/hooks/usePersonas";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { EntityRow } from "@/components/shared/EntityRow";
import { formatNumber } from "@/lib/format";

export default function PersonalitiesPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();
  const { data: personas, isLoading } = usePersonas();
  const router = useRouter();

  useEffect(() => {
    setBreadcrumbs([{ label: "Personalities" }]);
  }, [setBreadcrumbs]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Personalities</h1>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Persona
        </Button>
      </div>

      {!personas?.length ? (
        <EmptyState
          icon={Users}
          title="No personas"
          description="Add your first persona to get started."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {personas.map((persona) => (
            <EntityRow
              key={persona.persona_id}
              onClick={() =>
                router.push(`/personalities/${persona.persona_id}`)
              }
            >
              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-semibold text-xs"
                style={{ backgroundColor: persona.avatar_color }}
              >
                {persona.display_name.charAt(0)}
              </div>

              {/* Handle + display name */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[13px] truncate">
                  {persona.account_handle}
                </p>
                <p className="text-[11px] text-text-3 truncate">
                  {persona.display_name}
                </p>
              </div>

              {/* Platform */}
              <Badge
                variant="secondary"
                className="text-[11px] bg-surface-2 rounded px-1.5 shrink-0"
              >
                {persona.platform}
              </Badge>

              {/* Posts today */}
              <span className="text-[12px] text-text-3 shrink-0 w-24 text-right">
                {persona.posts_today}/{persona.max_posts_per_day} posts
              </span>

              {/* Avg impressions */}
              <span className="text-[12px] text-text-2 shrink-0 w-20 text-right">
                {formatNumber(persona.performance_7d.avg_impressions)} avg
              </span>
            </EntityRow>
          ))}
        </div>
      )}
    </div>
  );
}
