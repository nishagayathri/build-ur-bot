"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  alertDot?: boolean;
}

export function SidebarNavItem({
  label,
  icon: Icon,
  href,
  badge,
  alertDot,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-[var(--radius-md)] transition-all duration-150 ease-out relative",
        isActive
          ? "bg-genesis-accent-subtle text-genesis-accent"
          : "text-text-2 hover:bg-surface-2 hover:text-text-1"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>

      {badge !== undefined && badge > 0 && (
        <span className="ml-auto rounded-[999px] px-2 py-0.5 text-[10px] leading-none font-semibold bg-error text-white">
          {badge}
        </span>
      )}

      {alertDot && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-error shadow-[0_0_0_2px_var(--surface-1)]" />
      )}
    </Link>
  );
}
