"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountProvider } from "@/context/AccountContext";
import { PersonaProvider } from "@/context/PersonaContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { BreadcrumbProvider } from "@/context/BreadcrumbContext";
import { EventBusProvider } from "@/context/EventBusContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AccountProvider>
        <PersonaProvider>
          <SidebarProvider>
            <BreadcrumbProvider>
                <EventBusProvider>
                  <TooltipProvider>
                    {children}
                    <Toaster position="bottom-right" />
                  </TooltipProvider>
                </EventBusProvider>
            </BreadcrumbProvider>
          </SidebarProvider>
        </PersonaProvider>
      </AccountProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
