"use client";

import { Fragment } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function BreadcrumbBar() {
  const { breadcrumbs } = useBreadcrumbContext();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="px-8 py-2.5 border-b border-border flex items-center gap-1.5 text-[13px] text-text-3">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.label}>
          {index > 0 && <ChevronRight className="h-3 w-3 text-text-4" />}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-text-1 transition-colors duration-150 ease-out"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-text-1 font-medium">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
