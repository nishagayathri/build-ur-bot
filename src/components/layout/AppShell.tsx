"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAccountContext } from "@/context/AccountContext";
import { createClient } from "@/lib/supabase/client";
import { Layout } from "./Layout";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasNoAccounts, isLoading: accountsLoading } = useAccountContext();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAuthPage = pathname.startsWith("/auth");
  const isOnboardingPage = pathname.startsWith("/onboarding");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && !user && !isAuthPage) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, isAuthPage, router]);

  useEffect(() => {
    if (
      user &&
      !accountsLoading &&
      hasNoAccounts &&
      !isOnboardingPage &&
      !isAuthPage
    ) {
      router.push("/onboarding");
    }
  }, [user, accountsLoading, hasNoAccounts, isOnboardingPage, isAuthPage, router]);

  if (isAuthPage || isOnboardingPage) {
    return <>{children}</>;
  }

  if (authLoading || accountsLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-genesis-accent border-t-transparent" />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
