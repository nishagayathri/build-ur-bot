"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccountContext, type AccountSummary } from "@/context/AccountContext";
import { WizardShell } from "@/components/onboarding/WizardShell";
import { CreateAccountStep } from "@/components/onboarding/CreateAccountStep";
import { InviteTeamStep } from "@/components/onboarding/InviteTeamStep";
import { ConnectPlatformsStep } from "@/components/onboarding/ConnectPlatformsStep";
import { BrandProfileStep } from "@/components/onboarding/BrandProfileStep";
import { SkillsConfigStep } from "@/components/onboarding/SkillsConfigStep";
import { ReviewLaunchStep } from "@/components/onboarding/ReviewLaunchStep";

const STEPS = [
  { label: "Create Account", description: "Name your newsroom" },
  { label: "Invite the Team", description: "Add collaborators" },
  { label: "Connect Platforms", description: "Link social media" },
  { label: "Brand Profile", description: "Define your voice" },
  { label: "Skills & Tools", description: "Configure capabilities" },
  { label: "Review & Launch", description: "Go live" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { activeAccount, setActiveAccount, refetch } = useAccountContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [accountId, setAccountId] = useState<string | null>(
    activeAccount?.id ?? null
  );
  const initializedRef = useRef(false);
  const [skipError, setSkipError] = useState(false);

  const handleSkip = useCallback(async () => {
    setSkipError(false);
    const result = await refetch();
    if (result.data && result.data.length > 0) {
      router.push("/dashboard");
    } else {
      setSkipError(true);
    }
  }, [refetch, router]);

  // Resume at correct step ONLY on initial load — not on every refetch
  useEffect(() => {
    if (initializedRef.current) return;
    if (activeAccount && !activeAccount.onboardingComplete) {
      setAccountId(activeAccount.id);
      setCurrentStep(activeAccount.onboardingStep);
      initializedRef.current = true;
    }
  }, [activeAccount]);

  // If active account already completed onboarding, user is here to create a new account — start fresh
  useEffect(() => {
    if (initializedRef.current) return;
    if (activeAccount?.onboardingComplete) {
      setAccountId(null);
      setCurrentStep(1);
      initializedRef.current = true;
    }
  }, [activeAccount]);

  const persistStep = useCallback(
    async (step: number, accId: string) => {
      await fetch(`/api/accounts/${accId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingStep: step }),
      });
    },
    []
  );

  const handleNext = useCallback(() => {
    if (currentStep >= 6) return;
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    if (accountId) {
      persistStep(nextStep, accountId);
    }
  }, [currentStep, accountId, persistStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  const handleAccountCreated = useCallback(
    async (account: AccountSummary) => {
      setAccountId(account.id);
      initializedRef.current = true;
      const nextStep = 2;
      setCurrentStep(nextStep);
      // Persist step on the new account BEFORE refetching to avoid race
      await persistStep(nextStep, account.id);
      refetch();
    },
    [refetch, persistStep]
  );

  const handleLaunch = useCallback(async () => {
    const result = await refetch();
    // Update active account to the one we just launched
    const accounts = result.data as AccountSummary[] | undefined;
    const launched = accounts?.find((a: AccountSummary) => a.id === accountId);
    if (launched) setActiveAccount(launched);
    router.push(`/chat?launched=true&accountId=${accountId}`);
  }, [refetch, router, accountId, setActiveAccount]);

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onBack={handleBack}
    >
      {currentStep === 1 && (
        <>
          <CreateAccountStep onComplete={handleAccountCreated} />
          <div className="mt-6 text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              No thanks, I&apos;ve been invited to a workspace
            </button>
            {skipError && (
              <p className="mt-2 text-sm text-destructive">
                No workspaces found. Please create an account or ask your team to send an invite.
              </p>
            )}
          </div>
        </>
      )}
      {currentStep === 2 && accountId && (
        <InviteTeamStep accountId={accountId} onNext={handleNext} />
      )}
      {currentStep === 3 && accountId && (
        <ConnectPlatformsStep accountId={accountId} onNext={handleNext} />
      )}
      {currentStep === 4 && accountId && (
        <BrandProfileStep accountId={accountId} onNext={handleNext} />
      )}
      {currentStep === 5 && accountId && (
        <SkillsConfigStep accountId={accountId} onNext={handleNext} />
      )}
      {currentStep === 6 && accountId && (
        <ReviewLaunchStep accountId={accountId} onLaunch={handleLaunch} />
      )}
    </WizardShell>
  );
}
