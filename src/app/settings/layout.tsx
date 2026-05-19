"use client";

import { useEffect, type ReactNode } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Users, Link2, FileText, Wrench, Bot, Building2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SETTINGS_NAV = [
  { href: "/settings", label: "Workspace", icon: Building2, exact: true },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/connections", label: "Connections", icon: Link2 },
  { href: "/settings/profile", label: "Brand Profile", icon: FileText },
  { href: "/settings/skills", label: "Skills & Tools", icon: Wrench },
  { href: "/settings/agents", label: "Agents", icon: Bot },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { setBreadcrumbs } = useBreadcrumbContext();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    setBreadcrumbs([{ label: "Settings" }]);
  }, [setBreadcrumbs]);

  return (
    <div className="flex gap-8">
      <nav className="w-48 shrink-0 flex flex-col gap-1">
        {SETTINGS_NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </nav>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
