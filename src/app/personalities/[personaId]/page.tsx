"use client";

import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PersonaDetailLayout } from "@/components/personalities/PersonaDetailLayout";

export default function PersonaDetailPage({
  params,
}: {
  params: Promise<{ personaId: string }>;
}) {
  const { personaId } = React.use(params);
  const { setBreadcrumbs } = useBreadcrumbContext();
  const { data: persona, isLoading, isError } = usePersona(personaId);

  useEffect(() => {
    if (persona) {
      setBreadcrumbs([
        { label: "Personalities", href: "/personalities" },
        { label: persona.account_handle },
      ]);
    }
  }, [persona, setBreadcrumbs]);

  if (isLoading) return <PageSkeleton />;

  if (isError || !persona) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Persona not found"
        description="This persona may have been removed or the link is invalid."
      />
    );
  }

  return <PersonaDetailLayout persona={persona} />;
}
