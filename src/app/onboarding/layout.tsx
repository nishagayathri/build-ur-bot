import type { ReactNode } from "react";

/**
 * Onboarding layout — full-screen, no sidebar or persona rail.
 * Uses the same root HTML/body from the app layout but skips the main Layout chrome.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {children}
    </div>
  );
}
