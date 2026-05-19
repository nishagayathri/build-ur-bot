"use client";

import type { ReactNode } from "react";

interface SidebarSectionProps {
  label: string;
  children: ReactNode;
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 px-3 py-1.5 mt-5">
        {label}
      </div>
      {children}
    </div>
  );
}
